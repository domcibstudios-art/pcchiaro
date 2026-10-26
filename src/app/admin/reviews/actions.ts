"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { reviewSchema, validateForPublication } from "@/lib/validations";
import crypto from "crypto";

export async function saveReviewAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const id = (formData.get("id") as string) || crypto.randomUUID();
  const isEditing = Boolean(formData.get("isEditing"));

  // Estrazione liste stringhe da textarea
  const strengthsRaw = (formData.get("strengths") as string) || "";
  const weaknessesRaw = (formData.get("weaknesses") as string) || "";

  const strengths = strengthsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const weaknesses = weaknessesRaw
    .split("\n")
    .map((w) => w.trim())
    .filter(Boolean);

  const rawData = {
    id,
    pcId: (formData.get("pcId") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    title: (formData.get("title") as string)?.trim(),
    metaTitle: (formData.get("metaTitle") as string)?.trim() || null,
    metaDescription: (formData.get("metaDescription") as string)?.trim() || null,
    verdict: formData.get("verdict") as any,
    summaryIntro: (formData.get("summaryIntro") as string)?.trim(),
    whyPositiveReviews: (formData.get("whyPositiveReviews") as string)?.trim() || null,
    strengths,
    weaknesses,
    evidenceLevel: formData.get("evidenceLevel") as any,
    ratingGaming: formData.get("ratingGaming") as any,
    notesGaming: (formData.get("notesGaming") as string)?.trim() || null,
    ratingWork: formData.get("ratingWork") as any,
    notesWork: (formData.get("notesWork") as string)?.trim() || null,
    ratingOffice: formData.get("ratingOffice") as any,
    notesOffice: (formData.get("notesOffice") as string)?.trim() || null,
    amazonListingPriceEur: formData.get("amazonListingPriceEur")
      ? parseFloat(formData.get("amazonListingPriceEur") as string)
      : null,
    estimatedFairValueEur: formData.get("estimatedFairValueEur")
      ? parseFloat(formData.get("estimatedFairValueEur") as string)
      : null,
    status: (formData.get("status") as any) || "draft",
  };

  // Validazione Zod Schema Base
  const validation = reviewSchema.safeParse(rawData);
  if (!validation.success) {
    const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
    return { error: `Errore di validazione: ${errorMsg}` };
  }

  const validReview = validation.data;

  // Controllo vincolo di pubblicazione
  if (validReview.status === "published") {
    const pubCheck = validateForPublication(validReview);
    if (!pubCheck.isValid) {
      return {
        error: `Impossibile pubblicare: requisiti mancanti (${pubCheck.errors.join("; ")})`,
      };
    }
  }

  const now = Date.now();

  try {
    if (isEditing) {
      db.update(reviews)
        .set({
          pcId: validReview.pcId,
          slug: validReview.slug,
          title: validReview.title,
          metaTitle: validReview.metaTitle || null,
          metaDescription: validReview.metaDescription || null,
          verdict: validReview.verdict,
          summaryIntro: validReview.summaryIntro,
          whyPositiveReviews: validReview.whyPositiveReviews || null,
          strengths: JSON.stringify(validReview.strengths),
          weaknesses: JSON.stringify(validReview.weaknesses),
          evidenceLevel: validReview.evidenceLevel,
          ratingGaming: validReview.ratingGaming,
          notesGaming: validReview.notesGaming || null,
          ratingWork: validReview.ratingWork,
          notesWork: validReview.notesWork || null,
          ratingOffice: validReview.ratingOffice,
          notesOffice: validReview.notesOffice || null,
          amazonListingPriceEur: validReview.amazonListingPriceEur || null,
          estimatedFairValueEur: validReview.estimatedFairValueEur || null,
          status: validReview.status,
          publishedAt: validReview.status === "published" ? now : null,
          updatedAt: now,
        })
        .where(eq(reviews.id, id))
        .run();
    } else {
      db.insert(reviews)
        .values({
          id,
          pcId: validReview.pcId,
          slug: validReview.slug,
          title: validReview.title,
          metaTitle: validReview.metaTitle || null,
          metaDescription: validReview.metaDescription || null,
          verdict: validReview.verdict,
          summaryIntro: validReview.summaryIntro,
          whyPositiveReviews: validReview.whyPositiveReviews || null,
          strengths: JSON.stringify(validReview.strengths),
          weaknesses: JSON.stringify(validReview.weaknesses),
          evidenceLevel: validReview.evidenceLevel,
          ratingGaming: validReview.ratingGaming,
          notesGaming: validReview.notesGaming || null,
          ratingWork: validReview.ratingWork,
          notesWork: validReview.notesWork || null,
          ratingOffice: validReview.ratingOffice,
          notesOffice: validReview.notesOffice || null,
          amazonListingPriceEur: validReview.amazonListingPriceEur || null,
          estimatedFairValueEur: validReview.estimatedFairValueEur || null,
          status: validReview.status,
          publishedAt: validReview.status === "published" ? now : null,
          updatedAt: now,
        })
        .run();
    }
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed: reviews.slug")) {
      return { error: "Lo slug inserito è già utilizzato da un'altra recensione. Scegli uno slug univoco." };
    }
    return { error: `Errore durante il salvataggio: ${error.message}` };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/reviews");
}

export async function publishReviewAction(id: string) {
  await requireAdmin();

  const review = db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!review) throw new Error("Recensione non trovata.");

  let strengthsArr = [];
  let weaknessesArr = [];
  try {
    strengthsArr = JSON.parse(review.strengths);
    weaknessesArr = JSON.parse(review.weaknesses);
  } catch {}

  const pubCheck = validateForPublication({
    ...review,
    strengths: strengthsArr,
    weaknesses: weaknessesArr,
    verdict: review.verdict as any,
    evidenceLevel: review.evidenceLevel as any,
    ratingGaming: review.ratingGaming as any,
    ratingWork: review.ratingWork as any,
    ratingOffice: review.ratingOffice as any,
    status: "published",
  });

  if (!pubCheck.isValid) {
    throw new Error(`Impossibile pubblicare: ${pubCheck.errors.join(", ")}`);
  }

  const now = Date.now();
  db.update(reviews)
    .set({
      status: "published",
      publishedAt: review.publishedAt || now,
      updatedAt: now,
    })
    .where(eq(reviews.id, id))
    .run();

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function unpublishReviewAction(id: string) {
  await requireAdmin();
  db.update(reviews)
    .set({
      status: "draft",
      updatedAt: Date.now(),
    })
    .where(eq(reviews.id, id))
    .run();

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteReviewAction(id: string) {
  await requireAdmin();
  db.delete(reviews).where(eq(reviews.id, id)).run();
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}
