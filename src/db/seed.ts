import { db, sqlite } from "./index";
import { pcs, reviews, curatedAlternatives, priceOffers, sources } from "./schema";

export function seedDemoData() {
  console.log("==> Inizio popolamento dati dimostrativi (Demo Seed)...");

  // Pulizia tabelle esistenti per garantire idempotenza nei test
  sqlite.exec("DELETE FROM sources;");
  sqlite.exec("DELETE FROM price_offers;");
  sqlite.exec("DELETE FROM curated_alternatives;");
  sqlite.exec("DELETE FROM reviews;");
  sqlite.exec("DELETE FROM pcs;");

  const now = Date.now();

  // 1. PC DIMOSTRATIVO: Megaport i7 datato (Trappola Commerciale)
  const pcMegaportId = "demo-pc-megaport-i7-4770";
  db.insert(pcs)
    .values({
      id: pcMegaportId,
      brand: "Megaport",
      modelName: "PC Gaming Megaport i7",
      exactConfig: "Intel Core i7-4770, 16GB RAM DDR3, GTX 1650 4GB, 512GB SSD",
      category: "desktop_gaming",
      imageUrl: "/images/demo-megaport.jpg",
      imageAlt: "PC Megaport con illuminazione RGB frontale",
      cpuModel: "Intel Core i7-4770",
      cpuGen: "Haswell (4ª Gen - 2013)",
      cpuCoresThreads: "4 Core / 8 Thread (3.4 - 3.9 GHz)",
      cpuWin11Support: 0, // Incompatibile Windows 11 nativo
      gpuModel: "NVIDIA GeForce GTX 1650",
      gpuVramGb: 4,
      gpuType: "dedicated",
      gpuDlssFsr: "Nessun supporto DLSS",
      ramGb: 16,
      ramType: "DDR3",
      ramChannel: "single",
      ramSpeedMhz: 1600,
      storageType: "SATA_SSD",
      storageCapacityGb: 512,
      storageDetails: "SSD SATA generico 2.5 pollici",
      motherboardChipset: "Intel H81 Express (LGA 1150)",
      motherboardDetails: "Scheda madre di classe OEM senza slot M.2 NVMe",
      psuWattage: 400,
      psuRating: "non_certificato",
      psuDetails: "Alimentatore generico senza certificazione 80 Plus",
      coolingDetails: "Dissipatore stock in alluminio",
      osInstalled: "Windows 11 Pro (tramite bypass non supportato)",
      osOfficialSupport: 0,
      unverifiedSpecs: JSON.stringify([
        "Marca e MTBF dell'alimentatore non dichiarati nell'inserzione",
        "Modello esatto di scheda madre non indicato dal venditore",
        "Configurazione RAM a canale singolo (1x16GB DDR3)",
      ]),
      editorialStatus: "published",
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 2,
    })
    .run();

  // 2. PC DIMOSTRATIVO: Ankermann 5600G (Office/Studio)
  const pcAnkermannId = "demo-pc-ankermann-5600g";
  db.insert(pcs)
    .values({
      id: pcAnkermannId,
      brand: "Ankermann",
      modelName: "PC Desktop Ankermann 5600G",
      exactConfig: "AMD Ryzen 5 5600G, 16GB RAM DDR4 Dual Channel, Radeon Vega 7, 500GB NVMe",
      category: "desktop_office",
      imageUrl: "/images/demo-ankermann.jpg",
      imageAlt: "Case Ankermann sobrio per uso ufficio",
      cpuModel: "AMD Ryzen 5 5600G",
      cpuGen: "Zen 3 (2021)",
      cpuCoresThreads: "6 Core / 12 Thread (3.9 - 4.4 GHz)",
      cpuWin11Support: 1, // Pienamente compatibile
      gpuModel: "AMD Radeon Vega 7 (Integrata)",
      gpuVramGb: 2, // Condivisa con RAM
      gpuType: "integrated",
      gpuDlssFsr: "FSR supportato",
      ramGb: 16,
      ramType: "DDR4",
      ramChannel: "dual",
      ramSpeedMhz: 3200,
      storageType: "NVMe",
      storageCapacityGb: 500,
      storageDetails: "PCIe 3.0 M.2",
      motherboardChipset: "AMD B450",
      motherboardDetails: "Supporta upgrade futuri AM4",
      psuWattage: 350,
      psuRating: "80+_bronze",
      psuDetails: "Alimentatore 350W certificato Bronze",
      coolingDetails: "Dissipatore Wraith Stealth",
      osInstalled: "Windows 11 Home Ufficiale",
      osOfficialSupport: 1,
      unverifiedSpecs: JSON.stringify([]),
      editorialStatus: "published",
      createdAt: now - 86400000 * 7,
      updatedAt: now - 86400000 * 3,
    })
    .run();

  // 3. PC DIMOSTRATIVO: Alternativa Bilanciata (Buon Acquisto)
  const pcBilanciatoId = "demo-pc-bilanciato-5600-rx6600";
  db.insert(pcs)
    .values({
      id: pcBilanciatoId,
      brand: "Configurazione Curata",
      modelName: "PC Desktop Bilanciato 1080p",
      exactConfig: "Ryzen 5 5600, 16GB DDR4 Dual Channel, Radeon RX 6600 8GB, 1TB NVMe, 550W Bronze",
      category: "desktop_gaming",
      imageUrl: "/images/demo-bilanciato.jpg",
      imageAlt: "Configurazione desktop moderna con airflow ottimale",
      cpuModel: "AMD Ryzen 5 5600",
      cpuGen: "Zen 3 (2022)",
      cpuCoresThreads: "6 Core / 12 Thread (3.5 - 4.4 GHz)",
      cpuWin11Support: 1,
      gpuModel: "AMD Radeon RX 6600",
      gpuVramGb: 8,
      gpuType: "dedicated",
      gpuDlssFsr: "FSR 3.0 Frame Generation supportato",
      ramGb: 16,
      ramType: "DDR4",
      ramChannel: "dual",
      ramSpeedMhz: 3200,
      storageType: "NVMe",
      storageCapacityGb: 1000,
      storageDetails: "M.2 NVMe PCIe 4.0 3500 MB/s",
      motherboardChipset: "AMD B550",
      motherboardDetails: "VRM dissipati, slot PCIe 4.0, 4 slot RAM",
      psuWattage: 550,
      psuRating: "80+_bronze",
      psuDetails: "Alimentatore 550W affidabile con protezioni OVP/UVP/SCP",
      coolingDetails: "Case mesh ad alto flusso con 3 ventole PWM",
      osInstalled: "Windows 11 Home 64-bit",
      osOfficialSupport: 1,
      unverifiedSpecs: JSON.stringify([]),
      editorialStatus: "published",
      createdAt: now - 86400000 * 10,
      updatedAt: now - 86400000 * 1,
    })
    .run();

  // 4. RECENSIONE DIMOSTRATIVA 1: Megaport (Sconsigliato)
  const reviewMegaportId = "demo-review-megaport-i7-4770";
  db.insert(reviews)
    .values({
      id: reviewMegaportId,
      pcId: pcMegaportId,
      slug: "megaport-pc-gaming-i7-4770-gtx-1650",
      title: "Megaport PC Gaming (Intel Core i7 4ª Gen + GTX 1650 4GB)",
      metaTitle: "Megaport PC Gaming i7-4770: Affare o Trappola? Opinioni e Verdetto",
      metaDescription: "Analisi tecnica del bestseller Amazon: processore del 2013, Windows 11 forzato e memoria a singolo canale. Scopri perché è sconsigliato.",
      verdict: "sconsigliato",
      summaryIntro: "Spacciato per PC gaming moderno e veloce, nasconde hardware datato 2013 con zero possibilità di aggiornamento e prezzo sproporzionato.",
      whyPositiveReviews: "Le recensioni positive su Amazon derivano dall'impatto visivo iniziale: il case ha luci RGB scenografiche e l'avvio con SSD sembra rapido a utenti inesperti nei primi giorni d'uso.",
      strengths: JSON.stringify([
        "Case con illuminazione RGB visivamente accattivante",
        "Presenza di un SSD che garantisce avvii rapidi di Windows rispetto ai vecchi dischi meccanici",
      ]),
      weaknesses: JSON.stringify([
        "Processore Intel Core i7-4770 vecchio di oltre 10 anni (anno 2013)",
        "Incompatibilità ufficiale con Windows 11: aggiornamenti a rischio",
        "RAM da 16GB in banco singolo (Single Channel) che dimezza la banda passante",
        "Scheda video GTX 1650 con soli 4GB VRAM: insufficiente per giochi moderni",
        "Prezzo richiesto oltre il triplo del valore congruo dell'hardware",
      ]),
      evidenceLevel: "verifica_indipendente",
      ratingGaming: "non_adatto",
      notesGaming: "Max 720p instabile (<30 FPS) nei titoli moderni. No DLSS e VRAM insufficiente.",
      ratingWork: "non_adatto",
      notesWork: "Inadatto per rendering 3D, Revit e video editing moderno (vecchia architettura CUDA e RAM single channel).",
      ratingOffice: "limitato",
      notesOffice: "Fluido per compiti base, ma il bypass di Windows 11 è un rischio di sicurezza a lungo termine e manca la decodifica AV1.",
      amazonListingPriceEur: 489.0,
      estimatedFairValueEur: 140.0,
      status: "published",
      publishedAt: now - 86400000 * 4,
      updatedAt: now - 86400000 * 1,
    })
    .run();

  // 5. RECENSIONE DIMOSTRATIVA 2: Ankermann (Accettabile Base)
  const reviewAnkermannId = "demo-review-ankermann-5600g";
  db.insert(reviews)
    .values({
      id: reviewAnkermannId,
      pcId: pcAnkermannId,
      slug: "ankermann-pc-desktop-ryzen-5-5600g",
      title: "PC Desktop Ankermann (AMD Ryzen 5 5600G + Vega 7)",
      metaTitle: "Ankermann Ryzen 5 5600G: Analisi Tecnica e Verdetto",
      metaDescription: "Venduto erroneamente come PC gaming, è una macchina eccellente per studio, smart working e produttività 2D.",
      verdict: "accettabile_base",
      summaryIntro: "Venduto impropriamente con etichetta 'PC Gaming', è in realtà una macchina affidabile e moderna per studio e produttività d'ufficio.",
      whyPositiveReviews: "Il processore a 6 core Zen 3 rende l'esperienza quotidiana fluida, silenziosa e reattiva.",
      strengths: JSON.stringify([
        "CPU moderna a 6 core / 12 thread scattante e con consumi contenuti",
        "Supporto ufficiale nativo a Windows 11 e TPM 2.0",
        "16GB RAM in configurazione Dual Channel che massimizza la scheda video integrata",
      ]),
      weaknesses: JSON.stringify([
        "Privo di scheda video dedicata: non idoneo per gaming moderno o carichi 3D pesanti",
        "Prezzo conveniente solo se acquistato per compiti d'ufficio, non come PC gaming",
      ]),
      evidenceLevel: "verifica_indipendente",
      ratingGaming: "limitato",
      notesGaming: "Solo eSports leggeri (League of Legends, Valorant) a 720p/1080p dettagli bassi.",
      ratingWork: "limitato",
      notesWork: "Idoneo per CAD 2D, Photoshop e produttività; limitato su 3D e video editing pesante.",
      ratingOffice: "idoneo",
      notesOffice: "Eccellente, reattivo, silenzioso e conforme a tutti gli standard di sicurezza moderni.",
      amazonListingPriceEur: 419.0,
      estimatedFairValueEur: 380.0,
      status: "published",
      publishedAt: now - 86400000 * 6,
      updatedAt: now - 86400000 * 2,
    })
    .run();

  // 6. ALTERNATIVA CURATA MANUALE: Collegamento Megaport -> PC Bilanciato (Approvata)
  db.insert(curatedAlternatives)
    .values({
      id: "demo-alt-megaport-to-bilanciato",
      sourceReviewId: reviewMegaportId,
      targetPcId: pcBilanciatoId,
      intendedUse: "Gaming 1080p Reale e longevità hardware nella stessa fascia di prezzo",
      editorialReasoning:
        "A fronte di una spesa praticamente identica (~490-520€), questa configurazione offre hardware del decennio attuale, supporto nativo a Windows 11, il triplo dei fotogrammi al secondo in gioco e componentistica standard sostituibile in futuro.",
      prosVsSource: "3x prestazioni grafiche, 8GB VRAM moderna, Windows 11 nativo, alimentatore 80+ protetto",
      consVsSource: "Richiede circa 20-30€ in più a seconda delle offerte del giorno",
      priceDifferenceEur: 30.0,
      displayOrder: 1,
      isApproved: 1, // APPROVATA MANUALMENTE
      lastVerifiedAt: now - 86400000 * 1,
      createdAt: now - 86400000 * 4,
    })
    .run();

  // 7. OFFERTE COMMERCIALI DIMOSTRATIVE
  db.insert(priceOffers)
    .values({
      id: "demo-offer-megaport",
      pcId: pcMegaportId,
      retailer: "Amazon.it",
      affiliateUrl: "https://www.amazon.it/dp/B0000DEMO1?tag=pcchiaro-21",
      cleanUrl: "https://www.amazon.it/dp/B0000DEMO1",
      asin: "B0000DEMO1",
      priceAmountEur: 489.0,
      currency: "EUR",
      dataSource: "manual_check",
      isValid: 1,
      notes: "Prezzo verificato su Amazon.it in data recente",
      lastVerifiedAt: now - 86400000 * 1,
      createdAt: now - 86400000 * 5,
    })
    .run();

  db.insert(priceOffers)
    .values({
      id: "demo-offer-bilanciato",
      pcId: pcBilanciatoId,
      retailer: "Amazon.it",
      affiliateUrl: "https://www.amazon.it/dp/B0000DEMO3?tag=pcchiaro-21",
      cleanUrl: "https://www.amazon.it/dp/B0000DEMO3",
      asin: "B0000DEMO3",
      priceAmountEur: 519.0,
      currency: "EUR",
      dataSource: "manual_check",
      isValid: 1,
      notes: "Configurazione con componenti venduti e spediti da Amazon",
      lastVerifiedAt: now - 86400000 * 1,
      createdAt: now - 86400000 * 10,
    })
    .run();

  // 8. FONTI CONSULTATE PER MEGAPORT
  db.insert(sources)
    .values({
      id: "demo-source-intel-ark",
      reviewId: reviewMegaportId,
      url: "https://ark.intel.com/content/www/it/it/ark/products/75122/intel-core-i74770-processor-8m-cache-up-to-3-90-ghz.html",
      sourceName: "Intel ARK Database Ufficiale",
      sourceType: "produttore",
      consultedAt: now - 86400000 * 5,
      notes: "Verifica data di lancio Q2 2013, TDP 84W, incompatibilità Windows 11",
    })
    .run();

  db.insert(sources)
    .values({
      id: "demo-source-techpowerup-gtx1650",
      reviewId: reviewMegaportId,
      url: "https://www.techpowerup.com/gpu-specs/geforce-gtx-1650.c3366",
      sourceName: "TechPowerUp GPU Database",
      sourceType: "benchmark_indipendente",
      consultedAt: now - 86400000 * 5,
      notes: "Specifiche VRAM GDDR5 128-bit, 896 shader cores, limiti in 1080p moderno",
    })
    .run();

  console.log("==> Popolamento dati dimostrativi completato con successo!");
}

// Esecuzione diretta se invocato da terminale
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seedDemoData();
  sqlite.close();
}
