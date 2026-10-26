import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SITE_CONFIG } from "@/config/site";
import { requireAdmin } from "./session";
import { revalidatePath } from "next/cache";

const SETTING_KEY_SHOW_EXACT_PRICES = "show_exact_prices";
const SETTING_KEY_AMAZON_AFFILIATE_TAG = "amazon_affiliate_tag";

/**
 * Legge lo stato di visualizzazione dei prezzi esatti.
 * Default: false (modalità conforme Amazon policy).
 */
export function getShowExactPrices(): boolean {
  try {
    const record = db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTING_KEY_SHOW_EXACT_PRICES))
      .get();

    if (!record) {
      return SITE_CONFIG.pricing.defaultShowExactPrices;
    }

    return record.value === "true";
  } catch {
    return SITE_CONFIG.pricing.defaultShowExactPrices;
  }
}

/**
 * Recupera il Tag Affiliazione Amazon centralizzato del sito.
 * Ordine di priorità:
 * 1. Valore salvato dall'admin nel database (tabella site_settings)
 * 2. Variabile d'ambiente NEXT_PUBLIC_AMAZON_AFFILIATE_TAG o AMAZON_AFFILIATE_TAG
 * 3. Stringa vuota (nessun tag applicato, link diretti puliti ad Amazon)
 */
export function getAmazonAffiliateTag(): string {
  try {
    const record = db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
      .get();

    if (record && record.value.trim()) {
      return record.value.trim();
    }
  } catch {
    // Continua con il fallback delle variabili d'ambiente
  }

  const envTag =
    process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ||
    process.env.AMAZON_AFFILIATE_TAG ||
    "";

  return envTag.trim();
}

/**
 * Aggiorna il Tag di Affiliazione Amazon centralizzato nel database.
 */
export function setAmazonAffiliateTag(tag: string): void {
  const cleanTag = tag.trim();
  const now = Date.now();

  const existing = db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
    .get();

  if (existing) {
    db.update(siteSettings)
      .set({ value: cleanTag, updatedAt: now })
      .where(eq(siteSettings.key, SETTING_KEY_AMAZON_AFFILIATE_TAG))
      .run();
  } else {
    db.insert(siteSettings)
      .values({ key: SETTING_KEY_AMAZON_AFFILIATE_TAG, value: cleanTag, updatedAt: now })
      .run();
  }
}
