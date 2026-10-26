import Link from "next/link";
import { db } from "@/db";
import { reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publishReviewAction, unpublishReviewAction, deleteReviewAction } from "./actions";
import { SITE_CONFIG } from "@/config/site";
import DeleteButton from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const reviewList = db
    .select({
      review: reviews,
      pc: pcs,
    })
    .from(reviews)
    .innerJoin(pcs, eq(reviews.pcId, pcs.id))
    .all();

  const filtered = reviewList.filter(({ review }) => {
    if (params.filter === "stale") {
      return review.status === "published" && review.updatedAt < thirtyDaysAgo;
    }
    if (params.status && review.status !== params.status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-slate-900">
            Recensioni Editoriali ({reviewList.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestisci verdetti, semafori d'uso, sintesi e autorizzazioni alla pubblicazione.
          </p>
        </div>

        <Link
          href="/admin/reviews/new"
          className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Scrivi Nuova Recensione
        </Link>
      </div>

      {/* Filtri */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/reviews"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !params.status && !params.filter
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Tutte ({reviewList.length})
        </Link>
        <Link
          href="/admin/reviews?status=published"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "published"
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Pubblicate ({reviewList.filter((r) => r.review.status === "published").length})
        </Link>
        <Link
          href="/admin/reviews?status=draft"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "draft"
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Bozze ({reviewList.filter((r) => r.review.status === "draft").length})
        </Link>
        <Link
          href="/admin/reviews?filter=stale"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.filter === "stale"
              ? "bg-brand text-white"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          Da Aggiornare (&gt;30 gg) ({reviewList.filter((r) => r.review.status === "published" && r.review.updatedAt < thirtyDaysAgo).length})
        </Link>
      </div>

      {/* Tabella Recensioni */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nessuna recensione corrisponde ai filtri selezionati.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Titolo & PC</th>
                  <th className="px-4 py-3">Verdetto</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Aggiornamento</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(({ review, pc }) => {
                  const verdictInfo = (SITE_CONFIG.verdicts as any)[review.verdict];
                  const isStale = review.status === "published" && review.updatedAt < thirtyDaysAgo;

                  return (
                    <tr key={review.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{review.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          PC: {pc.brand} {pc.modelName} &bull; Slug: <code>/{review.slug}</code>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${
                            verdictInfo?.badgeClass || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs" aria-hidden="true">
                            {verdictInfo?.icon || "info"}
                          </span>
                          {verdictInfo?.label || review.verdict}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                            review.status === "published"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : review.status === "draft"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>{new Date(review.updatedAt).toLocaleDateString("it-IT")}</div>
                        {isStale && (
                          <span className="text-amber-700 text-[10px] font-semibold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">warning</span>
                            Verifica datata
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Anteprima */}
                          <Link
                            href={`/admin/reviews/${review.id}/preview`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-slate-100 transition-colors"
                            title="Anteprima scheda"
                          >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                              visibility
                            </span>
                          </Link>

                          {/* Modifica */}
                          <Link
                            href={`/admin/reviews/${review.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-slate-100 transition-colors"
                            title="Modifica recensione"
                          >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                              edit
                            </span>
                          </Link>

                          {/* Pubblica / Ritira */}
                          {review.status === "published" ? (
                            <form action={unpublishReviewAction.bind(null, review.id)}>
                              <button
                                type="submit"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Riporta a bozza (Ritira)"
                              >
                                <span className="material-symbols-outlined text-base" aria-hidden="true">
                                  unpublished
                                </span>
                              </button>
                            </form>
                          ) : (
                            <form action={publishReviewAction.bind(null, review.id)}>
                              <button
                                type="submit"
                                className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                                title="Pubblica online"
                              >
                                <span className="material-symbols-outlined text-base" aria-hidden="true">
                                  publish
                                </span>
                              </button>
                            </form>
                          )}

                          {/* Elimina */}
                          <form action={deleteReviewAction.bind(null, review.id)}>
                            <DeleteButton
                              title="Elimina recensione"
                              confirmMessage="Vuoi davvero eliminare questa recensione?"
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
