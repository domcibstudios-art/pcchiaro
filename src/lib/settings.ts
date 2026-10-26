import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SITE_CONFIG } from "@/config/site";
import { requireAdmin } from "./session";
import { revalidatePath } from "next/cache";

const SETTING_KEY_SHOW_EXACT_PRICES = "show_exact_prices";

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
 * Server Action per aggiornare con 1 clic l'impostazione dall'area amministrativa
 */
export async function toggleShowExactPricesAction() {
  await requireAdmin();

  const current = getShowExactPrices();
  const newValue = current ? "false" : "true";
  const now = Date.now();

  const existing = db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTING_KEY_SHOW_EXACT_PRICES))
    .get();

  if (existing) {
    db.update(siteSettings)
      .set({ value: newValue, updatedAt: now })
      .where(eq(siteSettings.key, SETTING_KEY_SHOW_EXACT_PRICES))
      .run();
  } else {
    db.insert(siteSettings)
      .values({ key: SETTING_KEY_SHOW_EXACT_PRICES, value: newValue, updatedAt: now })
      .run();
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prices");
  revalidatePath("/admin/reviews");
}
