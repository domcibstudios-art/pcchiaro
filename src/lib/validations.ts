import { z } from "zod";

/**
 * Validazione PC e Specifiche Tecniche
 */
export const pcSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1, "La marca è obbligatoria"),
  modelName: z.string().min(1, "Il nome modello è obbligatorio"),
  exactConfig: z.string().min(1, "La configurazione esatta è obbligatoria"),
  category: z.enum(["desktop_gaming", "desktop_office", "mini_pc", "laptop"]),
  imageUrl: z.string().url("URL immagine non valido").nullable().optional().or(z.literal("")),
  imageAlt: z.string().nullable().optional(),

  // CPU
  cpuModel: z.string().min(1, "Il modello di CPU è obbligatorio"),
  cpuGen: z.string().nullable().optional(),
  cpuCoresThreads: z.string().nullable().optional(),
  cpuWin11Support: z.number().int().min(0).max(1).nullable().optional(),

  // GPU
  gpuModel: z.string().min(1, "Il modello di GPU è obbligatorio"),
  gpuVramGb: z.number().int().nonnegative().nullable().optional(),
  gpuType: z.enum(["dedicated", "integrated", "unknown"]),
  gpuDlssFsr: z.string().nullable().optional(),

  // RAM
  ramGb: z.number().int().positive("La quantità di RAM deve essere maggiore di 0"),
  ramType: z.enum(["DDR3", "DDR4", "DDR5", "unknown"]).nullable().optional(),
  ramChannel: z.enum(["single", "dual", "unknown"]).nullable().optional(),
  ramSpeedMhz: z.number().int().positive().nullable().optional(),

  // Storage
  storageType: z.enum(["NVMe", "SATA_SSD", "HDD", "unknown"]).nullable().optional(),
  storageCapacityGb: z.number().int().positive().nullable().optional(),
  storageDetails: z.string().nullable().optional(),

  // Scheda madre & Alimentatore
  motherboardChipset: z.string().nullable().optional(),
  motherboardDetails: z.string().nullable().optional(),
  psuWattage: z.number().int().positive().nullable().optional(),
  psuRating: z.enum(["80+_bronze", "80+_gold", "80+_platinum", "non_certificato", "unknown"]).nullable().optional(),
  psuDetails: z.string().nullable().optional(),
  coolingDetails: z.string().nullable().optional(),

  // OS
  osInstalled: z.string().nullable().optional(),
  osOfficialSupport: z.number().int().min(0).max(1).nullable().optional(),

  // Note sui componenti omessi/non verificati
  unverifiedSpecs: z.array(z.string()).nullable().optional(),

  // Stato editoriale
  editorialStatus: z.enum(["draft", "published", "archived"]).default("draft"),
});

/**
 * Validazione Recensione
 */
export const reviewSchema = z.object({
  id: z.string().min(1),
  pcId: z.string().min(1, "Il riferimento al PC è obbligatorio"),
  slug: z
    .string()
    .min(3, "Lo slug deve contenere almeno 3 caratteri")
    .regex(/^[a-z0-9-]+$/, "Lo slug può contenere solo lettere minuscole, numeri e trattini"),
  title: z.string().min(5, "Il titolo della recensione deve contenere almeno 5 caratteri"),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),

  verdict: z.enum([
    "sconsigliato",
    "accettabile_base",
    "conveniente_offerta",
    "buon_acquisto",
    "info_insufficienti",
  ]),

  summaryIntro: z.string().min(20, "La sintesi iniziale deve contenere almeno 20 caratteri"),
  whyPositiveReviews: z.string().nullable().optional(),
  strengths: z.array(z.string()).min(1, "Inserire almeno un punto di forza o nota positiva"),
  weaknesses: z.array(z.string()).min(1, "Inserire almeno un limite o punto di attenzione"),

  evidenceLevel: z.enum(["specifiche_dichiarate", "verifica_indipendente", "test_diretto"]),

  ratingGaming: z.enum(["idoneo", "limitato", "non_adatto"]),
  notesGaming: z.string().nullable().optional(),
  ratingWork: z.enum(["idoneo", "limitato", "non_adatto"]),
  notesWork: z.string().nullable().optional(),
  ratingOffice: z.enum(["idoneo", "limitato", "non_adatto"]),
  notesOffice: z.string().nullable().optional(),

  amazonListingPriceEur: z.number().nonnegative().nullable().optional(),
  estimatedFairValueEur: z.number().nonnegative().nullable().optional(),

  status: z.enum(["draft", "in_review", "published", "archived"]).default("draft"),
});

/**
 * Validazione per la pubblicazione effettiva di una recensione
 * Regola: una recensione NON può essere pubblicata se priva dei requisiti minimi
 */
export function validateForPublication(review: z.infer<typeof reviewSchema>) {
  const errors: string[] = [];

  if (review.status === "published") {
    if (!review.title || review.title.trim().length < 5) {
      errors.push("Titolo recensione troppo breve o assente.");
    }
    if (!review.summaryIntro || review.summaryIntro.trim().length < 20) {
      errors.push("Sintesi iniziale troppo breve o assente.");
    }
    if (!review.strengths || review.strengths.length === 0) {
      errors.push("Almeno un punto di forza deve essere presente.");
    }
    if (!review.weaknesses || review.weaknesses.length === 0) {
      errors.push("Almeno un limite o debolezza deve essere presente.");
    }
    if (!review.verdict) {
      errors.push("Verdetto editoriale non definito.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validazione Alternativa Curata
 */
export const curatedAlternativeSchema = z.object({
  id: z.string().min(1),
  sourceReviewId: z.string().min(1, "La recensione di origine è obbligatoria"),
  targetPcId: z.string().min(1, "Il PC alternativo è obbligatorio"),
  intendedUse: z.string().min(5, "L'uso consigliato deve contenere almeno 5 caratteri"),
  editorialReasoning: z.string().min(10, "La motivazione editoriale deve contenere almeno 10 caratteri"),
  prosVsSource: z.string().nullable().optional(),
  consVsSource: z.string().nullable().optional(),
  priceDifferenceEur: z.number().nullable().optional(),
  displayOrder: z.number().int().default(1),
  isApproved: z.boolean().default(false),
});

/**
 * Validazione Offerta / Prezzo
 */
export const priceOfferSchema = z.object({
  id: z.string().min(1),
  pcId: z.string().min(1, "Il PC associato è obbligatorio"),
  retailer: z.string().min(1, "Il rivenditore è obbligatorio"),
  affiliateUrl: z.string().url("URL affiliato non valido"),
  cleanUrl: z.string().url("URL pulito non valido").nullable().optional().or(z.literal("")),
  asin: z.string().nullable().optional(),
  priceAmountEur: z.number().positive("Il prezzo deve essere positivo").nullable().optional(),
  currency: z.string().default("EUR"),
  dataSource: z.enum(["manual_check", "keepa", "creators_api"]).default("manual_check"),
  isValid: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

/**
 * Validazione Fonte
 */
export const sourceSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1, "La recensione associata è obbligatoria"),
  url: z.string().url("URL della fonte non valido"),
  sourceName: z.string().min(2, "Nome della fonte obbligatorio"),
  sourceType: z.enum(["produttore", "inserzione_commerciale", "benchmark_indipendente", "test_diretto", "community"]),
  notes: z.string().min(5, "Note esplicative sulla fonte obbligatorie (almeno 5 caratteri)"),
});
