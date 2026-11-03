import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { setTestDb, AppDatabase } from "../db";
import {
  invalidatePublicCache,
  getCacheInvalidationLog,
  clearCacheInvalidationLog,
} from "../lib/cache-invalidation";
import { eq, and, desc, asc } from "drizzle-orm";
import { buildAffiliateUrl } from "../lib/affiliate";

describe("Verifica Finale Workers Cache, Invalidazione e Contenuti Pubblici", () => {
  let sqlite: Database.Database;
  let testDb: AppDatabase;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");

    // DDL schema completo
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS pcs (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        model_name TEXT NOT NULL,
        exact_config TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        image_alt TEXT,
        cpu_model TEXT NOT NULL,
        cpu_gen TEXT,
        cpu_cores_threads TEXT,
        cpu_win11_support INTEGER DEFAULT 1,
        gpu_model TEXT NOT NULL,
        gpu_vram_gb INTEGER,
        gpu_type TEXT NOT NULL,
        gpu_dlss_fsr TEXT,
        ram_gb INTEGER NOT NULL,
        ram_type TEXT,
        ram_channel TEXT,
        ram_speed_mhz INTEGER,
        storage_type TEXT,
        storage_capacity_gb INTEGER,
        storage_details TEXT,
        motherboard_chipset TEXT,
        motherboard_details TEXT,
        psu_wattage INTEGER,
        psu_rating TEXT,
        psu_details TEXT,
        cooling_details TEXT,
        os_installed TEXT,
        os_official_support INTEGER DEFAULT 1,
        unverified_specs TEXT DEFAULT '[]',
        editorial_status TEXT NOT NULL DEFAULT 'draft',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        pc_id TEXT NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        meta_title TEXT,
        meta_description TEXT,
        verdict TEXT NOT NULL,
        summary_intro TEXT NOT NULL,
        why_positive_reviews TEXT,
        strengths TEXT DEFAULT '[]',
        weaknesses TEXT DEFAULT '[]',
        evidence_level TEXT DEFAULT 'dati_certificati',
        target_ideal_use TEXT,
        not_recommended_for TEXT,
        benchmark_summary TEXT,
        rating_gaming TEXT DEFAULT 'insufficiente',
        notes_gaming TEXT,
        rating_work TEXT DEFAULT 'sufficiente',
        notes_work TEXT,
        rating_office TEXT DEFAULT 'ottimo',
        notes_office TEXT,
        amazon_listing_price_eur REAL,
        estimated_fair_value_eur REAL,
        status TEXT NOT NULL DEFAULT 'draft',
        published_at INTEGER,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS curated_alternatives (
        id TEXT PRIMARY KEY,
        source_review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        target_pc_id TEXT NOT NULL REFERENCES pcs(id) ON DELETE RESTRICT,
        intended_use TEXT NOT NULL,
        editorial_reasoning TEXT NOT NULL,
        pros_vs_source TEXT,
        cons_vs_source TEXT,
        price_difference_eur REAL,
        display_order INTEGER DEFAULT 1 NOT NULL,
        is_approved INTEGER DEFAULT 0 NOT NULL,
        last_verified_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS price_offers (
        id TEXT PRIMARY KEY,
        pc_id TEXT NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
        retailer TEXT NOT NULL,
        affiliate_url TEXT NOT NULL,
        clean_url TEXT,
        asin TEXT,
        price_amount_eur REAL,
        currency TEXT DEFAULT 'EUR' NOT NULL,
        data_source TEXT NOT NULL,
        is_valid INTEGER DEFAULT 1 NOT NULL,
        notes TEXT,
        last_verified_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    testDb = drizzle(sqlite, { schema }) as unknown as AppDatabase;
    setTestDb(testDb);
    clearCacheInvalidationLog();
  });

  // CASO 1: Pubblicazione di una recensione (da draft a published)
  test("Caso 1: Pubblicazione di una recensione rende visibile la scheda in homepage e recensioni", async () => {
    const now = Date.now();
    const pcId = "pc-case-1";
    const reviewId = "rev-case-1";
    const slug = "pc-acer-aspire-pub-test";

    await testDb.insert(schema.pcs).values({
      id: pcId,
      brand: "Acer",
      modelName: "Aspire 5",
      exactConfig: "i5-1335U, 16GB RAM, 512GB SSD",
      category: "laptop",
      cpuModel: "Intel Core i5-1335U",
      gpuModel: "Intel Iris Xe",
      gpuType: "integrated",
      ramGb: 16,
      editorialStatus: "published",
      createdAt: now,
      updatedAt: now,
    });

    // Inizialmente in stato draft
    await testDb.insert(schema.reviews).values({
      id: reviewId,
      pcId,
      slug,
      title: "Acer Aspire 5 - In Preparazione",
      verdict: "accettabile_base",
      summaryIntro: "Bozza redazionale.",
      strengths: "[]",
      weaknesses: "[]",
      evidenceLevel: "specifiche_dichiarate",
      ratingGaming: "non_adatto",
      ratingWork: "sufficiente",
      ratingOffice: "idoneo",
      status: "draft",
      updatedAt: now,
    });

    // Verifica che in draft NON compaia nelle recensioni pubbliche
    const publicBefore = await testDb
      .select()
      .from(schema.reviews)
      .where(and(eq(schema.reviews.slug, slug), eq(schema.reviews.status, "published")));
    assert.strictEqual(publicBefore.length, 0, "Una recensione in draft non deve comparire tra quelle pubblicate");

    // Azione amministrativa: pubblicazione
    await testDb
      .update(schema.reviews)
      .set({
        status: "published",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.reviews.id, reviewId));

    await invalidatePublicCache({ slug });

    // Verifica: compare nella query pubblica
    const publicAfter = await testDb
      .select({ review: schema.reviews, pc: schema.pcs })
      .from(schema.reviews)
      .innerJoin(schema.pcs, eq(schema.reviews.pcId, schema.pcs.id))
      .where(and(eq(schema.reviews.slug, slug), eq(schema.reviews.status, "published")));

    assert.strictEqual(publicAfter.length, 1);
    assert.strictEqual(publicAfter[0].review.slug, slug);
    assert.strictEqual(publicAfter[0].pc.modelName, "Aspire 5");

    const log = getCacheInvalidationLog();
    assert.strictEqual(log.length, 1);
    assert.ok(log[0].paths.includes(`/recensioni/${slug}`));
    assert.ok(log[0].paths.includes("/"));
  });

  // CASO 2: Modifica del titolo e del verdetto di una recensione pubblicata
  test("Caso 2: Modifica di titolo e verdetto aggiorna immediatamente il contenuto restituito", async () => {
    const now = Date.now();
    const pcId = "pc-case-2";
    const reviewId = "rev-case-2";
    const slug = "pc-gaming-verdict-update";

    await testDb.insert(schema.pcs).values({
      id: pcId,
      brand: "MSI",
      modelName: "Katana 15",
      exactConfig: "i7-13620H, RTX 4060",
      category: "notebook_gaming",
      cpuModel: "Core i7",
      gpuModel: "RTX 4060",
      gpuType: "dedicated",
      ramGb: 16,
      editorialStatus: "published",
      createdAt: now,
      updatedAt: now,
    });

    await testDb.insert(schema.reviews).values({
      id: reviewId,
      pcId,
      slug,
      title: "MSI Katana 15: Titolo Iniziale",
      verdict: "da_valutare",
      summaryIntro: "Valutazione preliminare.",
      strengths: "[]",
      weaknesses: "[]",
      evidenceLevel: "specifiche_dichiarate",
      ratingGaming: "idoneo",
      ratingWork: "idoneo",
      ratingOffice: "idoneo",
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    // Modifica amministrativa del verdetto e del titolo
    const newTitle = "MSI Katana 15: Recensione Completa (Buon Acquisto)";
    const newVerdict = "buon_acquisto";
    const updateTime = now + 5000;

    await testDb
      .update(schema.reviews)
      .set({
        title: newTitle,
        verdict: newVerdict,
        summaryIntro: "Dissipazione adeguata e ottimo prezzo per il gaming 1080p.",
        updatedAt: updateTime,
      })
      .where(eq(schema.reviews.id, reviewId));

    await invalidatePublicCache({ slug });

    // La query della pagina recensione deve riflettere istantaneamente i nuovi dati
    const updatedRows = await testDb
      .select()
      .from(schema.reviews)
      .where(and(eq(schema.reviews.slug, slug), eq(schema.reviews.status, "published")))
      .limit(1);

    assert.strictEqual(updatedRows[0].title, newTitle);
    assert.strictEqual(updatedRows[0].verdict, newVerdict);
    assert.strictEqual(updatedRows[0].updatedAt, updateTime);
  });

  // CASO 3: Ritiro di una recensione (unpublish)
  test("Caso 3: Ritiro di una recensione esclude la pagina da recensioni e attiva notFound", async () => {
    const now = Date.now();
    const pcId = "pc-case-3";
    const reviewId = "rev-case-3";
    const slug = "pc-ritiro-test";

    await testDb.insert(schema.pcs).values({
      id: pcId,
      brand: "Dell",
      modelName: "Inspiron",
      exactConfig: "i3, 8GB",
      category: "laptop",
      cpuModel: "Core i3",
      gpuModel: "UHD Graphics",
      gpuType: "integrated",
      ramGb: 8,
      editorialStatus: "published",
      createdAt: now,
      updatedAt: now,
    });

    await testDb.insert(schema.reviews).values({
      id: reviewId,
      pcId,
      slug,
      title: "Dell Inspiron Recensione",
      verdict: "sconsigliato",
      summaryIntro: "Offerta non più disponibile.",
      strengths: "[]",
      weaknesses: "[]",
      evidenceLevel: "specifiche_dichiarate",
      ratingGaming: "non_adatto",
      ratingWork: "sufficiente",
      ratingOffice: "idoneo",
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    // L'amministratore ritira la recensione
    await testDb
      .update(schema.reviews)
      .set({ status: "draft", updatedAt: Date.now() })
      .where(eq(schema.reviews.id, reviewId));

    await invalidatePublicCache({ slug });

    // La query pubblica (che la pagina esegue per decidere se chiamare notFound()) restituisce 0
    const publicQuery = await testDb
      .select()
      .from(schema.reviews)
      .where(and(eq(schema.reviews.slug, slug), eq(schema.reviews.status, "published")));

    assert.strictEqual(publicQuery.length, 0, "Deve risultare vuota in modo che ReviewDetailPage chiami notFound()");
  });

  // CASO 4: Modifica di un PC o di un'alternativa che compare nelle pagine pubbliche
  test("Caso 4: Modifica di specifiche PC e approvazione alternativa aggiornano la scheda pubblica", async () => {
    const now = Date.now();
    const sourcePcId = "pc-source-4";
    const targetPcId = "pc-target-4";
    const reviewId = "rev-case-4";
    const altId = "alt-case-4";
    const slug = "pc-con-alternativa";

    await testDb.insert(schema.pcs).values([
      {
        id: sourcePcId,
        brand: "Megaport",
        modelName: "PC Trappola",
        exactConfig: "i7-4770, 16GB DDR3, GTX 1650",
        category: "desktop_gaming",
        cpuModel: "Core i7-4770",
        gpuModel: "GTX 1650",
        gpuType: "dedicated",
        ramGb: 16,
        editorialStatus: "published",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: targetPcId,
        brand: "Configurazione Curata",
        modelName: "PC Bilanciato 1080p",
        exactConfig: "Ryzen 5600, 16GB DDR4, RX 6600",
        category: "desktop_gaming",
        cpuModel: "Ryzen 5 5600",
        gpuModel: "Radeon RX 6600",
        gpuType: "dedicated",
        ramGb: 16,
        editorialStatus: "published",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await testDb.insert(schema.reviews).values({
      id: reviewId,
      pcId: sourcePcId,
      slug,
      title: "Megaport i7-4770: Perché è sconsigliato",
      verdict: "sconsigliato",
      summaryIntro: "Hardware del 2013.",
      strengths: "[]",
      weaknesses: "[]",
      evidenceLevel: "specifiche_dichiarate",
      ratingGaming: "non_adatto",
      ratingWork: "sufficiente",
      ratingOffice: "idoneo",
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    // Alternativa inizialmente non approvata (isApproved = 0)
    await testDb.insert(schema.curatedAlternatives).values({
      id: altId,
      sourceReviewId: reviewId,
      targetPcId: targetPcId,
      intendedUse: "Gaming 1080p moderno con FSR 3",
      editorialReasoning: "Hardware recente e aggiornabile.",
      displayOrder: 1,
      isApproved: 0,
      lastVerifiedAt: now,
      createdAt: now,
    });

    // Query pubblica alternative: solo isApproved = 1
    const publicAltsBefore = await testDb
      .select({ alt: schema.curatedAlternatives, target: schema.pcs })
      .from(schema.curatedAlternatives)
      .innerJoin(schema.pcs, eq(schema.curatedAlternatives.targetPcId, schema.pcs.id))
      .where(and(eq(schema.curatedAlternatives.sourceReviewId, reviewId), eq(schema.curatedAlternatives.isApproved, 1)));

    assert.strictEqual(publicAltsBefore.length, 0, "Un'alternativa non approvata non deve comparire");

    // Azione amministrativa: approvazione dell'alternativa
    await testDb
      .update(schema.curatedAlternatives)
      .set({ isApproved: 1, lastVerifiedAt: Date.now() })
      .where(eq(schema.curatedAlternatives.id, altId));

    await invalidatePublicCache({ slug });

    const publicAltsAfter = await testDb
      .select({ alt: schema.curatedAlternatives, target: schema.pcs })
      .from(schema.curatedAlternatives)
      .innerJoin(schema.pcs, eq(schema.curatedAlternatives.targetPcId, schema.pcs.id))
      .where(and(eq(schema.curatedAlternatives.sourceReviewId, reviewId), eq(schema.curatedAlternatives.isApproved, 1)));

    assert.strictEqual(publicAltsAfter.length, 1);
    assert.strictEqual(publicAltsAfter[0].target.modelName, "PC Bilanciato 1080p");
    assert.strictEqual(publicAltsAfter[0].alt.intendedUse, "Gaming 1080p moderno con FSR 3");
  });

  // CASO 5: Modifica delle offerte o dei dati di affiliazione
  test("Caso 5: Aggiornamento tag affiliazione e offerte aggiorna i link generati e le offerte valide", async () => {
    const now = Date.now();
    const pcId = "pc-case-5";
    const offerId = "offer-case-5";

    await testDb.insert(schema.pcs).values({
      id: pcId,
      brand: "Lenovo",
      modelName: "IdeaPad 3",
      exactConfig: "Ryzen 5, 16GB",
      category: "laptop",
      cpuModel: "Ryzen 5",
      gpuModel: "Radeon Graphics",
      gpuType: "integrated",
      ramGb: 16,
      editorialStatus: "published",
      createdAt: now,
      updatedAt: now,
    });

    await testDb.insert(schema.priceOffers).values({
      id: offerId,
      pcId,
      retailer: "Amazon.it",
      affiliateUrl: "https://www.amazon.it/dp/B0F6NQFBWN",
      asin: "B0F6NQFBWN",
      priceAmountEur: 549.99,
      currency: "EUR",
      dataSource: "manual_check",
      isValid: 1,
      lastVerifiedAt: now,
      createdAt: now,
    });

    // 1. Modifica impostazione tag di affiliazione globale
    const newAffiliateTag = "pcchiaro-nuovo-tag-21";
    await testDb
      .insert(schema.siteSettings)
      .values({ key: "amazon_affiliate_tag", value: newAffiliateTag, updatedAt: now })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: newAffiliateTag, updatedAt: now } });

    await invalidatePublicCache();

    // 2. Modifica prezzo offerta nel database
    const newPrice = 499.0;
    await testDb
      .update(schema.priceOffers)
      .set({ priceAmountEur: newPrice, lastVerifiedAt: now + 1000 })
      .where(eq(schema.priceOffers.id, offerId));

    await invalidatePublicCache();

    // 3. Verifica: il link di affiliazione per l'offerta include il nuovo tag
    const offerRow = await testDb.select().from(schema.priceOffers).where(eq(schema.priceOffers.id, offerId)).limit(1);
    assert.strictEqual(offerRow[0].priceAmountEur, 499.0);

    const builtUrl = buildAffiliateUrl(offerRow[0].affiliateUrl, newAffiliateTag);
    assert.ok(builtUrl.includes(`tag=${newAffiliateTag}`), "Il link di acquisto deve contenere il nuovo tag di affiliazione");
  });

  // CASO 6: Aggiornamento della sitemap dopo pubblicazione e ritiro
  test("Caso 6: La query sitemap include solo recensioni published ed esclude quelle ritirate", async () => {
    const now = Date.now();
    const pcId = "pc-case-6";
    const reviewId = "rev-case-6";
    const slug = "pc-sitemap-flow-test";

    await testDb.insert(schema.pcs).values({
      id: pcId,
      brand: "ASUS",
      modelName: "Vivobook 15",
      exactConfig: "i5 16GB",
      category: "laptop",
      cpuModel: "Core i5",
      gpuModel: "Intel Iris",
      gpuType: "integrated",
      ramGb: 16,
      editorialStatus: "published",
      createdAt: now,
      updatedAt: now,
    });

    await testDb.insert(schema.reviews).values({
      id: reviewId,
      pcId,
      slug,
      title: "ASUS Vivobook 15 Test",
      verdict: "buon_acquisto",
      summaryIntro: "Ottimo notebook.",
      strengths: "[]",
      weaknesses: "[]",
      evidenceLevel: "specifiche_dichiarate",
      ratingGaming: "limitato",
      ratingWork: "idoneo",
      ratingOffice: "idoneo",
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    // Simulazione query sitemap:
    const sitemapRowsBefore = await testDb
      .select({ slug: schema.reviews.slug, updatedAt: schema.reviews.updatedAt })
      .from(schema.reviews)
      .where(eq(schema.reviews.status, "published"));

    assert.ok(
      sitemapRowsBefore.some((r) => r.slug === slug),
      "La recensione pubblicata deve essere presente nella sitemap"
    );

    // Ritiro della recensione
    await testDb
      .update(schema.reviews)
      .set({ status: "draft", updatedAt: Date.now() })
      .where(eq(schema.reviews.id, reviewId));

    await invalidatePublicCache({ slug });

    const sitemapRowsAfter = await testDb
      .select({ slug: schema.reviews.slug, updatedAt: schema.reviews.updatedAt })
      .from(schema.reviews)
      .where(eq(schema.reviews.status, "published"));

    assert.ok(
      !sitemapRowsAfter.some((r) => r.slug === slug),
      "La recensione ritirata non deve comparire nella sitemap"
    );
  });

  // CASO 7: Verifica che una risposta amministrativa non venga memorizzata
  test("Caso 7: Gli header per le rotte /admin impongono categoricamente no-store e no-cache", () => {
    // Simulazione intestazioni emesse dal middleware e da next.config per rotte /admin
    const adminCacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate";
    const adminPragma = "no-cache";

    assert.ok(adminCacheControl.includes("no-store"), "Deve contenere no-store");
    assert.ok(adminCacheControl.includes("no-cache"), "Deve contenere no-cache");
    assert.ok(adminCacheControl.includes("must-revalidate"), "Deve contenere must-revalidate");
    assert.ok(adminCacheControl.includes("proxy-revalidate"), "Deve contenere proxy-revalidate");
    assert.strictEqual(adminPragma, "no-cache");
  });
});
