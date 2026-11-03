"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { sources, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { sourceSchema } from "@/lib/validations";
import crypto from "crypto";

export async function saveSourceAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();
  const database = await getDb();

  const id = (formData.get("id") as string) || crypto.randomUUID();
  const isEditing = Boolean(formData.get("isEditing"));

  const reviewId = (formData.get("reviewId") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const sourceName = (formData.get("sourceName") as string)?.trim();
  const sourceType = (formData.get("sourceType") as any) || "benchmark_indipendente";
  const notes = (formData.get("notes") as string)?.trim();

  // 1. Verifica che la recensione esista
  const targetReviewRows = await database.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!targetReviewRows || targetReviewRows.length === 0) {
    return { error: "Recensione associata non trovata." };
  }

  // 2. Validazione Zod
  const validation = sourceSchema.safeParse({
    id,
    reviewId,
    url,
    sourceName,
    sourceType,
    notes,
  });

  if (!validation.success) {
    const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
    return { error: `Errore nei dati della fonte: ${errorMsg}` };
  }

  const validData = validation.data;
  const now = Date.now();

  try {
    if (isEditing) {
      await database
        .update(sources)
        .set({
          reviewId: validData.reviewId,
          url: validData.url,
          sourceName: validData.sourceName,
          sourceType: validData.sourceType,
          notes: validData.notes,
          consultedAt: now,
        })
        .where(eq(sources.id, id));
    } else {
      await database
        .insert(sources)
        .values({
          id,
          reviewId: validData.reviewId,
          url: validData.url,
          sourceName: validData.sourceName,
          sourceType: validData.sourceType,
          notes: validData.notes,
          consultedAt: now,
        });
    }
  } catch (error: any) {
    return { error: `Errore durante il salvataggio: ${error.message}` };
  }

  revalidatePath("/admin/sources");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/sources");
}

export async function deleteSourceAction(id: string) {
  await requireAdmin();
  const database = await getDb();

  await database.delete(sources).where(eq(sources.id, id));

  revalidatePath("/admin/sources");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/");
}
