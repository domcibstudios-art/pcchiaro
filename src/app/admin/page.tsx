import Link from "next/link";
import { getDb } from "@/db";
import { pcs, reviews, priceOffers, curatedAlternatives } from "@/db/schema";
import { eq, count, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const database = await getDb();
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // 1. Statistiche PC
  const allPcs = await database.select().from(pcs);
  const totalPcsCount = allPcs.length;
  const publishedPcsCount = allPcs.filter((p: any) => p.editorialStatus === "published").length;
  const draftPcsCount = allPcs.filter((p: any) => p.editorialStatus === "draft").length;
  const archivedPcsCount = allPcs.filter((p: any) => p.editorialStatus === "archived").length;

  // 2. Statistiche Recensioni
  const allReviews = await database.select().from(reviews);
  const totalReviewsCount = allReviews.length;
  const publishedReviewsCount = allReviews.filter((r: any) => r.status === "published").length;
  const draftReviewsCount = allReviews.filter((r: any) => r.status === "draft").length;

  // 3. Contenuti da aggiornare (aggiornati da più di 30 giorni)
  const staleReviews = allReviews.filter(
    (r: any) => r.status === "published" && r.updatedAt < thirtyDaysAgo
  );

  // 4. Offerte da verificare (verificate più di 30 giorni fa o invalide)
  const allOffers = await database.select().from(priceOffers);
  const staleOffers = allOffers.filter(
    (o: any) => o.isValid === 0 || o.lastVerifiedAt < thirtyDaysAgo
  );

  // 5. Alternative in attesa di approvazione
  const allAlternatives = await database.select().from(curatedAlternatives);
  const pendingAlternatives = allAlternatives.filter((a: any) => a.isApproved === 0);

  return (
    <div className="space-y-8">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-slate-900">
            Pannello di Controllo Redazionale
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci in modo indipendente il catalogo hardware, le schede di recensione e le verifiche prezzi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/import"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">auto_fix_high</span>
            Importa da Amazon
          </Link>
          <Link
            href="/admin/pcs/new"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
            Nuovo PC
          </Link>
          <Link
            href="/admin/reviews/new"
            className="px-3.5 py-2 rounded-xl bg-brand text-white hover:bg-brand-hover text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">rate_review</span>
            Nuova Recensione
          </Link>
        </div>
      </div>

      {/* Grid delle Metriche Principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card PC */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalogo Hardware</span>
            <span className="material-symbols-outlined text-xl text-slate-400" aria-hidden="true">devices</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-headline">{totalPcsCount}</div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span className="text-emerald-700 font-medium">{publishedPcsCount} pubblicati</span>
              <span>&bull;</span>
              <span className="text-amber-700 font-medium">{draftPcsCount} bozze</span>
              {archivedPcsCount > 0 && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-400">{archivedPcsCount} archiviati</span>
                </>
              )}
            </div>
          </div>
          <Link
            href="/admin/pcs"
            className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1 pt-1"
          >
            Gestisci catalogo PC &rarr;
          </Link>
        </div>

        {/* Card Recensioni */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Recensioni Editoriali</span>
            <span className="material-symbols-outlined text-xl text-slate-400" aria-hidden="true">verified</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-headline">{totalReviewsCount}</div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span className="text-emerald-700 font-medium">{publishedReviewsCount} online</span>
              <span>&bull;</span>
              <span className="text-amber-700 font-medium">{draftReviewsCount} bozze</span>
            </div>
          </div>
          <Link
            href="/admin/reviews"
            className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1 pt-1"
          >
            Gestisci recensioni &rarr;
          </Link>
        </div>

        {/* Card Contenuti da Revisionare */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Schede da Rivedere</span>
            <span className="material-symbols-outlined text-xl text-amber-500" aria-hidden="true">update</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-headline">{staleReviews.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              {staleReviews.length === 0 ? "Tutte aggiornate negli ultimi 30 gg" : "Recensioni con verifiche datate"}
            </div>
          </div>
          <Link
            href="/admin/reviews?filter=stale"
            className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1 pt-1"
          >
            Filtra schede datate &rarr;
          </Link>
        </div>

        {/* Card Offerte e Link da Verificare */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Offerte da Verificare</span>
            <span className="material-symbols-outlined text-xl text-red-500" aria-hidden="true">price_check</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-headline">{staleOffers.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              {staleOffers.length === 0 ? "Prezzi monitorati regolarmente" : "Prezzi non controllati da >30 gg"}
            </div>
          </div>
          <span className="text-xs text-slate-400 block pt-1">
            Modulo Prezzi & Offerte
          </span>
        </div>

      </div>

      {/* Sezione Avvisi e Notifiche Redazionali */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box Ultime Recensioni */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-headline font-bold text-base text-slate-900">
              Ultime Recensioni Modificate
            </h2>
            <Link href="/admin/reviews" className="text-xs text-brand font-semibold hover:underline">
              Tutte ({totalReviewsCount})
            </Link>
          </div>

          <div className="space-y-3">
            {allReviews.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="font-semibold text-xs text-slate-900 truncate">{r.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Stato: <span className="uppercase font-semibold">{r.status}</span> &bull; Verdetto:{" "}
                    <span className="uppercase font-semibold">{r.verdict.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/reviews/${r.id}/preview`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-200 transition-colors"
                    title="Anteprima scheda"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">visibility</span>
                  </Link>
                  <Link
                    href={`/admin/reviews/${r.id}/edit`}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Modifica
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box Avvisi di Qualità e Alternative */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-headline font-bold text-base text-slate-900">
              Integrità Editoriale & Alternative
            </h2>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              100% Curato Manualmente
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base" aria-hidden="true">handshake</span>
                Alternative in attesa di approvazione: {pendingAlternatives.length}
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Le regole del progetto vietano di mostrare agli utenti collegamenti non verificati. Tutte le alternative devono essere approvate esplicitamente dalla redazione.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                <span className="material-symbols-outlined text-base text-brand" aria-hidden="true">security</span>
                Vincolo di Pubblicazione Rigoroso
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Il sistema blocca in automatico la pubblicazione di una recensione se il titolo è incompleto, se mancano i punti di forza/limiti, o se i componenti essenziali non sono identificati.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
