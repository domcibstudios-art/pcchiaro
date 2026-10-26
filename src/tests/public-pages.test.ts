import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { SITE_CONFIG } from "../config/site";

describe("Test Fase 4 — Pagine Pubbliche, Criteri di Visualizzazione e Conformità", () => {
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

      CREATE TABLE curated_alternatives (
        id TEXT PRIMARY KEY NOT NULL,
        source_review_id TEXT NOT NULL,
        target_pc_id TEXT NOT NULL,
        intended_use TEXT NOT NULL,
        editorial_reasoning TEXT NOT NULL,
        pros_vs_source TEXT,
        cons_vs_source TEXT,
        price_difference_eur REAL,
        display_order INTEGER DEFAULT 1 NOT NULL,
        is_approved INTEGER DEFAULT 0 NOT NULL,
        last_verified_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (source_review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        FOREIGN KEY (target_pc_id) REFERENCES pcs(id) ON DELETE RESTRICT
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

      CREATE TABLE site_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  });

  after(() => {
    sqlite.close();
  });

  test("Filtro pubblico: solo le recensioni 'published' compaiono nel feed pubblico", () => {
    const now = Date.now();

    // Inserisci due PC
    testDb
      .insert(schema.pcs)
      .values([
        {
          id: "pc-pub-1",
          brand: "TestBrand",
          modelName: "Gaming Veloce",
          exactConfig: "i7-4770 / 16GB",
          category: "desktop_gaming",
          cpuModel: "Intel Core i7-4770",
          gpuModel: "GTX 1650 4GB",
          gpuType: "dedicated",
          ramGb: 16,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "pc-draft-2",
          brand: "BozzaBrand",
          modelName: "Bozza PC",
          exactConfig: "Ryzen 5600G",
          category: "desktop_office",
          cpuModel: "Ryzen 5 5600G",
          gpuModel: "Radeon Vega 7",
          gpuType: "integrated",
          ramGb: 16,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .run();

    // Inserisci una recensione pubblicata e una in bozza
    testDb
      .insert(schema.reviews)
      .values([
        {
          id: "rev-pub-1",
          pcId: "pc-pub-1",
          slug: "testbrand-gaming-veloce",
          title: "TestBrand Gaming Veloce",
          verdict: "sconsigliato",
          summaryIntro: "PC con CPU del 2013 non aggiornabile.",
          strengths: "[]",
          weaknesses: '["CPU obsoleta"]',
          evidenceLevel: "specifiche_dichiarate",
          ratingGaming: "limitato",
          ratingWork: "limitato",
          ratingOffice: "idoneo",
          status: "published",
          publishedAt: now,
          updatedAt: now,
        },
        {
          id: "rev-draft-2",
          pcId: "pc-draft-2",
          slug: "bozza-pc-da-finire",
          title: "Bozza PC Non Pronto",
          verdict: "info_insufficienti",
          summaryIntro: "In lavorazione",
          strengths: "[]",
          weaknesses: "[]",
          evidenceLevel: "specifiche_dichiarate",
          ratingGaming: "non_adatto",
          ratingWork: "non_adatto",
          ratingOffice: "limitato",
          status: "draft",
          updatedAt: now,
        },
      ])
      .run();

    // Query del feed pubblico
    const publicFeed = testDb
      .select({ review: schema.reviews, pc: schema.pcs })
      .from(schema.reviews)
      .innerJoin(schema.pcs, eq(schema.reviews.pcId, schema.pcs.id))
      .where(eq(schema.reviews.status, "published"))
      .all();

    assert.equal(publicFeed.length, 1);
    assert.equal(publicFeed[0].review.slug, "testbrand-gaming-veloce");
    assert.equal(publicFeed[0].review.verdict, "sconsigliato");
  });

  test("Filtro di sicurezza alternative: solo alternative 'isApproved = 1' compaiono al visitatore", () => {
    const now = Date.now();

    // Inserisci PC target alternativa
    testDb
      .insert(schema.pcs)
      .values([
        {
          id: "pc-target-approved",
          brand: "GoodBrand",
          modelName: "Soluzione Idonea",
          exactConfig: "Ryzen 5600 + RX 6600",
          category: "desktop_gaming",
          cpuModel: "Ryzen 5 5600",
          gpuModel: "Radeon RX 6600 8GB",
          gpuType: "dedicated",
          ramGb: 16,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "pc-target-pending",
          brand: "PendingBrand",
          modelName: "In Attesa",
          exactConfig: "i5-12400",
          category: "desktop_office",
          cpuModel: "Core i5-12400",
          gpuModel: "UHD 730",
          gpuType: "integrated",
          ramGb: 16,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .run();

    // Inserisci un'alternativa approvata e una NON approvata (isApproved = 0)
    testDb
      .insert(schema.curatedAlternatives)
      .values([
        {
          id: "alt-app-1",
          sourceReviewId: "rev-pub-1",
          targetPcId: "pc-target-approved",
          intendedUse: "Gaming 1080p Reale",
          editorialReasoning: "CPU moderna 2022 e GPU con 8GB VRAM.",
          isApproved: 1, // APPROVATA
          displayOrder: 1,
          lastVerifiedAt: now,
          createdAt: now,
        },
        {
          id: "alt-pend-2",
          sourceReviewId: "rev-pub-1",
          targetPcId: "pc-target-pending",
          intendedUse: "Alternativa non verificata",
          editorialReasoning: "In fase di bozza.",
          isApproved: 0, // NON APPROVATA
          displayOrder: 2,
          lastVerifiedAt: now,
          createdAt: now,
        },
      ])
      .run();

    // Query pubblica delle alternative approvate
    const publicAlternatives = testDb
      .select({
        alt: schema.curatedAlternatives,
        targetPc: schema.pcs,
      })
      .from(schema.curatedAlternatives)
      .innerJoin(schema.pcs, eq(schema.curatedAlternatives.targetPcId, schema.pcs.id))
      .where(
        and(
          eq(schema.curatedAlternatives.sourceReviewId, "rev-pub-1"),
          eq(schema.curatedAlternatives.isApproved, 1)
        )
      )
      .all();

    assert.equal(publicAlternatives.length, 1);
    assert.equal(publicAlternatives[0].targetPc.brand, "GoodBrand");
    assert.equal(publicAlternatives[0].alt.isApproved, 1);
  });

  test("Conformità Amazon: le CTA per l'acquisto e i disclaimer sono presenti nella configurazione", () => {
    assert.ok(SITE_CONFIG.compliance.amazonDisclosure.includes("In qualità di Affiliato Amazon"));
    assert.ok(SITE_CONFIG.compliance.lawReference.includes("Legge 145/2018"));
    assert.equal(SITE_CONFIG.pricing.ctaText, "Controlla il prezzo su Amazon.it");
    assert.equal(SITE_CONFIG.pricing.defaultShowExactPrices, false);
  });

  test("Integrità dei 5 verdetti e dei 3 livelli di prova in SITE_CONFIG", () => {
    const verdicts = Object.keys(SITE_CONFIG.verdicts);
    assert.deepEqual(verdicts.sort(), [
      "accettabile_base",
      "buon_acquisto",
      "conveniente_offerta",
      "info_insufficienti",
      "sconsigliato",
    ]);

    const evidenceLevels = Object.keys(SITE_CONFIG.evidenceLevels);
    assert.deepEqual(evidenceLevels.sort(), [
      "specifiche_dichiarate",
      "test_diretto",
      "verifica_indipendente",
    ]);
  });
});
