"use server";

import crypto from "node:crypto";
import { db } from "@/db";
import { pcs, reviews, sources, priceOffers } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { parseAmazonListing, extractAsinFromUrl, ExtractedHardwarePackage } from "@/lib/amazon-extractor";
import { parseCsvText } from "@/lib/csv-parser";
import { generateSeoMeta } from "@/lib/seo-engine";

export interface ParseResult {
  success: boolean;
  error?: string;
  data?: ExtractedHardwarePackage;
}

/**
 * Server Action per eseguire il parsing di un link Amazon, di un testo grezzo o di un JSON
 */
export async function parseAmazonInputAction(
  input: string,
  mode: "url" | "text_or_html" | "json"
): Promise<ParseResult> {
  await requireAdmin();

  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, error: "L'input fornito è vuoto." };
  }

  // Modalità JSON: parsing diretto di un file/stringa JSON esportato
  if (mode === "json") {
    try {
      const parsed = JSON.parse(trimmed) as ExtractedHardwarePackage;
      if (!parsed.pc || !parsed.review) {
        return { success: false, error: "Il file JSON non contiene la struttura valida di PCChiaro." };
      }
      return { success: true, data: parsed };
    } catch {
      return { success: false, error: "Formato JSON non valido o corrotto." };
    }
  }

  // Modalità URL: tentativo di download diretto da Amazon.it
  if (mode === "url") {
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return { success: false, error: "Inserisci un URL valido che inizia con http:// o https://" };
    }

    // Protezione SSRF (Server-Side Request Forgery): accetta solo domini Amazon ufficiali
    try {
      const parsedUrl = new URL(trimmed);
      const host = parsedUrl.hostname.toLowerCase();
      const isAllowedHost =
        host === "amazon.it" ||
        host.endsWith(".amazon.it") ||
        host === "amzn.to" ||
        host.endsWith(".amzn.to") ||
        host === "amazon.com" ||
        host.endsWith(".amazon.com") ||
        host === "amazon.de" ||
        host.endsWith(".amazon.de") ||
        host === "amazon.fr" ||
        host.endsWith(".amazon.fr") ||
        host === "amazon.es" ||
        host.endsWith(".amazon.es");

      if (!isAllowedHost) {
        return {
          success: false,
          error: "Per motivi di sicurezza (SSRF), l'importazione automatica via URL è limitata esclusivamente ai domini ufficiali Amazon (amazon.it, amzn.to, ecc.).",
        };
      }
    } catch {
      return { success: false, error: "URL non valido." };
    }

    try {
      const res = await fetch(trimmed, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const html = await res.text();

      if (html.includes("Robot Check") || html.includes("api-services-support@amazon.com")) {
        return {
          success: false,
          error:
            "Amazon ha temporaneamente bloccato la richiesta automatica con un controllo di sicurezza (Robot Check / CAPTCHA). Copia e incolla l'HTML o il testo della pagina nella scheda 'Incolla HTML o Testo' per procedere senza blocchi.",
        };
      }

      const parsed = parseAmazonListing(html, trimmed);
      return { success: true, data: parsed };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Errore durante il recupero dell'URL Amazon: ${msg}. Prova ad incollare direttamente il testo o l'HTML.`,
      };
    }
  }

  // Modalità Testo o HTML incollato
  try {
    const asinMatch = extractAsinFromUrl(trimmed);
    const parsed = parseAmazonListing(trimmed, asinMatch ? `https://www.amazon.it/dp/${asinMatch}` : undefined);
    return { success: true, data: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Errore durante l'analisi del testo: ${msg}` };
  }
}

/**
 * Server Action per salvare il pacchetto completo nel database SQLite
 * in un'unica transazione (PCS + REVIEWS + SOURCES + PRICE_OFFERS).
 */
export async function saveImportedPackageAction(pkg: ExtractedHardwarePackage): Promise<{
  success: boolean;
  error?: string;
  reviewId?: string;
  slug?: string;
}> {
  await requireAdmin();

  const now = Date.now();
  const pcId = crypto.randomUUID();
  const reviewId = crypto.randomUUID();

  try {
    // Transazione atomica SQLite
    db.transaction((tx) => {
      // 1. Inserimento PC nel catalogo (stato: draft)
      tx.insert(pcs)
        .values({
          id: pcId,
          brand: pkg.pc.brand,
          modelName: pkg.pc.modelName,
          exactConfig: pkg.pc.exactConfig,
          category: pkg.pc.category,
          imageUrl: pkg.pc.imageUrl || null,
          imageAlt: pkg.pc.imageAlt || null,
          cpuModel: pkg.pc.cpuModel,
          cpuGen: pkg.pc.cpuGen || null,
          cpuCoresThreads: pkg.pc.cpuCoresThreads || null,
          cpuWin11Support: pkg.pc.cpuWin11Support,
          gpuModel: pkg.pc.gpuModel,
          gpuVramGb: pkg.pc.gpuVramGb || null,
          gpuType: pkg.pc.gpuType,
          gpuDlssFsr: pkg.pc.gpuDlssFsr || null,
          ramGb: pkg.pc.ramGb,
          ramType: pkg.pc.ramType,
          ramChannel: pkg.pc.ramChannel,
          ramSpeedMhz: pkg.pc.ramSpeedMhz || null,
          storageType: pkg.pc.storageType,
          storageCapacityGb: pkg.pc.storageCapacityGb,
          storageDetails: pkg.pc.storageDetails || null,
          motherboardChipset: pkg.pc.motherboardChipset || null,
          psuWattage: pkg.pc.psuWattage || null,
          psuRating: pkg.pc.psuRating || null,
          osInstalled: pkg.pc.osInstalled,
          osOfficialSupport: pkg.pc.osOfficialSupport,
          unverifiedSpecs: JSON.stringify(pkg.pc.unverifiedSpecs || []),
          editorialStatus: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .run();

      // 2. Inserimento Recensione associata (stato: draft)
      tx.insert(reviews)
        .values({
          id: reviewId,
          pcId: pcId,
          slug: pkg.review.slug,
          title: pkg.review.title,
          metaTitle: pkg.review.metaTitle || null,
          metaDescription: pkg.review.metaDescription || null,
          verdict: pkg.review.verdict,
          summaryIntro: pkg.review.summaryIntro,
          whyPositiveReviews: pkg.review.whyPositiveReviews || null,
          strengths: JSON.stringify(pkg.review.strengths || []),
          weaknesses: JSON.stringify(pkg.review.weaknesses || []),
          evidenceLevel: pkg.review.evidenceLevel,
          ratingGaming: pkg.review.ratingGaming,
          notesGaming: pkg.review.notesGaming,
          ratingWork: pkg.review.ratingWork,
          notesWork: pkg.review.notesWork,
          ratingOffice: pkg.review.ratingOffice,
          notesOffice: pkg.review.notesOffice,
          status: "draft",
          updatedAt: now,
        })
        .run();

      // 3. Inserimento Fonti associate alla recensione
      if (pkg.sources && pkg.sources.length > 0) {
        for (const s of pkg.sources) {
          tx.insert(sources)
            .values({
              id: crypto.randomUUID(),
              reviewId: reviewId,
              sourceName: s.sourceName,
              sourceType: s.sourceType,
              url: s.url,
              notes: s.notes,
              consultedAt: now,
            })
            .run();
        }
      }

      // 4. Inserimento Offerta Commerciale collegata al PC
      if (pkg.offer && pkg.offer.affiliateUrl) {
        tx.insert(priceOffers)
          .values({
            id: crypto.randomUUID(),
            pcId: pcId,
            retailer: pkg.offer.retailer || "Amazon.it",
            affiliateUrl: pkg.offer.affiliateUrl,
            asin: pkg.offer.asin || null,
            priceAmountEur: pkg.offer.priceAmountEur || null,
            currency: pkg.offer.currency || "EUR",
            dataSource: pkg.offer.dataSource || "manual_check",
            isValid: 1,
            lastVerifiedAt: now,
            createdAt: now,
          })
          .run();
      }
    });

    // Revalida le rotte dell'area amministrativa
    revalidatePath("/admin");
    revalidatePath("/admin/pcs");
    revalidatePath("/admin/reviews");
    revalidatePath("/admin/sources");
    revalidatePath("/admin/prices");

    return {
      success: true,
      reviewId,
      slug: pkg.review.slug,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Errore durante il salvataggio nel database: ${msg}` };
  }
}

/**
 * Server Action per importare direttamente un file o testo CSV (modificato in Excel)
 * creando contemporaneamente PC, Recensioni bozza e Offerte nel database.
 */
export async function importCsvContentAction(csvText: string): Promise<{
  success: boolean;
  error?: string;
  importedCount?: number;
}> {
  await requireAdmin();

  const trimmed = csvText.trim();
  if (!trimmed) {
    return { success: false, error: "Il file o testo CSV fornito è vuoto." };
  }

  const { headers, rows } = parseCsvText(trimmed);
  if (rows.length === 0) {
    return {
      success: false,
      error: "Il file CSV non contiene righe di dati valide oltre all'intestazione.",
    };
  }

  const getCol = (parts: string[], name: string, fallbackIdx: number): string => {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase().trim());
    const targetIdx = idx !== -1 ? idx : fallbackIdx;
    return parts[targetIdx] !== undefined ? parts[targetIdx].trim() : "";
  };

  const now = Date.now();
  let importedCount = 0;

  try {
    db.transaction((tx) => {
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
        const amazonUrl = getCol(parts, "amazon_url", 27);

        if (!brand || !modello || !cpuModello) continue;

        const pcId = crypto.randomUUID();
        const reviewId = crypto.randomUUID();
        const slug =
          (titoloRecensione || modello)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) + (asin ? `-${asin.toLowerCase()}` : `-${Date.now().toString(36)}`);

        const strengthsArray = puntiForza
          ? puntiForza.split("|").map((s) => s.trim()).filter(Boolean)
          : [];
        const weaknessesArray = criticita
          ? criticita.split("|").map((s) => s.trim()).filter(Boolean)
          : [];

        // Genera automaticamente i Meta SEO ad alto CTR se non forniti
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
            brand: brand || "Brand Generico",
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

        tx.insert(pcs)
          .values({
            id: pcId,
            brand: brand || "Brand Generico",
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
          })
          .run();

        tx.insert(reviews)
          .values({
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
            status: "draft",
            updatedAt: now,
          })
          .run();

        if (amazonUrl || asin) {
          tx.insert(priceOffers)
            .values({
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
            })
            .run();
        }

        importedCount++;
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pcs");
    revalidatePath("/admin/reviews");
    revalidatePath("/admin/prices");

    return { success: true, importedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Errore durante l'importazione del CSV: ${msg}` };
  }
}
