import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { nodeDb as db } from "../src/db/node";
import { pcs, reviews, priceOffers, sources, curatedAlternatives } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { parseAmazonListing } from "../src/lib/amazon-extractor";
import { parseCsvText } from "../src/lib/csv-parser";
import { generateSeoMeta } from "../src/lib/seo-engine";

const CSV_HEADER = [
  "asin",
  "brand",
  "modello",
  "categoria",
  "cpu_modello",
  "cpu_gen",
  "cpu_win11_support",
  "gpu_modello",
  "gpu_tipo",
  "gpu_vram_gb",
  "ram_gb",
  "ram_tipo",
  "ram_canale",
  "storage_gb",
  "storage_tipo",
  "verdetto",
  "titolo_recensione",
  "sommario_intro",
  "semaforo_gaming",
  "note_gaming",
  "semaforo_lavoro",
  "note_lavoro",
  "semaforo_ufficio",
  "note_ufficio",
  "punti_forza",
  "criticita",
  "prezzo_indicativo",
  "amazon_url",
].join(";");

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val).replace(/"/g, '""');
  if (str.includes(";") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

/**
 * Esporta il catalogo o una bozza in formato CSV compatibile Excel
 */
export function exportToCsv(filePath: string) {
  const allPcs = db.select().from(pcs).all();
  const allReviews = db.select().from(reviews).all();
  const allOffers = db.select().from(priceOffers).all();

  const reviewsByPcId = new Map(allReviews.map((r) => [r.pcId, r]));
  const offersByPcId = new Map(allOffers.map((o) => [o.pcId, o]));

  const rows: string[] = [CSV_HEADER];

  for (const pc of allPcs) {
    const rev = reviewsByPcId.get(pc.id);
    const offer = offersByPcId.get(pc.id);

    let strengths = "";
    let weaknesses = "";
    try {
      if (rev?.strengths) strengths = JSON.parse(rev.strengths).join(" | ");
      if (rev?.weaknesses) weaknesses = JSON.parse(rev.weaknesses).join(" | ");
    } catch {
      // Ignora
    }

    const row = [
      escapeCsv(offer?.asin || ""),
      escapeCsv(pc.brand),
      escapeCsv(pc.modelName),
      escapeCsv(pc.category),
      escapeCsv(pc.cpuModel),
      escapeCsv(pc.cpuGen || ""),
      escapeCsv(pc.cpuWin11Support ?? 1),
      escapeCsv(pc.gpuModel),
      escapeCsv(pc.gpuType),
      escapeCsv(pc.gpuVramGb || ""),
      escapeCsv(pc.ramGb),
      escapeCsv(pc.ramType || "DDR4"),
      escapeCsv(pc.ramChannel || "dual"),
      escapeCsv(pc.storageCapacityGb || 512),
      escapeCsv(pc.storageType || "NVMe"),
      escapeCsv(rev?.verdict || "info_insufficienti"),
      escapeCsv(rev?.title || pc.modelName),
      escapeCsv(rev?.summaryIntro || ""),
      escapeCsv(rev?.ratingGaming || "limitato"),
      escapeCsv(rev?.notesGaming || ""),
      escapeCsv(rev?.ratingWork || "limitato"),
      escapeCsv(rev?.notesWork || ""),
      escapeCsv(rev?.ratingOffice || "idoneo"),
      escapeCsv(rev?.notesOffice || ""),
      escapeCsv(strengths),
      escapeCsv(weaknesses),
      escapeCsv(offer?.priceAmountEur || ""),
      escapeCsv(offer?.affiliateUrl || ""),
    ];

    rows.push(row.join(";"));
  }

  fs.writeFileSync(filePath, rows.join("\r\n"), "utf-8");
  console.log(`✅ File CSV esportato con successo (${allPcs.length} righe): ${filePath}`);
}

/**
 * Importa righe da un file CSV in bozze SQLite
 */
export function importFromCsv(filePath: string, publish: boolean = false) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File non trovato: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const { headers, rows } = parseCsvText(content);

  if (rows.length === 0) {
    console.log("ℹ️ Il file CSV non contiene righe di dati valide.");
    return;
  }

  const getCol = (parts: string[], name: string, fallbackIdx: number): string => {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase().trim());
    const targetIdx = idx !== -1 ? idx : fallbackIdx;
    return parts[targetIdx] !== undefined ? parts[targetIdx].trim() : "";
  };

  const now = Date.now();
  let importedCount = 0;
  const pendingAlternatives: Array<{
    sourceSlug: string;
    targetAsin: string;
    reasoning: string;
    intendedUse: string;
  }> = [];

  for (const parts of rows) {
    const asin = getCol(parts, "asin", 0);
    const brand = getCol(parts, "brand", 1);
    const modello = getCol(parts, "modello", 2);
    const categoria = getCol(parts, "categoria", 3);
    const cpuModello = getCol(parts, "cpu_modello", 4);
    const cpuGen = getCol(parts, "cpu_gen", 5);
    const cpuWin11 = getCol(parts, "cpu_win11_support", 6);
    const gpuModello = getCol(parts, "gpu_modello", 7);
    const gpuTipo = getCol(parts, "gpu_tipo", 8);
    const gpuVram = getCol(parts, "gpu_vram_gb", 9);
    const ramGb = getCol(parts, "ram_gb", 10);
    const ramTipo = getCol(parts, "ram_tipo", 11);
    const ramCanale = getCol(parts, "ram_canale", 12);
    const storageGb = getCol(parts, "storage_gb", 13);
    const storageTipo = getCol(parts, "storage_tipo", 14);
    const verdetto = getCol(parts, "verdetto", 15);
    const titoloRecensione = getCol(parts, "titolo_recensione", 16);
    const sommarioIntro = getCol(parts, "sommario_intro", 17);
    const semaforoGaming = getCol(parts, "semaforo_gaming", 18);
    const noteGaming = getCol(parts, "note_gaming", 19);
    const semaforoLavoro = getCol(parts, "semaforo_lavoro", 20);
    const noteLavoro = getCol(parts, "note_lavoro", 21);
    const semaforoUfficio = getCol(parts, "semaforo_ufficio", 22);
    const noteUfficio = getCol(parts, "note_ufficio", 23);
    const puntiForza = getCol(parts, "punti_forza", 24);
    const criticita = getCol(parts, "criticita", 25);
    const prezzoIndicativo = getCol(parts, "prezzo_indicativo", 26);
    const parsedPrice = prezzoIndicativo ? parseFloat(prezzoIndicativo.replace(",", ".")) : null;
    const amazonUrl = getCol(parts, "amazon_url", 27);
    const altAsin = getCol(parts, "alternativa_asin", 28);
    const altMotivo = getCol(parts, "alternativa_motivo", 29);
    const altAmbito = getCol(parts, "alternativa_ambito", 30);
    const valoreStimatoRaw = getCol(parts, "valore_stimato_eur", 31);
    const parsedFairValue = valoreStimatoRaw ? parseFloat(valoreStimatoRaw.replace(",", ".")) : null;

    if (!brand || !modello || !cpuModello) continue;

    const pcId = crypto.randomUUID();
    const reviewId = crypto.randomUUID();
    const slug = (titoloRecensione || modello)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) + (asin ? `-${asin.toLowerCase()}` : "");

    const strengthsArray = puntiForza ? puntiForza.split("|").map((s) => s.trim()).filter(Boolean) : [];
    const weaknessesArray = criticita ? criticita.split("|").map((s) => s.trim()).filter(Boolean) : [];

    const { title: autoMetaTitle, description: autoMetaDesc } = generateSeoMeta(
      {
        title: titoloRecensione || modello,
        summaryIntro: sommarioIntro || `Bozza importata da CSV per ${brand} ${modello}.`,
        verdict: (verdetto as any) || "accettabile_base",
        ratingGaming: (semaforoGaming as any) || "limitato",
        notesGaming: noteGaming || "",
        ratingWork: (semaforoLavoro as any) || "limitato",
        notesWork: noteLavoro || "",
        ratingOffice: (semaforoUfficio as any) || "idoneo",
        notesOffice: noteUfficio || "",
      },
      {
        brand: brand || "Brand",
        modelName: modello,
        cpuModel: cpuModello,
        cpuGen: cpuGen || null,
        cpuWin11Support: cpuWin11 === "0" ? 0 : 1,
        gpuModel: gpuModello || "Integrata",
        gpuType: (gpuTipo as any) || "integrated",
        ramGb: parseInt(ramGb, 10) || 16,
        ramType: ramTipo || "DDR4",
        ramChannel: (ramCanale as any) || "dual",
        storageCapacityGb: parseInt(storageGb, 10) || 512,
        storageType: storageTipo || "NVMe",
        osOfficialSupport: cpuWin11 === "0" ? 0 : 1,
      }
    );

    db.transaction((tx) => {
      // Cerca se esiste già il prodotto tramite ASIN o tramite slug
      let existingReview = null;
      if (asin) {
        const offer = tx.select().from(priceOffers).where(eq(priceOffers.asin, asin)).get();
        if (offer) {
          existingReview = tx.select().from(reviews).where(eq(reviews.pcId, offer.pcId)).get();
        }
      }
      if (!existingReview) {
        existingReview = tx.select().from(reviews).where(eq(reviews.slug, slug)).get();
      }

      if (existingReview) {
        // Aggiorna review esistente
        tx.update(reviews)
          .set({
            slug,
            title: titoloRecensione || modello,
            metaTitle: autoMetaTitle,
            metaDescription: autoMetaDesc,
            summaryIntro: sommarioIntro || `Bozza importata da CSV per ${brand} ${modello}.`,
            verdict: (verdetto as any) || "accettabile_base",
            strengths: JSON.stringify(strengthsArray),
            weaknesses: JSON.stringify(weaknessesArray),
            ratingGaming: (semaforoGaming as any) || "limitato",
            notesGaming: noteGaming || "",
            ratingWork: (semaforoLavoro as any) || "limitato",
            notesWork: noteLavoro || "",
            ratingOffice: (semaforoUfficio as any) || "idoneo",
            notesOffice: noteUfficio || "",
            amazonListingPriceEur: parsedPrice,
            estimatedFairValueEur: parsedFairValue,
            status: publish ? "published" : existingReview.status,
            updatedAt: now,
          })
          .where(eq(reviews.id, existingReview.id))
          .run();

        tx.update(pcs)
          .set({
            editorialStatus: publish ? "published" : "draft",
            updatedAt: now,
          })
          .where(eq(pcs.id, existingReview.pcId))
          .run();

        if (amazonUrl || asin) {
          const existingOffer = tx.select().from(priceOffers).where(eq(priceOffers.pcId, existingReview.pcId)).get();
          if (existingOffer) {
            tx.update(priceOffers)
              .set({
                affiliateUrl: amazonUrl || existingOffer.affiliateUrl,
                priceAmountEur: prezzoIndicativo ? parseFloat(prezzoIndicativo.replace(",", ".")) : existingOffer.priceAmountEur,
                lastVerifiedAt: now,
              })
              .where(eq(priceOffers.id, existingOffer.id))
              .run();
          }
        }
      } else {
        // Inserimento nuovo
        tx.insert(pcs).values({
          id: pcId,
          brand: brand || "Brand",
          modelName: modello,
          exactConfig: `${cpuModello} / ${gpuModello || "Integrata"} / ${ramGb || 16}GB / ${storageGb || 512}GB`,
          category: (categoria as any) || "desktop_office",
          cpuModel: cpuModello,
          cpuGen: cpuGen || null,
          cpuWin11Support: cpuWin11 === "0" ? 0 : 1,
          gpuModel: gpuModello || "Integrata",
          gpuVramGb: gpuVram ? parseInt(gpuVram, 10) : null,
          gpuType: (gpuTipo as any) || "integrated",
          ramGb: parseInt(ramGb, 10) || 16,
          ramType: ramTipo || "DDR4",
          ramChannel: (ramCanale as any) || "dual",
          storageType: storageTipo || "NVMe",
          storageCapacityGb: parseInt(storageGb, 10) || 512,
          osInstalled: "Windows 11",
          osOfficialSupport: cpuWin11 === "0" ? 0 : 1,
          editorialStatus: publish ? "published" : "draft",
          createdAt: now,
          updatedAt: now,
        }).run();

        tx.insert(reviews).values({
          id: reviewId,
          pcId: pcId,
          slug,
          title: titoloRecensione || modello,
          metaTitle: autoMetaTitle,
          metaDescription: autoMetaDesc,
          summaryIntro: sommarioIntro || `Bozza importata da CSV per ${brand} ${modello}.`,
          verdict: (verdetto as any) || "accettabile_base",
          evidenceLevel: "specifiche_dichiarate",
          strengths: JSON.stringify(strengthsArray),
          weaknesses: JSON.stringify(weaknessesArray),
          ratingGaming: (semaforoGaming as any) || "limitato",
          notesGaming: noteGaming || "",
          ratingWork: (semaforoLavoro as any) || "limitato",
          notesWork: noteLavoro || "",
          ratingOffice: (semaforoUfficio as any) || "idoneo",
          notesOffice: noteUfficio || "",
          amazonListingPriceEur: parsedPrice,
          estimatedFairValueEur: parsedFairValue,
          status: publish ? "published" : "draft",
          updatedAt: now,
        }).run();

        if (amazonUrl || asin) {
          tx.insert(priceOffers).values({
            id: crypto.randomUUID(),
            pcId: pcId,
            retailer: "Amazon.it",
            affiliateUrl: amazonUrl || `https://www.amazon.it/dp/${asin}`,
            asin: asin || null,
            priceAmountEur: prezzoIndicativo ? parseFloat(prezzoIndicativo.replace(",", ".")) : null,
            currency: "EUR",
            dataSource: "csv_import",
            isValid: 1,
            lastVerifiedAt: now,
            createdAt: now,
          }).run();
        }
      }
    });

    if (altAsin) {
      pendingAlternatives.push({
        sourceSlug: slug,
        targetAsin: altAsin,
        reasoning: altMotivo || "Configurazione più equilibrata e moderna nella stessa fascia di mercato.",
        intendedUse: altAmbito || "Alternativa consigliata per la stessa fascia",
      });
    }

    importedCount++;
  }

  // Risoluzione e collegamento delle alternative approvate
  let altLinkedCount = 0;
  for (const alt of pendingAlternatives) {
    const srcReview = db.select().from(reviews).where(eq(reviews.slug, alt.sourceSlug)).get();
    const targetOffer = db.select().from(priceOffers).where(eq(priceOffers.asin, alt.targetAsin)).get();

    if (srcReview && targetOffer) {
      const existing = db
        .select()
        .from(curatedAlternatives)
        .where(
          and(
            eq(curatedAlternatives.sourceReviewId, srcReview.id),
            eq(curatedAlternatives.targetPcId, targetOffer.pcId)
          )
        )
        .get();

      if (!existing) {
        db.insert(curatedAlternatives)
          .values({
            id: crypto.randomUUID(),
            sourceReviewId: srcReview.id,
            targetPcId: targetOffer.pcId,
            intendedUse: alt.intendedUse,
            editorialReasoning: alt.reasoning,
            isApproved: 1,
            lastVerifiedAt: now,
            createdAt: now,
          })
          .run();
        altLinkedCount++;
      } else {
        db.update(curatedAlternatives)
          .set({
            intendedUse: alt.intendedUse,
            editorialReasoning: alt.reasoning,
            isApproved: 1,
            lastVerifiedAt: now,
          })
          .where(eq(curatedAlternatives.id, existing.id))
          .run();
        altLinkedCount++;
      }
    }
  }

  if (altLinkedCount > 0) {
    console.log(`🔗 Collegate con successo ${altLinkedCount} relazioni tra PC e alternative consigliate!`);
  }

  console.log(`✅ Importazione completata: ${importedCount} schede importate nel database ${publish ? "e pubblicate online" : "come bozze"}!`);
}

// Esecuzione CLI
const command = process.argv[2];
const targetFile = process.argv[3] || path.resolve(process.cwd(), "data", "pcchiaro_catalogo.csv");
const shouldPublish = process.argv.includes("--publish") || process.argv.includes("-p");

if (command === "export") {
  exportToCsv(targetFile);
} else if (command === "import") {
  importFromCsv(targetFile, shouldPublish);
} else {
  console.log(`
Uso dello strumento CSV PCChiaro:
  npx tsx scripts/manage-csv.ts export [percorso_file.csv]
  npx tsx scripts/manage-csv.ts import [percorso_file.csv] [--publish]

Esempi:
  npx tsx scripts/manage-csv.ts export data/catalogo_esportato.csv
  npx tsx scripts/manage-csv.ts import pc_finder/output_sito/import_schede_sito.csv
  npx tsx scripts/manage-csv.ts import pc_finder/output_sito/import_schede_sito.csv --publish
`);
}
