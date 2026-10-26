/**
 * Motore di Automazione SEO per PCChiaro.it
 * Gestisce:
 * 1. Generazione automatica di Meta Title e Meta Description ottimizzati per il CTR su Google
 * 2. Generazione automatica di FAQ editoriali con risposte oggettive basate sull'hardware
 * 3. Schema.org Structured Data (JSON-LD) per Rich Snippets (Review, Product, FAQPage)
 * 4. Helper Google Suggest per intercettare le ricerche reali degli utenti
 */

import { SITE_CONFIG } from "@/config/site";

export interface ReviewMetaInput {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  summaryIntro: string;
  verdict: string;
  ratingGaming: string;
  notesGaming?: string | null;
  ratingWork: string;
  notesWork?: string | null;
  ratingOffice: string;
  notesOffice?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
}

export interface PcMetaInput {
  brand: string;
  modelName: string;
  cpuModel: string;
  cpuGen?: string | null;
  cpuWin11Support?: number | null;
  gpuModel: string;
  gpuType?: string | null;
  ramGb?: number | null;
  ramType?: string | null;
  ramChannel?: string | null;
  storageCapacityGb?: number | null;
  storageType?: string | null;
  osOfficialSupport?: number | null;
  imageUrl?: string | null;
}

export interface OfferMetaInput {
  asin?: string | null;
  priceAmountEur?: number | null;
  affiliateUrl?: string | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * 1. Genera Meta Title e Meta Description ottimizzati
 */
export function generateSeoMeta(
  review: ReviewMetaInput,
  pc: PcMetaInput,
  offer?: OfferMetaInput
): { title: string; description: string } {
  // META TITLE: se inserito manualmente lo usa, altrimenti usa la formula ad alto CTR
  let title = review.metaTitle?.trim();
  if (!title) {
    const brandModel = `${pc.brand} ${pc.modelName}`.trim();
    // Limita lunghezza per evitare troncamenti su Google (target 55-65 caratteri)
    if (brandModel.length <= 35) {
      title = `${brandModel} (${pc.cpuModel}): Recensione & Test | PCChiaro`;
    } else {
      title = `${brandModel}: Conviene davvero? Recensione | PCChiaro`;
    }
  }

  // META DESCRIPTION: se inserita manualmente la usa, altrimenti genera lo snippet persuasivo
  let description = review.metaDescription?.trim();
  if (!description) {
    const verdictLabel =
      review.verdict === "sconsigliato"
        ? "Sconsigliato (Trappola Hardware)"
        : review.verdict === "buon_acquisto"
        ? "Buon Acquisto"
        : review.verdict === "accettabile_base"
        ? "Valido solo per uso base"
        : "Conveniente solo in offerta";

    const ramText = `${pc.ramGb || 16}GB ${pc.ramType || "RAM"}`;
    const storageText = `${pc.storageCapacityGb || 512}GB ${pc.storageType || "SSD"}`;

    description = `Recensione di ${pc.brand} ${pc.modelName} (${pc.cpuModel}, ${pc.gpuModel}, ${ramText}, ${storageText}). Verdetto: ${verdictLabel}. Limiti reali, test e alternative.`;

    if (description.length > 158) {
      description = description.slice(0, 155).trim() + "...";
    }
  }

  return { title, description };
}

/**
 * 2. Genera FAQ pertinenti ed esaustive basate sui componenti effettivi del PC
 */
export function generateReviewFaqs(review: ReviewMetaInput, pc: PcMetaInput): FaqItem[] {
  const faqs: FaqItem[] = [];

  // FAQ 1: Idoneità Gaming
  let gamingAnswer = "";
  if (review.ratingGaming === "idoneo") {
    gamingAnswer = `Sì, questa macchina con ${pc.gpuModel} è idonea per il gaming a risoluzione 1080p con framerate fluido nei titoli moderni. ${review.notesGaming || ""}`;
  } else if (review.ratingGaming === "limitato") {
    gamingAnswer = `È limitato. Con ${pc.gpuModel} è possibile giocare solo a titoli eSports leggeri (es. League of Legends, Fortnite a dettagli minimi) o a risoluzioni ridotte. ${review.notesGaming || ""}`;
  } else {
    gamingAnswer = `No, non è idoneo per il gaming 3D moderno. La configurazione si affida a grafica integrata o GPU non idonea senza memoria VRAM dedicata. ${review.notesGaming || ""}`;
  }
  faqs.push({
    question: `${pc.brand} ${pc.modelName} è adatto per giocare (Gaming 1080p)?`,
    answer: gamingAnswer.trim(),
  });

  // FAQ 2: Valutazione Processore / Rischio Rebrand
  let cpuAnswer = "";
  if (pc.cpuWin11Support === 0) {
    cpuAnswer = `Attenzione: il processore ${pc.cpuModel} è basato su architettura datata (${pc.cpuGen || "pre-2018"}) e NON è supportato ufficialmente da Microsoft per Windows 11. Se presente, Windows 11 è stato installato tramite bypass, rischiando il blocco degli aggiornamenti futuri.`;
  } else {
    cpuAnswer = `Il processore ${pc.cpuModel} appartiene all'architettura ${pc.cpuGen || "recente"} ed è pienamente supportato in modo nativo da Windows 11 per tutti gli aggiornamenti di sicurezza Microsoft.`;
  }
  faqs.push({
    question: `Il processore ${pc.cpuModel} è recente e affidabile?`,
    answer: cpuAnswer.trim(),
  });

  // FAQ 3: Memoria RAM e Canale
  const ramAmount = pc.ramGb || 16;
  let ramAnswer = `Il computer è equipaggiato con ${ramAmount} GB di memoria RAM ${pc.ramType || ""}. `;
  if (ramAmount < 8) {
    ramAnswer += `❌ Criticità grave: meno di 8 GB di memoria sono inadeguati per Windows 11 moderno e causano saturazione immediata anche con attività basilari. `;
  } else if (ramAmount === 8) {
    ramAnswer += `⚠️ Attenzione: 8 GB rappresentano oggi un limite stringente. Per Windows 11, navigazione web con più schede e multitasking senza rallentamenti, lo standard minimo consigliato dalla nostra redazione è di 16 GB. `;
  } else {
    ramAnswer += `✅ La dotazione soddisfa lo standard minimo moderno di 16 GB consigliato per garantire fluidità e longevità con Windows 11. `;
  }

  if (pc.ramChannel === "single") {
    ramAnswer += `Inoltre, la memoria opera in singolo canale (Single Channel), dimezzando la banda passante teorica rispetto al Dual Channel.`;
  } else if (pc.ramChannel === "dual") {
    ramAnswer += `La memoria è configurata in Dual Channel (due banchi attivi), garantendo la massima velocità di trasferimento.`;
  } else {
    ramAnswer += `Si consiglia di verificare che siano presenti due banchi distinti per sfruttare la tecnologia Dual Channel.`;
  }
  faqs.push({
    question: `Quanta RAM include e come sono configurati i banchi di memoria?`,
    answer: ramAnswer.trim(),
  });

  // FAQ 4: Verdetto editoriale sintetico
  let verdictSummary = `La redazione di PCChiaro assegna a questa configurazione il verdetto: ${review.verdict.toUpperCase().replace("_", " ")}. `;
  verdictSummary += review.summaryIntro;
  faqs.push({
    question: `Qual è il giudizio finale della redazione su ${pc.brand} ${pc.modelName}?`,
    answer: verdictSummary.trim(),
  });

  return faqs;
}

/**
 * 3. Genera Structured Data Schema.org (JSON-LD) per Rich Snippets di Google
 */
export function generateStructuredData(
  review: ReviewMetaInput,
  pc: PcMetaInput,
  offer?: OfferMetaInput,
  faqs?: FaqItem[],
  canonicalUrl?: string
) {
  // Conversione verdetto in rating su scala 1-5 per schema Google Review
  let ratingValue = 3;
  if (review.verdict === "sconsigliato") ratingValue = 1;
  else if (review.verdict === "accettabile_base") ratingValue = 3;
  else if (review.verdict === "conveniente_offerta") ratingValue = 3.5;
  else if (review.verdict === "buon_acquisto") ratingValue = 4.5;

  const strengthsList: string[] = review.strengths ? JSON.parse(review.strengths) : [];
  const weaknessesList: string[] = review.weaknesses ? JSON.parse(review.weaknesses) : [];

  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    headline: review.title,
    description: review.summaryIntro,
    itemReviewed: {
      "@type": "Product",
      name: `${pc.brand} ${pc.modelName}`,
      brand: {
        "@type": "Brand",
        name: pc.brand,
      },
      sku: offer?.asin || undefined,
      description: `${pc.cpuModel}, ${pc.gpuModel}, ${pc.ramGb}GB RAM, ${pc.storageCapacityGb}GB SSD`,
      offers: offer?.priceAmountEur
        ? {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: offer.priceAmountEur,
            url: offer.affiliateUrl || undefined,
            availability: "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: "Amazon.it",
            },
          }
        : undefined,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: "https://pcchiaro.it",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: "https://pcchiaro.it",
    },
    positiveNotes: strengthsList.length > 0 ? {
      "@type": "ItemList",
      itemListElement: strengthsList.map((str, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: str,
      })),
    } : undefined,
    negativeNotes: weaknessesList.length > 0 ? {
      "@type": "ItemList",
      itemListElement: weaknessesList.map((wk, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: wk,
      })),
    } : undefined,
  };

  const faqSchema = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  } : null;

  return {
    reviewSchema,
    faqSchema,
  };
}

/**
 * 4. Helper per interrogare Google Suggest (ricerche reali degli utenti gratis e senza API key)
 */
export async function getGoogleSuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=it&q=${encoded}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1] as string[];
    }
    return [];
  } catch {
    return [];
  }
}
