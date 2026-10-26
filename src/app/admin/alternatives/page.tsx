import Link from "next/link";
import { db } from "@/db";
import { curatedAlternatives, reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toggleApprovalAction, verifyAlternativeAction, deleteAlternativeAction } from "./actions";
import DeleteButton from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminAlternativesPage({
  searchParams,
}: {
  searchParams: Promise<{ reviewId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const allAlternatives = db
    .select({
      alt: curatedAlternatives,
      review: reviews,
      targetPc: pcs,
    })
    .from(curatedAlternatives)
    .innerJoin(reviews, eq(curatedAlternatives.sourceReviewId, reviews.id))
    .innerJoin(pcs, eq(curatedAlternatives.targetPcId, pcs.id))
    .all();

  const filtered = allAlternatives.filter(({ alt }) => {
    if (params.reviewId && alt.sourceReviewId !== params.reviewId) return false;
    if (params.status === "approved" && alt.isApproved !== 1) return false;
    if (params.status === "pending" && alt.isApproved !== 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-slate-900">
            Alternative Curate Manualmente ({allAlternatives.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ogni alternativa consigliata è scelta, verificata ed approvata personalmente dalla redazione.
          </p>
        </div>

        <Link
          href="/admin/alternatives/new"
          className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Collega Nuova Alternativa
        </Link>
      </div>

      {/* Filtri */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/alternatives"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !params.status ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Tutte ({allAlternatives.length})
        </Link>
        <Link
          href="/admin/alternatives?status=approved"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "approved"
              ? "bg-brand text-white"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          Approvate ({allAlternatives.filter((a) => a.alt.isApproved === 1).length})
        </Link>
        <Link
          href="/admin/alternatives?status=pending"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "pending"
              ? "bg-brand text-white"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          In Attesa di Approvazione ({allAlternatives.filter((a) => a.alt.isApproved === 0).length})
        </Link>
      </div>

      {/* Tabella Alternative */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nessuna alternativa trovata con i filtri selezionati.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Recensione Origine &rarr; PC Alternativo</th>
                  <th className="px-4 py-3">Uso Consigliato & Motivazione</th>
                  <th className="px-4 py-3">Approvazione</th>
                  <th className="px-4 py-3">Ultima Verifica</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(({ alt, review, targetPc }) => {
                  const isStale = alt.lastVerifiedAt < thirtyDaysAgo;
                  const isArchived = targetPc.editorialStatus === "archived";

                  return (
                    <tr key={alt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="text-slate-600 font-medium">
                          Da: <Link href={`/admin/reviews/${review.id}/edit`} className="text-brand hover:underline font-semibold">{review.title}</Link>
                        </div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span className="text-emerald-600 font-mono">&rarr;</span>
                          <Link href={`/admin/pcs/${targetPc.id}/edit`} className="hover:underline">
                            {targetPc.brand} {targetPc.modelName}
                          </Link>
                          {isArchived && (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-mono font-bold">
                              ARCHIVIATO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Ordine: #{alt.displayOrder} {alt.priceDifferenceEur ? `• Diff: ${alt.priceDifferenceEur > 0 ? "+" : ""}${alt.priceDifferenceEur}€` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-1 max-w-xs">
                        <div className="font-semibold text-slate-900">{alt.intendedUse}</div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {alt.editorialReasoning}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        {alt.isApproved === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-mono">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">check_circle</span>
                            APPROVATA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold font-mono">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">hourglass_top</span>
                            IN ATTESA
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>{new Date(alt.lastVerifiedAt).toLocaleDateString("it-IT")}</div>
                        {isStale && (
                          <span className="text-amber-700 text-[10px] font-semibold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">warning</span>
                            Verifica &gt;30 gg
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Approvazione */}
                          <form action={toggleApprovalAction.bind(null, alt.id)}>
                            <button
                              type="submit"
                              className={`p-1.5 rounded-lg transition-colors ${
                                alt.isApproved === 1
                                  ? "text-emerald-700 hover:bg-emerald-50"
                                  : "text-amber-700 hover:bg-amber-50"
                              }`}
                              title={alt.isApproved === 1 ? "Revoca approvazione" : "Approva alternativa"}
                            >
                              <span className="material-symbols-outlined text-base" aria-hidden="true">
                                {alt.isApproved === 1 ? "task_alt" : "radio_button_unchecked"}
                              </span>
                            </button>
                          </form>

                          {/* Segna Verificato Oggi */}
                          <form action={verifyAlternativeAction.bind(null, alt.id)}>
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-100 transition-colors"
                              title="Aggiorna data di verifica a oggi"
                            >
                              <span className="material-symbols-outlined text-base" aria-hidden="true">
                                event_available
                              </span>
                            </button>
                          </form>

                          {/* Modifica */}
                          <Link
                            href={`/admin/alternatives/${alt.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-slate-100 transition-colors"
                            title="Modifica alternativa"
                          >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                              edit
                            </span>
                          </Link>

                          {/* Elimina */}
                          <form action={deleteAlternativeAction.bind(null, alt.id)}>
                            <DeleteButton
                              title="Elimina collegamento alternativa"
                              confirmMessage="Vuoi davvero eliminare questa alternativa consigliata?"
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
