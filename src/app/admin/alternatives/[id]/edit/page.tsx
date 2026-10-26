import { notFound } from "next/navigation";
import { db } from "@/db";
import { curatedAlternatives, reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import AlternativeForm from "../../alternative-form";

export const dynamic = "force-dynamic";

export default async function EditAlternativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alt = db.select().from(curatedAlternatives).where(eq(curatedAlternatives.id, id)).get();

  if (!alt) notFound();

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
          Modifica Alternativa Consigliata
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          ID: {alt.id} &bull; Ultima verifica: {new Date(alt.lastVerifiedAt).toLocaleDateString("it-IT")}
        </p>
      </div>

      <AlternativeForm
        availableReviews={availableReviews}
        availablePcs={availablePcs}
        initialData={alt}
        isEditing={true}
      />
    </div>
  );
}
