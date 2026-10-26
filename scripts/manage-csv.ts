import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "../src/db";
import { pcs, reviews, priceOffers, sources } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { parseAmazonListing } from "../src/lib/amazon-extractor";

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
export function importFromCsv(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File non trovato: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) {
    console.log("ℹ️ Il file CSV non contiene righe di dati.");
    return;
  }

  const now = Date.now();
  let importedCount = 0;

  // Salta intestazione
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Parsing semplice separatore punto e virgola
    const parts = rawLine.split(";").map((p) => p.replace(/^"|"$/g, "").replace(/""/g, '"').trim());

    const [
      asin,
      brand,
      modello,
      categoria,
      cpuModello,
      cpuGen,
      cpuWin11,
      gpuModello,
      gpuTipo,
      gpuVram,
      ramGb,
      ramTipo,
      ramCanale,
      storageGb,
      storageTipo,
      verdetto,
      titoloRecensione,
      sommarioIntro,
      semaforoGaming,
      noteGaming,
      semaforoLavoro,
      noteLavoro,
      semaforoUfficio,
      noteUfficio,
      puntiForza,
      criticita,
      prezzoIndicativo,
      amazonUrl,
    ] = parts;

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

    db.transaction((tx) => {
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
        editorialStatus: "draft",
        createdAt: now,
        updatedAt: now,
      }).run();

      tx.insert(reviews).values({
        id: reviewId,
        pcId: pcId,
        slug,
        title: titoloRecensione || modello,
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
        status: "draft",
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
    });

    importedCount++;
  }

  console.log(`✅ Importazione completata: ${importedCount} schede importate nel database come bozze!`);
}

// Esecuzione CLI
const command = process.argv[2];
const targetFile = process.argv[3] || path.resolve(process.cwd(), "data", "pcchiaro_catalogo.csv");

if (command === "export") {
  exportToCsv(targetFile);
} else if (command === "import") {
  importFromCsv(targetFile);
} else {
  console.log(`
Uso dello strumento CSV PCChiaro:
  npx tsx scripts/manage-csv.ts export [percorso_file.csv]
  npx tsx scripts/manage-csv.ts import [percorso_file.csv]

Esempio:
  npx tsx scripts/manage-csv.ts export data/catalogo_esportato.csv
  npx tsx scripts/manage-csv.ts import data/nuovi_candidati.csv
`);
}
