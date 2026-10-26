import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import {
  parseAmazonListing,
  extractAsinFromUrl,
  ExtractedHardwarePackage,
} from "../lib/amazon-extractor";

describe("Test Modulo Estrazione & Importazione Amazon (PC, Recensione, Fonti, Offerta)", () => {
  let sqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  before(() => {
    sqlite = new Database(":memory:");
    testDb = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE pcs (
        id TEXT PRIMARY KEY NOT NULL,
        brand TEXT NOT NULL,
        model_name TEXT NOT NULL,
        exact_config TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        image_alt TEXT,
        cpu_model TEXT NOT NULL,
        cpu_gen TEXT,
        cpu_cores_threads TEXT,
        cpu_win11_support INTEGER,
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
        os_official_support INTEGER,
        unverified_specs TEXT,
        editorial_status TEXT DEFAULT 'draft' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE reviews (
        id TEXT PRIMARY KEY NOT NULL,
        pc_id TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        meta_title TEXT,
        meta_description TEXT,
        verdict TEXT NOT NULL,
        summary_intro TEXT NOT NULL,
        why_positive_reviews TEXT,
        strengths TEXT NOT NULL,
        weaknesses TEXT NOT NULL,
        evidence_level TEXT NOT NULL,
        rating_gaming TEXT NOT NULL,
        notes_gaming TEXT,
        rating_work TEXT NOT NULL,
        notes_work TEXT,
        rating_office TEXT NOT NULL,
        notes_office TEXT,
        amazon_listing_price_eur REAL,
        estimated_fair_value_eur REAL,
        status TEXT DEFAULT 'draft' NOT NULL,
        published_at INTEGER,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (pc_id) REFERENCES pcs(id) ON DELETE CASCADE
      );

      CREATE TABLE sources (
        id TEXT PRIMARY KEY NOT NULL,
        review_id TEXT NOT NULL,
        url TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        consulted_at INTEGER NOT NULL,
        notes TEXT NOT NULL,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      );

      CREATE TABLE price_offers (
        id TEXT PRIMARY KEY NOT NULL,
        pc_id TEXT NOT NULL,
        retailer TEXT NOT NULL,
        affiliate_url TEXT NOT NULL,
        clean_url TEXT,
        asin TEXT,
        price_amount_eur REAL,
        currency TEXT DEFAULT 'EUR' NOT NULL,
        data_source TEXT DEFAULT 'manual_check' NOT NULL,
        is_valid INTEGER DEFAULT 1 NOT NULL,
        notes TEXT,
        last_verified_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (pc_id) REFERENCES pcs(id) ON DELETE CASCADE
      );
    `);
  });

  after(() => {
    sqlite.close();
  });

  test("Estrazione ASIN da diversi formati di URL Amazon", () => {
    const u1 = "https://www.amazon.it/Megaport-PC-Gaming-i7-GTX1650/dp/B07S7C3S9F?ref=xyz";
    const u2 = "https://www.amazon.it/gp/product/B09XYZ1234/";
    const u3 = "https://amazon.it/dp/B000TESTAS";

    assert.equal(extractAsinFromUrl(u1), "B07S7C3S9F");
    assert.equal(extractAsinFromUrl(u2), "B09XYZ1234");
    assert.equal(extractAsinFromUrl(u3), "B000TESTAS");
  });

  test("Estrazione e analisi euristica da testo o HTML Amazon con CPU datata (trappola hardware)", () => {
    const mockHtml = `
      <span id="productTitle">Megaport PC Gaming Intel Core i7-4770 • GTX 1650 4GB • 16GB DDR3 • 512GB SSD • Windows 11</span>
      <table>
        <tr><th>Marchio</th><td>Megaport</td></tr>
        <tr><th>Processore</th><td>Intel Core i7-4770</td></tr>
        <tr><th>Scheda grafica</th><td>NVIDIA GeForce GTX 1650 4GB</td></tr>
        <tr><th>Dimensioni RAM</th><td>16 GB DDR3</td></tr>
        <tr><th>Descrizione Hard-Disk</th><td>SSD 512GB</td></tr>
      </table>
      <span class="a-price-whole">549</span>
    `;

    const pkg = parseAmazonListing(mockHtml, "https://www.amazon.it/dp/B07S7C3S9F");

    // Verifica estrazione PC
    assert.equal(pkg.pc.brand, "Megaport");
    assert.equal(pkg.pc.cpuModel, "Intel Core i7-4770");
    assert.equal(pkg.pc.cpuWin11Support, 0, "CPU i7-4770 del 2013 non deve avere supporto ufficiale a Win 11");
    assert.equal(pkg.pc.gpuVramGb, 4);
    assert.equal(pkg.pc.ramGb, 16);
    assert.equal(pkg.pc.ramType, "DDR3");
    assert.equal(pkg.pc.storageCapacityGb, 512);

    // Verifica bozza recensione: deve rilevare il verdetto 'sconsigliato' e generare semaforo
    assert.equal(pkg.review.verdict, "sconsigliato");
    assert.equal(pkg.review.ratingGaming, "limitato");
    assert.equal(pkg.review.ratingOffice, "idoneo");
    assert.equal(pkg.review.status, "draft");
    assert.ok(pkg.review.weaknesses.length > 0);

    // Verifica offerta commerciale
    assert.equal(pkg.offer.asin, "B07S7C3S9F");
    assert.equal(pkg.offer.priceAmountEur, 549);

    // Verifica generazione automatica fonti
    assert.ok(pkg.sources.length >= 2, "Devono essere generate almeno 2 fonti (Amazon + Datasheet CPU)");
    assert.ok(pkg.sources.some((s) => s.sourceType === "inserzione_commerciale"));
    assert.ok(pkg.sources.some((s) => s.sourceType === "produttore"));
  });

  test("Salvataggio transazionale completo del pacchetto nel database (PCS, REVIEWS, SOURCES, PRICE_OFFERS)", () => {
    const now = Date.now();
    const pkg: ExtractedHardwarePackage = {
      extractedAt: now,
      asin: "B0TESTIMPORT",
      sourceUrl: "https://www.amazon.it/dp/B0TESTIMPORT",
      pc: {
        brand: "TestAssembler",
        modelName: "Gaming Setup 2026",
        exactConfig: "i5-12400F / RTX 4060 / 16GB DDR4 / 1TB NVMe",
        category: "desktop_gaming",
        cpuModel: "Intel Core i5-12400F",
        cpuGen: "12ª Gen (Alder Lake)",
        cpuWin11Support: 1,
        gpuModel: "RTX 4060 8GB",
        gpuVramGb: 8,
        gpuType: "dedicated",
        ramGb: 16,
        ramType: "DDR4",
        ramChannel: "dual",
        storageType: "NVMe",
        storageCapacityGb: 1000,
        osInstalled: "Windows 11 Home",
        osOfficialSupport: 1,
        unverifiedSpecs: ["Alimentatore 650W marca non specificata"],
        editorialStatus: "draft",
      },
      review: {
        slug: "testassembler-gaming-setup-i5-rtx-4060",
        title: "TestAssembler Gaming Setup i5 + RTX 4060",
        summaryIntro: "Configurazione moderna ed equilibrata per 1080p high.",
        strengths: ["Supporto Windows 11 nativo", "8GB VRAM con DLSS 3"],
        weaknesses: ["Alimentatore generico"],
        evidenceLevel: "specifiche_dichiarate",
        verdict: "buon_acquisto",
        ratingGaming: "idoneo",
        notesGaming: "Ottimo per 1080p ad alti frame rate.",
        ratingWork: "idoneo",
        notesWork: "CUDA core e 16GB RAM idonei.",
        ratingOffice: "idoneo",
        notesOffice: "Perfetto per multitasking.",
        status: "draft",
      },
      offer: {
        retailer: "Amazon.it",
        affiliateUrl: "https://www.amazon.it/dp/B0TESTIMPORT?tag=pcchiaro-21",
        asin: "B0TESTIMPORT",
        priceAmountEur: 799.0,
        currency: "EUR",
        dataSource: "manual_check",
      },
      sources: [
        {
          sourceName: "Inserzione Commerciale Amazon.it",
          sourceType: "inserzione_commerciale",
          url: "https://www.amazon.it/dp/B0TESTIMPORT",
          notes: "Dati inserzione fornitore.",
        },
        {
          sourceName: "Datasheet Ufficiale Intel Ark i5-12400F",
          sourceType: "produttore",
          url: "https://ark.intel.com/i5-12400f",
          notes: "Specifiche architetturali 12ª gen.",
        },
      ],
    };

    const pcId = "pc-uuid-import-1";
    const reviewId = "rev-uuid-import-1";

    // Simula transazione come in saveImportedPackageAction
    testDb.transaction((tx) => {
      tx.insert(schema.pcs)
        .values({
          id: pcId,
          brand: pkg.pc.brand,
          modelName: pkg.pc.modelName,
          exactConfig: pkg.pc.exactConfig,
          category: pkg.pc.category,
          cpuModel: pkg.pc.cpuModel,
          cpuGen: pkg.pc.cpuGen,
          cpuWin11Support: pkg.pc.cpuWin11Support,
          gpuModel: pkg.pc.gpuModel,
          gpuVramGb: pkg.pc.gpuVramGb,
          gpuType: pkg.pc.gpuType,
          ramGb: pkg.pc.ramGb,
          ramType: pkg.pc.ramType,
          ramChannel: pkg.pc.ramChannel,
          storageType: pkg.pc.storageType,
          storageCapacityGb: pkg.pc.storageCapacityGb,
          osInstalled: pkg.pc.osInstalled,
          osOfficialSupport: pkg.pc.osOfficialSupport,
          unverifiedSpecs: JSON.stringify(pkg.pc.unverifiedSpecs),
          editorialStatus: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(schema.reviews)
        .values({
          id: reviewId,
          pcId: pcId,
          slug: pkg.review.slug,
          title: pkg.review.title,
          verdict: pkg.review.verdict,
          summaryIntro: pkg.review.summaryIntro,
          strengths: JSON.stringify(pkg.review.strengths),
          weaknesses: JSON.stringify(pkg.review.weaknesses),
          evidenceLevel: pkg.review.evidenceLevel,
          ratingGaming: pkg.review.ratingGaming,
          notesGaming: pkg.review.notesGaming,
          ratingWork: pkg.review.ratingWork,
          notesWork: pkg.review.notesWork,
          ratingOffice: pkg.review.ratingOffice,
          notesOffice: pkg.review.notesOffice,
          status: "draft",
          updatedAt: now,
        })
        .run();

      for (const s of pkg.sources) {
        tx.insert(schema.sources)
          .values({
            id: `src-${Math.random()}`,
            reviewId: reviewId,
            sourceName: s.sourceName,
            sourceType: s.sourceType,
            url: s.url,
            notes: s.notes,
            consultedAt: now,
          })
          .run();
      }

      tx.insert(schema.priceOffers)
        .values({
          id: `offer-${Math.random()}`,
          pcId: pcId,
          retailer: pkg.offer.retailer,
          affiliateUrl: pkg.offer.affiliateUrl,
          asin: pkg.offer.asin,
          priceAmountEur: pkg.offer.priceAmountEur,
          currency: pkg.offer.currency,
          dataSource: pkg.offer.dataSource,
          isValid: 1,
          lastVerifiedAt: now,
          createdAt: now,
        })
        .run();
    });

    // Verifiche nel database
    const savedPc = testDb.select().from(schema.pcs).where(eq(schema.pcs.id, pcId)).get();
    assert.ok(savedPc);
    assert.equal(savedPc.brand, "TestAssembler");
    assert.equal(savedPc.editorialStatus, "draft");

    const savedReview = testDb.select().from(schema.reviews).where(eq(schema.reviews.id, reviewId)).get();
    assert.ok(savedReview);
    assert.equal(savedReview.slug, "testassembler-gaming-setup-i5-rtx-4060");
    assert.equal(savedReview.status, "draft");
    assert.equal(savedReview.verdict, "buon_acquisto");

    const savedSources = testDb.select().from(schema.sources).where(eq(schema.sources.reviewId, reviewId)).all();
    assert.equal(savedSources.length, 2);

    const savedOffer = testDb.select().from(schema.priceOffers).where(eq(schema.priceOffers.pcId, pcId)).get();
    assert.ok(savedOffer);
    assert.equal(savedOffer.asin, "B0TESTIMPORT");
    assert.equal(savedOffer.priceAmountEur, 799.0);
  });
});
