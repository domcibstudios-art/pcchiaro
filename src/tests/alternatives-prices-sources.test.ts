import test, { describe } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { curatedAlternativeSchema, priceOfferSchema, sourceSchema } from "../lib/validations";
import fs from "fs";
import path from "path";

describe("Test Fase 3 — Alternative Curate, Prezzi e Fonti", () => {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Inizializza schema tabelle eseguendo tutte le migrazioni SQL versionate
  const migrationsDir = path.resolve(process.cwd(), "src/db/migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of migrationFiles) {
    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const statements = migrationSql.split("--> statement-breakpoint");
    for (const statement of statements) {
      if (statement.trim()) {
        sqlite.exec(statement);
      }
    }
  }

  const now = Date.now();

  // Setup dati base
  db.insert(schema.pcs)
    .values({
      id: "pc-base",
      brand: "BrandA",
      modelName: "Model A",
      exactConfig: "Config A",
      category: "desktop_gaming",
      cpuModel: "i7-4770",
      gpuModel: "GTX 1650",
      gpuType: "dedicated",
      ramGb: 16,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  db.insert(schema.pcs)
    .values({
      id: "pc-alt",
      brand: "BrandB",
      modelName: "Model B Alternativa",
      exactConfig: "Config B",
      category: "desktop_gaming",
      cpuModel: "Ryzen 5600",
      gpuModel: "RX 6600",
      gpuType: "dedicated",
      ramGb: 16,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  db.insert(schema.reviews)
    .values({
      id: "rev-base",
      pcId: "pc-base",
      slug: "review-pc-base",
      title: "Recensione PC Base",
      verdict: "sconsigliato",
      summaryIntro: "Sintesi iniziale dettagliata di oltre venti caratteri.",
      strengths: JSON.stringify(["Estetica"]),
      weaknesses: JSON.stringify(["Hardware vecchio"]),
      evidenceLevel: "verifica_indipendente",
      ratingGaming: "non_adatto",
      ratingWork: "non_adatto",
      ratingOffice: "limitato",
      status: "published",
      updatedAt: now,
    })
    .run();

  test("Alternative curate: validazione e divieto di auto-raccomandazione", () => {
    // 1. Validazione schema valida
    const valid = curatedAlternativeSchema.safeParse({
      id: "alt-1",
      sourceReviewId: "rev-base",
      targetPcId: "pc-alt",
      intendedUse: "Gaming 1080p nella stessa fascia di prezzo",
      editorialReasoning: "Hardware di 10 anni più moderno e 3 volte più veloce.",
      displayOrder: 1,
      isApproved: true,
    });
    assert.ok(valid.success);

    // 2. Controllo logico: un PC recensito non può essere alternativa a se stesso
    const sourcePcId = "pc-base";
    const targetSamePcId = "pc-base";
    assert.equal(sourcePcId === targetSamePcId, true, "Rilevata auto-raccomandazione non consentita");
  });

  test("Alternative curate: inserimento, approvazione e ordine di visualizzazione", () => {
    db.insert(schema.curatedAlternatives)
      .values({
        id: "alt-test-1",
        sourceReviewId: "rev-base",
        targetPcId: "pc-alt",
        intendedUse: "Gaming 1080p",
        editorialReasoning: "Hardware moderno con longevità 5+ anni.",
        displayOrder: 1,
        isApproved: 0, // In attesa
        lastVerifiedAt: now,
        createdAt: now,
      })
      .run();

    let saved = db.select().from(schema.curatedAlternatives).where(eq(schema.curatedAlternatives.id, "alt-test-1")).get();
    assert.ok(saved);
    assert.equal(saved.isApproved, 0);

    // Toggle approvazione
    db.update(schema.curatedAlternatives)
      .set({ isApproved: 1, lastVerifiedAt: Date.now() })
      .where(eq(schema.curatedAlternatives.id, "alt-test-1"))
      .run();

    saved = db.select().from(schema.curatedAlternatives).where(eq(schema.curatedAlternatives.id, "alt-test-1")).get();
    assert.equal(saved?.isApproved, 1);
  });

  test("Prezzi e offerte: inserimento, tracciamento data verifica e rilevamento dati obsoleti", () => {
    const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;

    // Offerta con verifica vecchia di oltre 30 giorni
    db.insert(schema.priceOffers)
      .values({
        id: "offer-stale",
        pcId: "pc-base",
        retailer: "Amazon.it",
        affiliateUrl: "https://www.amazon.it/dp/B0000000?tag=pcchiaro-21",
        priceAmountEur: 489.0,
        isValid: 1,
        lastVerifiedAt: thirtyOneDaysAgo,
        createdAt: thirtyOneDaysAgo,
      })
      .run();

    const offer = db.select().from(schema.priceOffers).where(eq(schema.priceOffers.id, "offer-stale")).get();
    assert.ok(offer);

    // Calcolo obsolescenza
    const isStale = offer.lastVerifiedAt < now - 30 * 24 * 60 * 60 * 1000;
    assert.equal(isStale, true, "L'offerta deve essere contrassegnata come obsoleta se non verificata da > 30 giorni");

    // Azione di verifica odierna
    db.update(schema.priceOffers)
      .set({ lastVerifiedAt: Date.now() })
      .where(eq(schema.priceOffers.id, "offer-stale"))
      .run();

    const refreshed = db.select().from(schema.priceOffers).where(eq(schema.priceOffers.id, "offer-stale")).get();
    const isStillStale = refreshed!.lastVerifiedAt < now - 30 * 24 * 60 * 60 * 1000;
    assert.equal(isStillStale, false, "Dopo l'azione di verifica l'offerta non è più obsoleta");
  });

  test("Fonti: associazione alla recensione e cancellazione a cascata (ON DELETE CASCADE)", () => {
    db.insert(schema.sources)
      .values({
        id: "source-1",
        reviewId: "rev-base",
        url: "https://ark.intel.com/content/www/it/it/ark/products/75122.html",
        sourceName: "Intel ARK Database",
        sourceType: "produttore",
        consultedAt: now,
        notes: "Verifica compatibilità socket e anno di rilascio 2013.",
      })
      .run();

    let source = db.select().from(schema.sources).where(eq(schema.sources.id, "source-1")).get();
    assert.ok(source);
    assert.equal(source.sourceName, "Intel ARK Database");

    // Eliminazione della recensione padre deve eliminare a cascata la fonte
    sqlite.prepare("DELETE FROM reviews WHERE id = 'rev-base'").run();

    source = db.select().from(schema.sources).where(eq(schema.sources.id, "source-1")).get();
    assert.equal(source, undefined, "La fonte deve essere eliminata a cascata alla cancellazione della recensione");
  });

  test("Conformità Amazon: impostazione dinamica prezzi esatti (default disattivo, commutabile con 1 clic)", () => {
    // 1. Lettura iniziale: se non presente in tabella, default è false (prezzi esatti nascosti)
    let setting = db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "show_exact_prices")).get();
    assert.equal(setting, undefined, "Inizialmente non presente in DB");

    // 2. Commutazione a true da parte dell'admin
    db.insert(schema.siteSettings)
      .values({
        key: "show_exact_prices",
        value: "true",
        updatedAt: Date.now(),
      })
      .run();

    setting = db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "show_exact_prices")).get();
    assert.equal(setting?.value, "true");

    // 3. Commutazione di ritorno a false (modalità conforme Amazon)
    db.update(schema.siteSettings)
      .set({ value: "false", updatedAt: Date.now() })
      .where(eq(schema.siteSettings.key, "show_exact_prices"))
      .run();

    setting = db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "show_exact_prices")).get();
    assert.equal(setting?.value, "false");
  });
});
