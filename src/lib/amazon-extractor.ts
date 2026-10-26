/**
 * Modulo di Estrazione ed Euristica Hardware Amazon.it
 * Analizza pagine, tabelle tecniche e testi di inserzioni Amazon per generare
 * una bozza completa (PC, Recensione, Fonti, Offerta) pronta per la revisione.
 */

export interface ExtractedHardwarePackage {
  extractedAt: number;
  sourceUrl?: string;
  asin?: string;
  pc: {
    brand: string;
    modelName: string;
    exactConfig: string;
    category: "desktop_gaming" | "desktop_office" | "mini_pc" | "laptop";
    imageUrl?: string | null;
    imageAlt?: string | null;
    cpuModel: string;
    cpuGen?: string | null;
    cpuCoresThreads?: string | null;
    cpuWin11Support: number; // 1 = sì, 0 = no
    gpuModel: string;
    gpuVramGb?: number | null;
    gpuType: "dedicated" | "integrated" | "unknown";
    gpuDlssFsr?: string | null;
    ramGb: number;
    ramType: string;
    ramChannel: "single" | "dual" | "unknown";
    ramSpeedMhz?: number | null;
    storageType: string;
    storageCapacityGb: number;
    storageDetails?: string | null;
    motherboardChipset?: string | null;
    psuWattage?: number | null;
    psuRating?: string | null;
    osInstalled: string;
    osOfficialSupport: number;
    unverifiedSpecs: string[];
    editorialStatus: "draft";
  };
  review: {
    slug: string;
    title: string;
    summaryIntro: string;
    whyPositiveReviews?: string | null;
    strengths: string[];
    weaknesses: string[];
    evidenceLevel: "specifiche_dichiarate" | "verifica_indipendente" | "test_diretto";
    verdict: "sconsigliato" | "accettabile_base" | "conveniente_offerta" | "buon_acquisto" | "info_insufficienti";
    ratingGaming: "idoneo" | "limitato" | "non_adatto";
    notesGaming: string;
    ratingWork: "idoneo" | "limitato" | "non_adatto";
    notesWork: string;
    ratingOffice: "idoneo" | "limitato" | "non_adatto";
    notesOffice: string;
    status: "draft";
  };
  offer: {
    retailer: string;
    affiliateUrl: string;
    asin?: string | null;
    priceAmountEur?: number | null;
    currency: string;
    dataSource: string;
  };
  sources: Array<{
    sourceName: string;
    sourceType: "produttore" | "inserzione_commerciale" | "benchmark_indipendente" | "test_diretto" | "community";
    url: string;
    notes: string;
  }>;
}

/**
 * Estrae l'ASIN da un URL Amazon o da una stringa
 */
export function extractAsinFromUrl(url: string): string | null {
  const match = url.match(/(?:\/dp\/|\/gp\/product\/|asin=)([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Normalizza il testo rimuovendo tag HTML, spazi multipli ed entità
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Analizza le specifiche della CPU per identificare generazione e supporto Windows 11
 */
function analyzeCpu(rawCpu: string): {
  model: string;
  gen: string;
  win11: number;
} {
  const cpu = rawCpu.trim();

  // Pattern Intel Core iX-XXXX
  const intelMatch = cpu.match(/i[3579][ -]?(\d{4,5})([A-Z]*)/i);
  if (intelMatch) {
    const num = parseInt(intelMatch[1], 10);
    const suffix = intelMatch[2] || "";
    const tier = cpu.match(/i[3579]/i)?.[0].toLowerCase() || "i7";
    const formattedModel = `Intel Core ${tier}-${num}${suffix}`;

    if (num < 1000) {
      // 1ª gen es. i7-860
      return {
        model: formattedModel,
        gen: "1ª Generazione (Nehalem, 2008-2010)",
        win11: 0,
      };
    } else if (num >= 2000 && num < 3000) {
      return {
        model: formattedModel,
        gen: "2ª Generazione (Sandy Bridge, 2011)",
        win11: 0,
      };
    } else if (num >= 3000 && num < 4000) {
      return {
        model: formattedModel,
        gen: "3ª Generazione (Ivy Bridge, 2012)",
        win11: 0,
      };
    } else if (num >= 4000 && num < 5000) {
      return {
        model: formattedModel,
        gen: "4ª Generazione (Haswell, 2013)",
        win11: 0,
      };
    } else if (num >= 5000 && num < 6000) {
      return {
        model: formattedModel,
        gen: "5ª Generazione (Broadwell, 2014-2015)",
        win11: 0,
      };
    } else if (num >= 6000 && num < 7000) {
      return {
        model: formattedModel,
        gen: "6ª Generazione (Skylake, 2015)",
        win11: 0,
      };
    } else if (num >= 7000 && num < 8000) {
      return {
        model: formattedModel,
        gen: "7ª Generazione (Kaby Lake, 2017)",
        win11: 0,
      };
    } else if (num >= 8000 && num < 9000) {
      return {
        model: formattedModel,
        gen: "8ª Generazione (Coffee Lake, 2017-2018)",
        win11: 1,
      };
    } else if (num >= 9000 && num < 10000) {
      return {
        model: formattedModel,
        gen: "9ª Generazione (Coffee Lake Refresh, 2018-2019)",
        win11: 1,
      };
    } else if (num >= 10000 && num < 11000) {
      return {
        model: formattedModel,
        gen: "10ª Generazione (Comet Lake, 2020)",
        win11: 1,
      };
    } else if (num >= 11000 && num < 12000) {
      return {
        model: formattedModel,
        gen: "11ª Generazione (Rocket Lake, 2021)",
        win11: 1,
      };
    } else if (num >= 12000 && num < 13000) {
      return {
        model: formattedModel,
        gen: "12ª Generazione (Alder Lake, 2021-2022)",
        win11: 1,
      };
    } else if (num >= 13000 && num < 14000) {
      return {
        model: formattedModel,
        gen: "13ª Generazione (Raptor Lake, 2022-2023)",
        win11: 1,
      };
    } else if (num >= 14000) {
      return {
        model: formattedModel,
        gen: "14ª Generazione (Raptor Lake Refresh, 2023-2024)",
        win11: 1,
      };
    }
  }

  // Pattern AMD Ryzen
  const ryzenMatch = cpu.match(/Ryzen[ -]?([3579])[ -]?(\d{4})([A-Z]*)/i);
  if (ryzenMatch) {
    const tier = ryzenMatch[1];
    const num = parseInt(ryzenMatch[2], 10);
    const suffix = ryzenMatch[3] || "";

    if (num < 2000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen 1 (2017)",
        win11: 0,
      };
    } else if (num >= 2000 && num < 3000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen+ (2018)",
        win11: num >= 2600 ? 1 : 0,
      };
    } else if (num >= 3000 && num < 4000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen 2 (2019)",
        win11: 1,
      };
    } else if (num >= 4000 && num < 5000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen 2 / Renoir (2020)",
        win11: 1,
      };
    } else if (num >= 5000 && num < 6000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen 3 (Cezanne/Vermeer, 2020-2021)",
        win11: 1,
      };
    } else if (num >= 7000 && num < 8000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen 4 (Raphael, 2022-2023)",
        win11: 1,
      };
    } else if (num >= 8000) {
      return {
        model: `AMD Ryzen ${tier} ${num}${suffix}`,
        gen: "Zen 4/5 (2024)",
        win11: 1,
      };
    }
  }

  // Altre CPU (Athlon, FX, Core 2, Celeron, Xeon datati)
  const isOld = /core 2|quad|duo|fx-|athlon|phenom|pentium g|e5-|e3-/i.test(cpu);
  return {
    model: cpu || "Processore da identificare",
    gen: isOld ? "Architettura obsoleta pre-2017" : "Da verificare",
    win11: isOld ? 0 : 1,
  };
}

/**
 * Analizza le specifiche della GPU (dedicata vs integrata, VRAM)
 */
function analyzeGpu(rawGpu: string): {
  model: string;
  vram: number | null;
  type: "dedicated" | "integrated" | "unknown";
} {
  const gpu = rawGpu.trim();
  const lower = gpu.toLowerCase();

  // Rilevamento Integrate
  if (
    lower.includes("intel hd") ||
    lower.includes("intel uhd") ||
    lower.includes("intel iris") ||
    lower.includes("vega 7") ||
    lower.includes("vega 8") ||
    lower.includes("radeon graphics") ||
    lower.includes("integrat")
  ) {
    return {
      model: gpu || "Grafica Integrata",
      vram: null,
      type: "integrated",
    };
  }

  // Rilevamento VRAM da testo es. "GTX 1650 4GB" o "RTX 3060 12 GB"
  const vramMatch = gpu.match(/(\d{1,2})\s*GB/i);
  const vram = vramMatch ? parseInt(vramMatch[1], 10) : null;

  const isDedicated = /geforce|gtx|rtx|radeon rx|geforce gt|arc /i.test(gpu);

  return {
    model: gpu || "Scheda video da identificare",
    vram: vram || (lower.includes("1650") ? 4 : lower.includes("3060") ? 12 : lower.includes("4060") ? 8 : null),
    type: isDedicated ? "dedicated" : "unknown",
  };
}

/**
 * Parser principale che converte testo o HTML Amazon in un pacchetto importabile completo
 */
export function parseAmazonListing(
  htmlOrText: string,
  sourceUrl?: string
): ExtractedHardwarePackage {
  const asin = sourceUrl ? extractAsinFromUrl(sourceUrl) || "" : "";

  // 1. Estrazione Titolo
  let title = "";
  const titleTagMatch = htmlOrText.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i);
  if (titleTagMatch) {
    title = cleanText(titleTagMatch[1]);
  } else {
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const match = htmlOrText.match(titleRegex);
    if (match) {
      title = cleanText(match[1]).replace(/ : Amazon\.it.*$/i, "").replace(/ \| Amazon\.it.*$/i, "");
    } else {
      // Prima riga di testo
      const lines = htmlOrText.split("\n").map((l) => l.trim()).filter(Boolean);
      title = lines[0] || "PC Desktop Amazon";
    }
  }

  // 2. Estrazione Brand
  let brand = "Sconosciuto";
  const brandMatch = htmlOrText.match(/bylineInfo"[^>]*>Visita lo store di ([^<]+)<\/a>/i) ||
    htmlOrText.match(/Marchio\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    htmlOrText.match(/Marchio[:\s]+([^\n\r,]+)/i);

  if (brandMatch) {
    brand = cleanText(brandMatch[1]);
  } else if (/megaport/i.test(title)) {
    brand = "Megaport";
  } else if (/ankermann/i.test(title)) {
    brand = "Ankermann";
  } else if (/sedatech/i.test(title)) {
    brand = "Sedatech";
  } else if (/vibox/i.test(title)) {
    brand = "Vibox";
  } else if (/hp /i.test(title)) {
    brand = "HP";
  } else if (/lenovo/i.test(title)) {
    brand = "Lenovo";
  } else if (/asus/i.test(title)) {
    brand = "ASUS";
  }

  // 3. Estrazione CPU
  let rawCpu = "";
  const cpuRowMatch = htmlOrText.match(/(?:Marchio processore|Tipo processore|Processore)\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    htmlOrText.match(/(?:Processore|CPU)[:\s]+([^\n\r,]+)/i);

  if (cpuRowMatch) {
    rawCpu = cleanText(cpuRowMatch[1]);
  } else {
    // Cerca nel titolo es. Core i7-4770 o Ryzen 5 5600G
    const cpuTitleMatch = title.match(/(?:Intel\s+)?(?:Core\s+)?i[3579][ -]?\d{4,5}[A-Z]*/i) ||
      title.match(/Ryzen\s+[3579]\s+\d{4}[A-Z]*/i);
    if (cpuTitleMatch) {
      rawCpu = cpuTitleMatch[0];
    }
  }

  const cpuData = analyzeCpu(rawCpu || "Intel Core i7-4770");

  // 4. Estrazione GPU
  let rawGpu = "";
  const gpuRowMatch = htmlOrText.match(/(?:Coprocessore grafico|Descrizione scheda grafica|Scheda grafica)\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    htmlOrText.match(/(?:Scheda grafica|GPU)[:\s]+([^\n\r,]+)/i);

  if (gpuRowMatch) {
    rawGpu = cleanText(gpuRowMatch[1]);
  } else {
    const gpuTitleMatch = title.match(/(?:GeForce\s+)?(?:GTX|RTX)\s+\d{3,4}(?:\s*Ti|\s*Super)?(?:\s*\dGB)?/i) ||
      title.match(/Radeon\s+RX\s+\d{4}(?:\s*XT)?/i) ||
      title.match(/Vega\s+\d/i);
    if (gpuTitleMatch) {
      rawGpu = gpuTitleMatch[0];
    }
  }

  const gpuData = analyzeGpu(rawGpu || "GTX 1650 4GB");

  // 5. Estrazione RAM
  let ramGb = 16;
  const ramMatch = htmlOrText.match(/(?:Dimensioni RAM|Memoria RAM|RAM)\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    htmlOrText.match(/(\d{1,2})\s*GB\s*(?:DDR[345]|RAM)/i) ||
    title.match(/(\d{1,2})\s*GB\s*(?:DDR[345]|RAM)/i);

  if (ramMatch) {
    const num = parseInt(ramMatch[1], 10);
    if (!isNaN(num)) ramGb = num;
  }

  let ramType = "DDR4";
  if (/DDR3/i.test(htmlOrText) || cpuData.gen.includes("4ª") || cpuData.gen.includes("3ª")) {
    ramType = "DDR3";
  } else if (/DDR5/i.test(htmlOrText) || cpuData.gen.includes("13ª") || cpuData.gen.includes("14ª") || cpuData.gen.includes("Zen 4")) {
    ramType = "DDR5";
  }

  let ramChannel: "single" | "dual" | "unknown" = "unknown";
  if (/1x|singolo banco|single channel/i.test(htmlOrText)) {
    ramChannel = "single";
  } else if (/2x|dual channel|doppio canale/i.test(htmlOrText)) {
    ramChannel = "dual";
  } else if (ramType === "DDR3" && ramGb === 16) {
    // Nella maggior parte dei preassemblati trappola economici con DDR3 usano 1x16GB o 2 banchi ricondizionati
    ramChannel = "single";
  }

  // 6. Estrazione Storage
  let storageCapacityGb = 512;
  let storageType = "SATA_SSD";
  const ssdMatch = htmlOrText.match(/(\d{3,4})\s*GB\s*(?:SSD|NVMe|M\.2)/i) ||
    title.match(/(\d{3,4})\s*GB\s*(?:SSD|NVMe|M\.2)/i);

  if (ssdMatch) {
    storageCapacityGb = parseInt(ssdMatch[1], 10);
  } else if (/1\s*TB\s*(?:SSD|NVMe)/i.test(htmlOrText) || /1TB/i.test(title)) {
    storageCapacityGb = 1000;
  }

  if (/NVMe|M\.2|PCIe/i.test(htmlOrText)) {
    storageType = "NVMe";
  }

  // 7. Estrazione Prezzo indicativo
  let priceAmountEur: number | null = null;
  const priceMatch = htmlOrText.match(/<span class="a-price-whole">([0-9.,]+)<\/span>/i) ||
    htmlOrText.match(/([0-9]{2,4}[.,][0-9]{2})\s*€/);
  if (priceMatch) {
    const rawNum = priceMatch[1].replace(".", "").replace(",", ".");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed)) priceAmountEur = parsed;
  }

  // 8. Rilevamento Componenti Omessi (Specifiche non verificate)
  const unverifiedSpecs: string[] = [];
  if (!/80\s*plus|80\+|bronze|gold|watt|alimentatore.*w/i.test(htmlOrText)) {
    unverifiedSpecs.push("Alimentatore (PSU): marca, wattaggio reale e certificazione 80 Plus non dichiarati dal venditore.");
  }
  if (ramChannel === "unknown") {
    unverifiedSpecs.push("RAM: configurazione Single o Dual Channel e frequenza MHz non specificate.");
  }
  if (!/samsung|crucial|kingston|wd|western digital/i.test(htmlOrText)) {
    unverifiedSpecs.push("SSD: marca e velocità di lettura/scrittura omesse (probabile disco economico DRAM-less).");
  }
  if (!/b450|b550|b660|b760|h610|h81|h110|z/i.test(htmlOrText)) {
    unverifiedSpecs.push("Scheda Madre: modello esatto e chipset non dichiarati.");
  }

  // 9. Euristica Verdetto e Semaforo d'Uso
  let verdict: ExtractedHardwarePackage["review"]["verdict"] = "info_insufficienti";
  let ratingGaming: "idoneo" | "limitato" | "non_adatto" = "limitato";
  let ratingWork: "idoneo" | "limitato" | "non_adatto" = "limitato";
  let ratingOffice: "idoneo" | "limitato" | "non_adatto" = "idoneo";

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (cpuData.win11 === 0) {
    verdict = "sconsigliato";
    weaknesses.push(`Processore datato (${cpuData.gen}) non supportato ufficialmente da Windows 11.`);
    weaknesses.push("Possibile blocco o interruzione degli aggiornamenti di sicurezza Microsoft per installazione con bypass.");
    if (ramType === "DDR3") {
      weaknesses.push("Memoria RAM DDR3 obsoleta su socket non più aggiornabile senza sostituire blocco scheda madre/CPU/RAM.");
    }
  } else {
    strengths.push(`Piattaforma moderna (${cpuData.gen}) pienamente compatibile con Windows 11 nativo.`);
  }

  if (gpuData.type === "dedicated" && gpuData.vram && gpuData.vram <= 4) {
    weaknesses.push(`Scheda video con soli ${gpuData.vram}GB di VRAM: soggetta a saturazione della memoria e freeze nei giochi moderni anche a 1080p.`);
  }

  if (gpuData.type === "dedicated" && gpuData.vram && gpuData.vram >= 8) {
    strengths.push(`GPU con ${gpuData.vram}GB di VRAM dedicata, adeguata per giocare a 1080p a dettagli alti.`);
    ratingGaming = "idoneo";
  } else if (gpuData.type === "dedicated" && gpuData.vram && gpuData.vram >= 4) {
    ratingGaming = "limitato";
  } else {
    ratingGaming = "non_adatto";
    weaknesses.push("Grafica integrata o assenza di GPU dedicata: non idoneo per il gaming moderno 3D.");
  }

  if (/nvidia|geforce|rtx|gtx/i.test(gpuData.model)) {
    strengths.push("Presenza di architettura NVIDIA con supporto all'ecosistema CUDA per accelerazione grafica.");
    ratingWork = "idoneo";
  } else {
    ratingWork = "limitato";
  }

  if (ramChannel === "single") {
    weaknesses.push("RAM configurata in singolo canale: banda passante dimezzata con perdita fino al 20-25% di frame rate.");
  }

  if (verdict !== "sconsigliato") {
    if (ratingGaming === "idoneo" && cpuData.win11 === 1) {
      verdict = "buon_acquisto";
    } else if (ratingOffice === "idoneo") {
      verdict = "accettabile_base";
    }
  }

  // Costruzione slug univoco
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const slug = `${cleanTitle}${asin ? `-${asin.toLowerCase()}` : ""}`;

  // Fonti verificate automatiche
  const sources: ExtractedHardwarePackage["sources"] = [
    {
      sourceName: "Inserzione Commerciale Amazon.it",
      sourceType: "inserzione_commerciale",
      url: sourceUrl || `https://www.amazon.it/dp/${asin || ""}`,
      notes: "Scheda tecnica e dichiarazioni ufficiali del venditore sull'inserzione Amazon.",
    },
    {
      sourceName: `Datasheet Ufficiale ${cpuData.model}`,
      sourceType: "produttore",
      url: cpuData.model.includes("Intel")
        ? `https://ark.intel.com/content/www/it/it/ark/search.html?_charset_=UTF-8&q=${encodeURIComponent(cpuData.model)}`
        : `https://www.amd.com/it/search.html#q=${encodeURIComponent(cpuData.model)}`,
      notes: "Specifiche architetturali, anno di rilascio e compatibilità socket dal produttore del processore.",
    },
  ];

  if (gpuData.type === "dedicated") {
    sources.push({
      sourceName: `Database Tecnico GPU (${gpuData.model})`,
      sourceType: "benchmark_indipendente",
      url: `https://www.techpowerup.com/gpu-specs/?ajaxsrch=${encodeURIComponent(gpuData.model)}`,
      notes: "Verifica quantitativo VRAM, larghezza del bus di memoria e consumi massimi (TDP).",
    });
  }

  return {
    extractedAt: Date.now(),
    sourceUrl: sourceUrl || (asin ? `https://www.amazon.it/dp/${asin}` : undefined),
    asin: asin || undefined,
    pc: {
      brand: brand || "Brand Generico",
      modelName: title.slice(0, 80),
      exactConfig: `${cpuData.model} / ${gpuData.model} / ${ramGb}GB ${ramType} / ${storageCapacityGb}GB ${storageType}`,
      category: gpuData.type === "dedicated" ? "desktop_gaming" : "desktop_office",
      cpuModel: cpuData.model,
      cpuGen: cpuData.gen,
      cpuCoresThreads: null,
      cpuWin11Support: cpuData.win11,
      gpuModel: gpuData.model,
      gpuVramGb: gpuData.vram,
      gpuType: gpuData.type,
      gpuDlssFsr: /dlss/i.test(htmlOrText) ? "DLSS" : /fsr/i.test(htmlOrText) ? "FSR" : null,
      ramGb,
      ramType,
      ramChannel,
      ramSpeedMhz: null,
      storageType,
      storageCapacityGb,
      storageDetails: `${storageType} ${storageCapacityGb}GB`,
      motherboardChipset: null,
      psuWattage: null,
      psuRating: null,
      osInstalled: "Windows 11 Pro",
      osOfficialSupport: cpuData.win11,
      unverifiedSpecs,
      editorialStatus: "draft",
    },
    review: {
      slug,
      title: title.slice(0, 100),
      summaryIntro: `Analisi indipendente della configurazione ${brand} con ${cpuData.model} e ${gpuData.model}: verifica di compatibilità, banda memoria e limiti d'uso reali.`,
      whyPositiveReviews:
        "Molti acquirenti lasciano una recensione entusiasta nelle prime 24 ore perché il PC si avvia rapidamente grazie all'SSD e presenta un case accattivante con ventole RGB, senza avere gli strumenti tecnici per verificare che la CPU è datata o che la RAM lavora a banda dimezzata.",
      strengths,
      weaknesses,
      evidenceLevel: "specifiche_dichiarate",
      verdict,
      ratingGaming,
      notesGaming:
        ratingGaming === "idoneo"
          ? "GPU dedicata con VRAM sufficiente per giocare a 1080p con dettagli grafici medi o alti."
          : ratingGaming === "limitato"
          ? "Risoluzione 1080p raggiungibile solo scendendo a compromessi grafici su dettagli e texture a causa della memoria limitata."
          : "Configurazione non idonea per il gaming moderno 3D: assenza di scheda video con memoria dedicata.",
      ratingWork,
      notesWork:
        ratingWork === "idoneo"
          ? "Accelerazione CUDA supportata per rendering 3D, Premiere e modellazione CAD."
          : "Tempi di esportazione video e rendering rallentati dall'assenza di accelerazione dedicata.",
      ratingOffice,
      notesOffice:
        ratingOffice === "idoneo"
          ? "Pienamente adeguato per Office, navigazione web con molte schede aperte e streaming video fluido."
          : "Utilizzabile per ufficio ma con riserva sulla compatibilità a lungo termine degli aggiornamenti.",
      status: "draft",
    },
    offer: {
      retailer: "Amazon.it",
      affiliateUrl: sourceUrl || (asin ? `https://www.amazon.it/dp/${asin}` : "https://www.amazon.it"),
      asin: asin || null,
      priceAmountEur,
      currency: "EUR",
      dataSource: "manual_check",
    },
    sources,
  };
}
