import test, { describe } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { validateForPublication } from "../lib/validations";

describe("Test Logica e Flussi CRUD Pannello Amministrativo", () => {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Inizializzazione schema in memory per il test
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
  `);

  test("Creazione, modifica e archiviazione PC nel catalogo", () => {
    const now = Date.now();
    // 1. Inserimento PC
    db.insert(schema.pcs)
      .values({
        id: "pc-test-crud",
        brand: "HP",
        modelName: "Pavilion Gaming",
        exactConfig: "Ryzen 5 5600G, 16GB, GTX 1650",
        category: "desktop_gaming",
        cpuModel: "Ryzen 5 5600G",
        gpuModel: "GTX 1650",
        gpuType: "dedicated",
        ramGb: 16,
        editorialStatus: "draft",
        unverifiedSpecs: JSON.stringify(["Alimentatore OEM"]),
        createdAt: now,
        updatedAt: now,
      })
      .run();

    let pc = db.select().from(schema.pcs).where(eq(schema.pcs.id, "pc-test-crud")).get();
    assert.ok(pc);
    assert.equal(pc.editorialStatus, "draft");

    // 2. Modifica specifiche
    db.update(schema.pcs)
      .set({
        gpuModel: "GTX 1660 Super",
        updatedAt: Date.now(),
      })
      .where(eq(schema.pcs.id, "pc-test-crud"))
      .run();

    pc = db.select().from(schema.pcs).where(eq(schema.pcs.id, "pc-test-crud")).get();
    assert.equal(pc?.gpuModel, "GTX 1660 Super");

    // 3. Archiviazione
    db.update(schema.pcs)
      .set({
        editorialStatus: "archived",
        updatedAt: Date.now(),
      })
      .where(eq(schema.pcs.id, "pc-test-crud"))
      .run();

    pc = db.select().from(schema.pcs).where(eq(schema.pcs.id, "pc-test-crud")).get();
    assert.equal(pc?.editorialStatus, "archived");
  });

  test("Flusso recensione: bozza, pubblicazione con validazione e ritiro", () => {
    const now = Date.now();

    // Inserisci recensione incompleta come bozza (consentito per non perdere il lavoro)
    db.insert(schema.reviews)
      .values({
        id: "rev-draft-1",
        pcId: "pc-test-crud",
        slug: "hp-pavilion-gaming-test",
        title: "Test HP", // Titolo corto
        verdict: "sconsigliato",
        summaryIntro: "Bozza breve", // < 20 caratteri
        strengths: JSON.stringify([]), // Vuoto
        weaknesses: JSON.stringify([]),
        evidenceLevel: "specifiche_dichiarate",
        ratingGaming: "non_adatto",
        ratingWork: "non_adatto",
        ratingOffice: "limitato",
        status: "draft",
        updatedAt: now,
      })
      .run();

    const draft = db.select().from(schema.reviews).where(eq(schema.reviews.id, "rev-draft-1")).get();
    assert.ok(draft);
    assert.equal(draft.status, "draft");

    // Tentativo di pubblicazione con dati incompleti deve essere bloccato
    const invalidCheck = validateForPublication({
      ...draft,
      strengths: JSON.parse(draft.strengths),
      weaknesses: JSON.parse(draft.weaknesses),
      verdict: draft.verdict as any,
      evidenceLevel: draft.evidenceLevel as any,
      ratingGaming: draft.ratingGaming as any,
      ratingWork: draft.ratingWork as any,
      ratingOffice: draft.ratingOffice as any,
      status: "published",
    });
    assert.equal(invalidCheck.isValid, false);
    assert.ok(invalidCheck.errors.length >= 2);

    // Completamento dati e pubblicazione riuscita
    db.update(schema.reviews)
      .set({
        title: "Recensione Completa HP Pavilion Gaming",
        summaryIntro: "Questa è una sintesi redazionale esaustiva che supera i venti caratteri richiesti.",
        strengths: JSON.stringify(["Buon flusso d'aria"]),
        weaknesses: JSON.stringify(["Scheda madre proprietaria non standard"]),
        status: "published",
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(schema.reviews.id, "rev-draft-1"))
      .run();

    const published = db.select().from(schema.reviews).where(eq(schema.reviews.id, "rev-draft-1")).get();
    assert.equal(published?.status, "published");
    assert.ok(published?.publishedAt);

    // Ritiro a bozza
    db.update(schema.reviews)
      .set({
        status: "draft",
        updatedAt: Date.now(),
      })
      .where(eq(schema.reviews.id, "rev-draft-1"))
      .run();

    const unpublished = db.select().from(schema.reviews).where(eq(schema.reviews.id, "rev-draft-1")).get();
    assert.equal(unpublished?.status, "draft");
  });
});
