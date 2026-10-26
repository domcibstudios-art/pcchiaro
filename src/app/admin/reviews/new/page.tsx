import { db } from "@/db";
import { pcs } from "@/db/schema";
import ReviewForm from "../review-form";

export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ pcId?: string }>;
}) {
  const params = await searchParams;
  const availablePcs = db
    .select({
      id: pcs.id,
      modelName: pcs.modelName,
      brand: pcs.brand,
    })
    .from(pcs)
    .all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Nuova Recensione Editoriale
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compila i giudizi sui 3 ambiti d'uso, i punti di forza e debolezza, e il verdetto finale.
        </p>
      </div>

      <ReviewForm availablePcs={availablePcs} defaultPcId={params.pcId} />
    </div>
  );
}
