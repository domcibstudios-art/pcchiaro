import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { sources, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import SourceForm from "../../source-form";

export const dynamic = "force-dynamic";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const database = await getDb();
  const rows = await database.select().from(sources).where(eq(sources.id, id)).limit(1);
  const source = rows && rows.length > 0 ? rows[0] : null;

  if (!source) notFound();

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
          Modifica Fonte
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          ID: {source.id} &bull; Consultata: {new Date(source.consultedAt).toLocaleDateString("it-IT")}
        </p>
      </div>

      <SourceForm availableReviews={availableReviews} initialData={source} isEditing={true} />
    </div>
  );
}
