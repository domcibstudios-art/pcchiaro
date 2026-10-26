"use server";

import crypto from "node:crypto";
import { db } from "@/db";
import { pcs, reviews, sources, priceOffers } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { parseAmazonListing, extractAsinFromUrl, ExtractedHardwarePackage } from "@/lib/amazon-extractor";

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
