"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { priceOffers, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { priceOfferSchema } from "@/lib/validations";
import crypto from "crypto";

export async function savePriceOfferAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const id = (formData.get("id") as string) || crypto.randomUUID();
  const isEditing = Boolean(formData.get("isEditing"));

  const pcId = (formData.get("pcId") as string)?.trim();
  const retailer = (formData.get("retailer") as string)?.trim();
  const affiliateUrl = (formData.get("affiliateUrl") as string)?.trim();
  const cleanUrl = (formData.get("cleanUrl") as string)?.trim() || null;
  const asin = (formData.get("asin") as string)?.trim() || null;
  const priceRaw = formData.get("priceAmountEur") as string;
  const priceAmountEur = priceRaw ? parseFloat(priceRaw) : null;
  const currency = (formData.get("currency") as string)?.trim() || "EUR";
  const dataSource = (formData.get("dataSource") as any) || "manual_check";
  const isValid = formData.get("isValid") === "1" || formData.get("isValid") === "true";
  const notes = (formData.get("notes") as string)?.trim() || null;

  // 1. Verifica che il PC esista
  const targetPc = db.select().from(pcs).where(eq(pcs.id, pcId)).get();
  if (!targetPc) {
    return { error: "PC associato non trovato nel catalogo." };
  }

  // 2. Validazione Zod
  const validation = priceOfferSchema.safeParse({
    id,
    pcId,
    retailer,
    affiliateUrl,
    cleanUrl: cleanUrl || "",
    asin,
    priceAmountEur,
    currency,
    dataSource,
    isValid,
    notes,
  });

  if (!validation.success) {
    const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
    return { error: `Errore nei dati offerta: ${errorMsg}` };
  }

  const validData = validation.data;
  const now = Date.now();

  try {
    if (isEditing) {
      db.update(priceOffers)
        .set({
          pcId: validData.pcId,
          retailer: validData.retailer,
          affiliateUrl: validData.affiliateUrl,
          cleanUrl: validData.cleanUrl || null,
          asin: validData.asin || null,
          priceAmountEur: validData.priceAmountEur ?? null,
          currency: validData.currency,
          dataSource: validData.dataSource,
          isValid: validData.isValid ? 1 : 0,
          notes: validData.notes || null,
          lastVerifiedAt: now,
        })
        .where(eq(priceOffers.id, id))
        .run();
    } else {
      db.insert(priceOffers)
        .values({
          id,
          pcId: validData.pcId,
          retailer: validData.retailer,
          affiliateUrl: validData.affiliateUrl,
          cleanUrl: validData.cleanUrl || null,
          asin: validData.asin || null,
          priceAmountEur: validData.priceAmountEur ?? null,
          currency: validData.currency,
          dataSource: validData.dataSource,
          isValid: validData.isValid ? 1 : 0,
          notes: validData.notes || null,
          lastVerifiedAt: now,
          createdAt: now,
        })
        .run();
    }
  } catch (error: any) {
    return { error: `Errore durante il salvataggio: ${error.message}` };
  }

  revalidatePath("/admin/prices");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/prices");
}

export async function verifyPriceOfferAction(id: string) {
  await requireAdmin();

  db.update(priceOffers)
    .set({
      lastVerifiedAt: Date.now(),
    })
    .where(eq(priceOffers.id, id))
    .run();

  revalidatePath("/admin/prices");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleOfferValidityAction(id: string) {
  await requireAdmin();

  const offer = db.select().from(priceOffers).where(eq(priceOffers.id, id)).get();
  if (!offer) throw new Error("Offerta non trovata.");

  const newStatus = offer.isValid === 1 ? 0 : 1;

  db.update(priceOffers)
    .set({
      isValid: newStatus,
      lastVerifiedAt: Date.now(),
    })
    .where(eq(priceOffers.id, id))
    .run();

  revalidatePath("/admin/prices");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deletePriceOfferAction(id: string) {
  await requireAdmin();

  db.delete(priceOffers).where(eq(priceOffers.id, id)).run();

  revalidatePath("/admin/prices");
  revalidatePath("/admin");
  revalidatePath("/");
}
