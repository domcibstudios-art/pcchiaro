import test, { describe } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { executeBatch } from "../db";

describe("Verifica Atomicità e Rollback di executeBatch", () => {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const testDb = drizzle(sqlite, { schema });

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
  `);

  test("executeBatch inserisce con successo statement multipli correlati", async () => {
    const pcId = "batch-pc-1";
    const revId = "batch-rev-1";
    const now = Date.now();

    const stmts = [
      testDb.insert(schema.pcs).values({
        id: pcId,
        brand: "TestBrand",
        modelName: "TestModel",
        exactConfig: "Config 1",
        category: "desktop_office",
        cpuModel: "i5-12400",
        gpuModel: "UHD 730",
        gpuType: "integrated",
        ramGb: 16,
        createdAt: now,
        updatedAt: now,
      }),
      testDb.insert(schema.reviews).values({
        id: revId,
        pcId: pcId,
        slug: "batch-test-review-1",
        title: "Test Batch Review",
        verdict: "accettabile_base",
        summaryIntro: "Intro",
        strengths: "[]",
        weaknesses: "[]",
        evidenceLevel: "specifiche_dichiarate",
        ratingGaming: "limitato",
        ratingWork: "idoneo",
        ratingOffice: "idoneo",
        updatedAt: now,
      }),
    ];

    await executeBatch(testDb as any, stmts);

    const insertedPc = testDb.select().from(schema.pcs).where(eq(schema.pcs.id, pcId)).get();
    const insertedRev = testDb.select().from(schema.reviews).where(eq(schema.reviews.id, revId)).get();

    assert.ok(insertedPc, "Il PC deve essere stato inserito");
    assert.ok(insertedRev, "La recensione deve essere stata inserita");
  });

  test("executeBatch esegue il ROLLBACK completo se un'operazione del lotto fallisce", async () => {
    const pcId = "batch-pc-fail";
    const now = Date.now();

    const stmts = [
      testDb.insert(schema.pcs).values({
        id: pcId,
        brand: "RollbackBrand",
        modelName: "RollbackModel",
        exactConfig: "Config Rollback",
        category: "desktop_office",
        cpuModel: "i5-12400",
        gpuModel: "UHD 730",
        gpuType: "integrated",
        ramGb: 16,
        createdAt: now,
        updatedAt: now,
      }),
      // Statement intenzionalmente fallimentare: viola il vincolo UNIQUE sullo slug
      testDb.insert(schema.reviews).values({
        id: "batch-rev-fail",
        pcId: pcId,
        slug: "batch-test-review-1", // Già esistente dal test precedente!
        title: "Test Duplicate Slug",
        verdict: "sconsigliato",
        summaryIntro: "Intro",
        strengths: "[]",
        weaknesses: "[]",
        evidenceLevel: "specifiche_dichiarate",
        ratingGaming: "non_adatto",
        ratingWork: "limitato",
        ratingOffice: "idoneo",
        updatedAt: now,
      }),
    ];

    let threwError = false;
    try {
      await executeBatch(testDb as any, stmts);
    } catch {
      threwError = true;
    }

    assert.equal(threwError, true, "executeBatch deve lanciare errore quando uno statement fallisce");

    // Verifica fondamentale di atomicità: il PC NON deve essere presente nel DB (rollback avvenuto!)
    const rolledBackPc = testDb.select().from(schema.pcs).where(eq(schema.pcs.id, pcId)).get();
    assert.equal(rolledBackPc, undefined, "Il PC inserito prima dello statement fallito DEVE essere stato rimosso per ROLLBACK");
  });
});
