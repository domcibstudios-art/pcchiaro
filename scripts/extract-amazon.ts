import fs from "node:fs";
import path from "node:path";
import { parseAmazonListing, extractAsinFromUrl } from "../src/lib/amazon-extractor";

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.log(`
Uso dello script di estrazione PCChiaro:
  npx tsx scripts/extract-amazon.ts "<URL_AMAZON_O_PERCORSO_FILE_HTML>"

Esempi:
  npx tsx scripts/extract-amazon.ts "https://www.amazon.it/dp/B08XYZ1234"
  npx tsx scripts/extract-amazon.ts "pagina_salvata.html"
`);
    process.exit(1);
  }

  let htmlContent = "";
  let sourceUrl: string | undefined = undefined;

  if (arg.startsWith("http://") || arg.startsWith("https://")) {
    sourceUrl = arg;
    const asin = extractAsinFromUrl(arg);
    console.log(`🌐 Tentativo di scaricamento inserzione Amazon...`);
    if (asin) console.log(`📌 ASIN identificato: ${asin}`);

    try {
      const response = await fetch(arg, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Attenzione: il server Amazon ha risposto con codice HTTP ${response.status}.`);
      }

      htmlContent = await response.text();

      if (htmlContent.includes("Robot Check") || htmlContent.includes("api-services-support@amazon.com")) {
        console.error(`
🚨 Rilevata schermata di protezione anti-bot / CAPTCHA di Amazon.
💡 Soluzione consigliata:
   1. Apri la pagina nel tuo browser normale;
   2. Fai 'Salva pagina con nome' -> 'pagina.html';
   3. Esegui il comando passando il file locale:
      npx tsx scripts/extract-amazon.ts "pagina.html"
`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`❌ Errore di rete durante lo scaricamento dell'URL:`, err);
      process.exit(1);
    }
  } else {
    // File locale
    const filePath = path.resolve(process.cwd(), arg);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File non trovato: ${filePath}`);
      process.exit(1);
    }
    console.log(`📂 Lettura file HTML locale: ${filePath}`);
    htmlContent = fs.readFileSync(filePath, "utf-8");
  }

  console.log(`⚙️ Analisi euristica dei componenti e delle specifiche tecniche...`);
  const pkg = parseAmazonListing(htmlContent, sourceUrl);

  // Crea cartella di output
  const outputDir = path.resolve(process.cwd(), "data", "imports");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `draft-${pkg.asin || Date.now()}.json`;
  const outputPath = path.join(outputDir, filename);

  fs.writeFileSync(outputPath, JSON.stringify(pkg, null, 2), "utf-8");

  console.log(`
✅ ESTRAZIONE COMPLETATA CON SUCCESSO!
─────────────────────────────────────────────────────────────
• Brand:             ${pkg.pc.brand}
• Modello:           ${pkg.pc.modelName}
• CPU:               ${pkg.pc.cpuModel} (${pkg.pc.cpuGen})
• Windows 11 Nativo: ${pkg.pc.cpuWin11Support ? "✅ Supportato" : "❌ NON SUPPORTATO"}
• GPU:               ${pkg.pc.gpuModel} (VRAM: ${pkg.pc.gpuVramGb ? `${pkg.pc.gpuVramGb}GB` : "N/D"})
• RAM:               ${pkg.pc.ramGb}GB ${pkg.pc.ramType} (${pkg.pc.ramChannel})
• Storage:           ${pkg.pc.storageType} ${pkg.pc.storageCapacityGb}GB
• Verdetto Proposto: ${pkg.review.verdict.toUpperCase()}
• Fonti Collegate:   ${pkg.sources.length} fonti registrate
─────────────────────────────────────────────────────────────
💾 Pacchetto salvato in:
   ${outputPath}

👉 Puoi ora importare questo file nel pannello amministrativo:
   http://localhost:3000/admin/import
`);
}

main().catch(console.error);
