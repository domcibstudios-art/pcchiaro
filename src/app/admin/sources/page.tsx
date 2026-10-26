import Link from "next/link";
import { db } from "@/db";
import { sources, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteSourceAction } from "./actions";
import DeleteButton from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ reviewId?: string; type?: string }>;
}) {
  const params = await searchParams;

  const allSources = db
    .select({
      source: sources,
      review: reviews,
    })
    .from(sources)
    .innerJoin(reviews, eq(sources.reviewId, reviews.id))
    .all();

  const filtered = allSources.filter(({ source }) => {
    if (params.reviewId && source.reviewId !== params.reviewId) return false;
    if (params.type && source.sourceType !== params.type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-slate-900">
            Fonti e Basi Informative ({allSources.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Associa prove tecniche, datasheet del produttore e benchmark pubblici a ogni recensione pubblicata.
          </p>
        </div>

        <Link
          href="/admin/sources/new"
          className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Aggiungi Nuova Fonte
        </Link>
      </div>

      {/* Tabella Fonti */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nessuna fonte registrata con i filtri correnti.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Fonte & Tipologia</th>
                  <th className="px-4 py-3">Recensione Supportata</th>
                  <th className="px-4 py-3">Dati Supportati (Note)</th>
                  <th className="px-4 py-3">Data Consultazione</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(({ source, review }) => (
                  <tr key={source.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 space-y-1">
                      <div className="font-bold text-slate-900 text-sm">{source.sourceName}</div>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {source.sourceType.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline text-[11px] font-mono inline-flex items-center gap-0.5 truncate max-w-xs"
                        >
                          <span className="truncate">{source.url}</span>
                          <span className="material-symbols-outlined text-xs shrink-0" aria-hidden="true">
                            open_in_new
                          </span>
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 space-y-1">
                      <div className="font-semibold text-slate-900">
                        <Link href={`/admin/reviews/${review.id}/edit`} className="hover:underline">
                          {review.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Slug: /{review.slug}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                        {source.notes}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      {new Date(source.consultedAt).toLocaleDateString("it-IT")}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/sources/${source.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-slate-100 transition-colors"
                          title="Modifica fonte"
                        >
                          <span className="material-symbols-outlined text-base" aria-hidden="true">
                            edit
                          </span>
                        </Link>

                        <form action={deleteSourceAction.bind(null, source.id)}>
                          <DeleteButton
                            title="Elimina fonte"
                            confirmMessage="Vuoi davvero eliminare questa fonte?"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
