import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import SourceForm from "../source-form";

export const dynamic = "force-dynamic";

export default async function NewSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ reviewId?: string }>;
}) {
  const params = await searchParams;
  const database = await getDb();

  const availableReviews = await database
    .select({
      id: reviews.id,
      title: reviews.title,
    })
    .from(reviews);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Aggiungi Fonte Consultata
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Collega un benchmark, un datasheet o una pagina commerciale alla recensione, indicando quali dati supporta.
        </p>
      </div>

      <SourceForm availableReviews={availableReviews} defaultReviewId={params.reviewId} />
    </div>
  );
}
