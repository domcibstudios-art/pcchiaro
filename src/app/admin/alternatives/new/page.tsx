import { db } from "@/db";
import { reviews, pcs } from "@/db/schema";
import AlternativeForm from "../alternative-form";

export const dynamic = "force-dynamic";

export default async function NewAlternativePage({
  searchParams,
}: {
  searchParams: Promise<{ reviewId?: string }>;
}) {
  const params = await searchParams;

  const availableReviews = db
    .select({
      id: reviews.id,
      title: reviews.title,
      pcId: reviews.pcId,
    })
    .from(reviews)
    .all();

  const availablePcs = db
    .select({
      id: pcs.id,
      brand: pcs.brand,
      modelName: pcs.modelName,
      editorialStatus: pcs.editorialStatus,
    })
    .from(pcs)
    .all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Collega Alternativa Consigliata
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Collega una recensione a un PC del catalogo, specificando motivazione editoriale e ordine di visualizzazione.
        </p>
      </div>

      <AlternativeForm
        availableReviews={availableReviews}
        availablePcs={availablePcs}
        defaultReviewId={params.reviewId}
      />
    </div>
  );
}
