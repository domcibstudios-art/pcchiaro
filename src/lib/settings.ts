import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SITE_CONFIG } from "@/config/site";

const SETTING_KEY_SHOW_EXACT_PRICES = "show_exact_prices";
const SETTING_KEY_AMAZON_AFFILIATE_TAG = "amazon_affiliate_tag";

let cachedAffiliateTag: string | null = null;
let cachedShowExactPrices: boolean | null = null;

/**
 * Legge lo stato di visualizzazione dei prezzi esatti.
 * Default: false (modalità conforme Amazon policy).
 */
export async function getShowExactPrices(): Promise<boolean> {
  try {
    const database = await getDb();
    const rows = await database
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTING_KEY_SHOW_EXACT_PRICES))
      .limit(1);

    if (rows && rows.length > 0) {
      cachedShowExactPrices = rows[0].value === "true";
      return cachedShowExactPrices;
    }
    return SITE_CONFIG.pricing.defaultShowExactPrices;
  } catch {
    return cachedShowExactPrices ?? SITE_CONFIG.pricing.defaultShowExactPrices;
  }
}

/**
 * Versione sincrona per contesti che non supportano chiamate asincrone.
 */
export function getShowExactPricesSync(): boolean {
  if (cachedShowExactPrices !== null) {
    return cachedShowExactPrices;
  }
  return SITE_CONFIG.pricing.defaultShowExactPrices;
}

/**
 * Recupera in modo asincrono il Tag Affiliazione Amazon dal database o dalle env.
 */
export async function getAmazonAffiliateTagAsync(): Promise<string> {
  try {
    const database = await getDb();
    const rows = await database
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
      .limit(1);

    if (rows && rows.length > 0 && rows[0].value.trim()) {
      cachedAffiliateTag = rows[0].value.trim();
      return rows[0].value.trim();
    }
  } catch {
    // Continua con il fallback
  }

  return getAmazonAffiliateTag();
}

/**
 * Recupera il Tag Affiliazione Amazon centralizzato del sito.
 * Ordine di priorità:
 * 1. Valore salvato in cache/DB
 * 2. Variabile d'ambiente NEXT_PUBLIC_AMAZON_AFFILIATE_TAG o AMAZON_AFFILIATE_TAG
 * 3. Stringa vuota (nessun tag applicato, link diretti puliti ad Amazon)
 */
export function getAmazonAffiliateTag(): string {
  if (cachedAffiliateTag !== null && cachedAffiliateTag.trim()) {
    return cachedAffiliateTag.trim();
  }

  // Se siamo in ambiente Node (es. test unitari), prova a leggere in modo sincrono
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { nodeDb } = require("@/db/node");
    const record = nodeDb
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
      .get();

    if (record && record.value.trim()) {
      cachedAffiliateTag = record.value.trim();
      return record.value.trim();
    }
  } catch {
    // Non in ambiente Node o record assente
  }

  const envTag =
    process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ||
    process.env.AMAZON_AFFILIATE_TAG ||
    "";

  return envTag.trim();
}

/**
 * Aggiorna il Tag di Affiliazione Amazon centralizzato nel database e in cache.
 */
export async function setAmazonAffiliateTag(tag: string): Promise<void> {
  const cleanTag = tag.trim();
  const now = Date.now();
  cachedAffiliateTag = cleanTag;

  try {
    const database = await getDb();
    const rows = await database
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
      .limit(1);

    if (rows && rows.length > 0) {
      await database
        .update(siteSettings)
        .set({ value: cleanTag, updatedAt: now })
        .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG));
    } else {
      await database.insert(siteSettings).values({
        key: SETTING_KEY_AMAZON_AFFILIATE_TAG,
        value: cleanTag,
        updatedAt: now,
      });
    }
  } catch {
    // Fallback sync su Node
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { nodeDb } = require("@/db/node");
      const existing = nodeDb
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
        .get();

      if (existing) {
        nodeDb.update(siteSettings)
          .set({ value: cleanTag, updatedAt: now })
          .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
          .run();
      } else {
        nodeDb.insert(siteSettings)
          .values({ key: SETTING_KEY_AMAZON_AFFILIATE_TAG, value: cleanTag, updatedAt: now })
          .run();
      }
    } catch (e) {
      console.error("Errore salvataggio affiliate tag:", e);
    }
  }
}
