"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { curatedAlternatives, reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { curatedAlternativeSchema } from "@/lib/validations";
import crypto from "crypto";

export async function saveAlternativeAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const id = (formData.get("id") as string) || crypto.randomUUID();
  const isEditing = Boolean(formData.get("isEditing"));

  const sourceReviewId = (formData.get("sourceReviewId") as string)?.trim();
  const targetPcId = (formData.get("targetPcId") as string)?.trim();
  const intendedUse = (formData.get("intendedUse") as string)?.trim();
  const editorialReasoning = (formData.get("editorialReasoning") as string)?.trim();
  const prosVsSource = (formData.get("prosVsSource") as string)?.trim() || null;
  const consVsSource = (formData.get("consVsSource") as string)?.trim() || null;
  const priceDifferenceRaw = formData.get("priceDifferenceEur") as string;
  const priceDifferenceEur = priceDifferenceRaw ? parseFloat(priceDifferenceRaw) : null;
  const displayOrder = parseInt((formData.get("displayOrder") as string) || "1", 10);
  const isApproved = formData.get("isApproved") === "1" || formData.get("isApproved") === "true";

  // 1. Verifica che la recensione sorgente esista
  const sourceReview = db.select().from(reviews).where(eq(reviews.id, sourceReviewId)).get();
  if (!sourceReview) {
    return { error: "Recensione di partenza non trovata." };
  }

  // 2. Controllo vincolo: non è consentito auto-referenziare il medesimo PC
  if (sourceReview.pcId === targetPcId) {
    return {
      error: "Il PC alternativo consigliato non può coincidere con il PC oggetto della recensione.",
    };
  }

  // 3. Verifica che il PC target esista
  const targetPc = db.select().from(pcs).where(eq(pcs.id, targetPcId)).get();
  if (!targetPc) {
    return { error: "PC alternativo selezionato non trovato nel catalogo." };
  }

  // 4. Validazione schema Zod
  const validation = curatedAlternativeSchema.safeParse({
    id,
    sourceReviewId,
    targetPcId,
    intendedUse,
    editorialReasoning,
    prosVsSource,
    consVsSource,
    priceDifferenceEur,
    displayOrder,
    isApproved,
  });

  if (!validation.success) {
    const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
    return { error: `Errore di validazione: ${errorMsg}` };
  }

  const validData = validation.data;
  const now = Date.now();

  try {
    if (isEditing) {
      db.update(curatedAlternatives)
        .set({
          sourceReviewId: validData.sourceReviewId,
          targetPcId: validData.targetPcId,
          intendedUse: validData.intendedUse,
          editorialReasoning: validData.editorialReasoning,
          prosVsSource: validData.prosVsSource || null,
          consVsSource: validData.consVsSource || null,
          priceDifferenceEur: validData.priceDifferenceEur ?? null,
          displayOrder: validData.displayOrder,
          isApproved: validData.isApproved ? 1 : 0,
          lastVerifiedAt: now,
        })
        .where(eq(curatedAlternatives.id, id))
        .run();
    } else {
      db.insert(curatedAlternatives)
        .values({
          id,
          sourceReviewId: validData.sourceReviewId,
          targetPcId: validData.targetPcId,
          intendedUse: validData.intendedUse,
          editorialReasoning: validData.editorialReasoning,
          prosVsSource: validData.prosVsSource || null,
          consVsSource: validData.consVsSource || null,
          priceDifferenceEur: validData.priceDifferenceEur ?? null,
          displayOrder: validData.displayOrder,
          isApproved: validData.isApproved ? 1 : 0,
          lastVerifiedAt: now,
          createdAt: now,
        })
        .run();
    }
  } catch (error: any) {
    return { error: `Errore durante il salvataggio: ${error.message}` };
  }

  revalidatePath("/admin/alternatives");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/alternatives");
}

export async function toggleApprovalAction(id: string) {
  await requireAdmin();

  const alt = db.select().from(curatedAlternatives).where(eq(curatedAlternatives.id, id)).get();
  if (!alt) throw new Error("Alternativa non trovata.");

  const newStatus = alt.isApproved === 1 ? 0 : 1;
  const now = Date.now();

  db.update(curatedAlternatives)
    .set({
      isApproved: newStatus,
      lastVerifiedAt: now,
    })
    .where(eq(curatedAlternatives.id, id))
    .run();

  revalidatePath("/admin/alternatives");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function verifyAlternativeAction(id: string) {
  await requireAdmin();

  db.update(curatedAlternatives)
    .set({
      lastVerifiedAt: Date.now(),
    })
    .where(eq(curatedAlternatives.id, id))
    .run();

  revalidatePath("/admin/alternatives");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAlternativeAction(id: string) {
  await requireAdmin();

  db.delete(curatedAlternatives).where(eq(curatedAlternatives.id, id)).run();

  revalidatePath("/admin/alternatives");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}
