import test, { describe } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

describe("Database SQLite & Drizzle ORM Integrity", () => {
  // Test con database in-memory per isolamento completo
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Inizializza schema in-memory
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

  test("Inserimento e recupero PC", () => {
    const now = Date.now();
    db.insert(schema.pcs)
      .values({
        id: "pc-test-1",
        brand: "TestBrand",
        modelName: "TestModel",
        exactConfig: "Config 1",
        category: "desktop_gaming",
        cpuModel: "Ryzen 5 5600",
        gpuModel: "RX 6600",
        gpuType: "dedicated",
        ramGb: 16,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const result = db.select().from(schema.pcs).where(eq(schema.pcs.id, "pc-test-1")).get();
    assert.ok(result);
    assert.equal(result.brand, "TestBrand");
    assert.equal(result.ramGb, 16);
  });

  test("Integrità referenziale: rifiuto recensione per PC inesistente", () => {
    assert.throws(() => {
      sqlite.prepare(`
        INSERT INTO reviews (id, pc_id, slug, title, verdict, summary_intro, strengths, weaknesses, evidence_level, rating_gaming, rating_work, rating_office, updated_at)
        VALUES ('rev-invalid', 'pc-non-esiste', 'slug-1', 'Titolo', 'sconsigliato', 'Sintesi...', '[]', '[]', 'specifiche_dichiarate', 'non_adatto', 'non_adatto', 'limitato', 123456);
      `).run();
    }, /FOREIGN KEY constraint failed/);
  });

  test("Protezione eliminazione target PC referenziato come alternativa (ON DELETE RESTRICT)", () => {
    const now = Date.now();
    // Inserisci target PC
    db.insert(schema.pcs)
      .values({
        id: "pc-target",
        brand: "TargetBrand",
        modelName: "TargetModel",
        exactConfig: "Config Target",
        category: "desktop_gaming",
        cpuModel: "i5-12400F",
        gpuModel: "RTX 4060",
        gpuType: "dedicated",
        ramGb: 16,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // Inserisci recensione
    db.insert(schema.reviews)
      .values({
        id: "rev-1",
        pcId: "pc-test-1",
        slug: "recensione-test",
        title: "Titolo Test",
        verdict: "sconsigliato",
        summaryIntro: "Sintesi recensione test con lunghezza adeguata...",
        strengths: JSON.stringify(["Punto 1"]),
        weaknesses: JSON.stringify(["Limite 1"]),
        evidenceLevel: "specifiche_dichiarate",
        ratingGaming: "non_adatto",
        ratingWork: "non_adatto",
        ratingOffice: "limitato",
        updatedAt: now,
      })
      .run();

    // Inserisci alternativa curata
    db.insert(schema.curatedAlternatives)
      .values({
        id: "alt-1",
        sourceReviewId: "rev-1",
        targetPcId: "pc-target",
        intendedUse: "Gaming 1080p",
        editorialReasoning: "Hardware molto più moderno e bilanciato",
        isApproved: 1,
        lastVerifiedAt: now,
        createdAt: now,
      })
      .run();

    // Tentativo di eliminazione di pc-target deve fallire per il vincolo ON DELETE RESTRICT
    assert.throws(() => {
      sqlite.prepare("DELETE FROM pcs WHERE id = 'pc-target'").run();
    }, /FOREIGN KEY constraint failed/);
  });
});
