import Link from "next/link";
import { db } from "@/db";
import { pcs, reviews, curatedAlternatives } from "@/db/schema";
import { eq } from "drizzle-orm";
import { archivePcAction, deletePcAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPcsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const params = await searchParams;
  const allPcs = db.select().from(pcs).all();
  const allReviews = db.select().from(reviews).all();

  // Filtraggio opzionale
  const filteredPcs = allPcs.filter((pc) => {
    if (params.category && pc.category !== params.category) return false;
    if (params.status && pc.editorialStatus !== params.status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Pagina */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-slate-900">
            Catalogo Prodotti PC ({allPcs.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestione delle schede hardware analizzate, delle specifiche e dei componenti non dichiarati.
          </p>
        </div>

        <Link
          href="/admin/pcs/new"
          className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Aggiungi Nuovo PC
        </Link>
      </div>

      {/* Barra Filtri */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/pcs"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !params.status && !params.category
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Tutti ({allPcs.length})
        </Link>
        <Link
          href="/admin/pcs?status=published"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "published"
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Pubblicati ({allPcs.filter((p) => p.editorialStatus === "published").length})
        </Link>
        <Link
          href="/admin/pcs?status=draft"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "draft"
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Bozze ({allPcs.filter((p) => p.editorialStatus === "draft").length})
        </Link>
        <Link
          href="/admin/pcs?status=archived"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "archived"
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Archiviati ({allPcs.filter((p) => p.editorialStatus === "archived").length})
        </Link>
      </div>

      {/* Tabella / Lista PC */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredPcs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nessun PC trovato con i filtri selezionati.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Modello & Brand</th>
                  <th className="px-4 py-3">Specifiche Chiave</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Recensione Associata</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPcs.map((pc) => {
                  const associatedReview = allReviews.find((r) => r.pcId === pc.id);
                  let unverifiedCount = 0;
                  try {
                    const arr = JSON.parse(pc.unverifiedSpecs || "[]");
                    if (Array.isArray(arr)) unverifiedCount = arr.length;
                  } catch {}

                  return (
                    <tr key={pc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{pc.modelName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {pc.brand} &bull; {pc.category.replace("_", " ")}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 space-y-0.5">
                        <div>
                          <strong className="text-slate-900">CPU:</strong> {pc.cpuModel}
                        </div>
                        <div>
                          <strong className="text-slate-900">GPU:</strong> {pc.gpuModel} (
                          {pc.gpuType})
                        </div>
                        <div>
                          <strong className="text-slate-900">RAM:</strong> {pc.ramGb}GB {pc.ramType}{" "}
                          ({pc.ramChannel})
                        </div>
                        {unverifiedCount > 0 && (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                            ⚠️ {unverifiedCount} dati non dichiarati
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                            pc.editorialStatus === "published"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : pc.editorialStatus === "draft"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {pc.editorialStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {associatedReview ? (
                          <Link
                            href={`/admin/reviews/${associatedReview.id}/edit`}
                            className="text-brand font-medium hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">
                              article
                            </span>
                            <span>{associatedReview.title.slice(0, 30)}...</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/reviews/new?pcId=${pc.id}`}
                            className="text-slate-400 hover:text-brand flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">
                              add_circle
                            </span>
                            <span>Crea recensione</span>
                          </Link>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/pcs/${pc.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-slate-100 transition-colors"
                            title="Modifica scheda PC"
                          >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                              edit
                            </span>
                          </Link>

                          {pc.editorialStatus !== "archived" && (
                            <form action={archivePcAction.bind(null, pc.id)}>
                              <button
                                type="submit"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Archivia PC"
                              >
                                <span className="material-symbols-outlined text-base" aria-hidden="true">
                                  archive
                                </span>
                              </button>
                            </form>
                          )}

                          <form action={deletePcAction.bind(null, pc.id)}>
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Elimina PC (se non referenziato)"
                              onClick={(e) => {
                                if (!confirm("Sei sicuro di voler eliminare questo PC?")) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <span className="material-symbols-outlined text-base" aria-hidden="true">
                                delete
                              </span>
                            </button>
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
