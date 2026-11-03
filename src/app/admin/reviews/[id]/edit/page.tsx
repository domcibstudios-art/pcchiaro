import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import ReviewForm from "../../review-form";

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const database = await getDb();
  const rows = await database.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  const review = rows && rows.length > 0 ? rows[0] : null;

  if (!review) {
    notFound();
  }

  const availablePcs = await database
    .select({
      id: pcs.id,
      modelName: pcs.modelName,
      brand: pcs.brand,
    })
    .from(pcs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Modifica Recensione: {review.title}
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          ID: {review.id} &bull; Slug: /{review.slug} &bull; Aggiornato:{" "}
          {new Date(review.updatedAt).toLocaleDateString("it-IT")}
        </p>
      </div>

      <ReviewForm
        availablePcs={availablePcs}
        initialData={review}
        isEditing={true}
      />
    </div>
  );
}
