import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { reviews, pcs, curatedAlternatives, sources, priceOffers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { publishReviewAction, unpublishReviewAction } from "../../actions";
import { SITE_CONFIG } from "@/config/site";
import { getShowExactPrices } from "@/lib/settings";
import { buildAffiliateUrl } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export default async function ReviewPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const showExactPrices = getShowExactPrices();
  const review = db.select().from(reviews).where(eq(reviews.id, id)).get();

  if (!review) notFound();

  const pc = db.select().from(pcs).where(eq(pcs.id, review.pcId)).get();
  if (!pc) notFound();

  // 1. Alternative curate collegate
  const alternatives = db
    .select({
      alt: curatedAlternatives,
      targetPc: pcs,
    })
    .from(curatedAlternatives)
    .innerJoin(pcs, eq(curatedAlternatives.targetPcId, pcs.id))
    .where(eq(curatedAlternatives.sourceReviewId, id))
    .orderBy(asc(curatedAlternatives.displayOrder))
    .all();

  // 2. Fonti consultate
  const reviewSources = db
    .select()
    .from(sources)
    .where(eq(sources.reviewId, id))
    .all();

  // 3. Offerte commerciali registrate per questo PC
  const offers = db
    .select()
    .from(priceOffers)
    .where(eq(priceOffers.pcId, pc.id))
    .all();

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  let strengths: string[] = [];
  let weaknesses: string[] = [];
  try {
    strengths = JSON.parse(review.strengths);
    weaknesses = JSON.parse(review.weaknesses);
  } catch {}

  const verdictInfo = (SITE_CONFIG.verdicts as any)[review.verdict];
  const evidenceInfo = (SITE_CONFIG.evidenceLevels as any)[review.evidenceLevel];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner di Anteprima Redazionale */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-2xl" aria-hidden="true">
            visibility
          </span>
          <div>
            <div className="font-headline font-bold text-sm">
              Modalità Anteprima Editoriale
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Stato attuale: <strong className="uppercase text-white">{review.status}</strong> &bull; Slug: /{review.slug}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/reviews/${review.id}/edit`}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Modifica
          </Link>

          {review.status === "published" ? (
            <form action={unpublishReviewAction.bind(null, review.id)}>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                Riporta a Bozza
              </button>
            </form>
          ) : (
            <form action={publishReviewAction.bind(null, review.id)}>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Approva & Pubblica
              </button>
            </form>
          )}

          <Link
            href="/admin/reviews"
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Chiudi
          </Link>
        </div>
      </div>

      {/* SCHEDA RECENSIONE */}
      <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Intestazione e Verdetto */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono border ${
              verdictInfo?.badgeClass || "bg-slate-100 text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {verdictInfo?.icon || "info"}
            </span>
            VERDETTO: {verdictInfo?.label || review.verdict}
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Base informativa: <strong>{evidenceInfo?.label || review.evidenceLevel}</strong>
          </div>
        </div>

        <div>
          <h2 className="font-headline font-extrabold text-2xl sm:text-3xl text-slate-900 leading-snug">
            {review.title}
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {review.summaryIntro}
          </p>
        </div>

        {/* Perché tante recensioni positive */}
        {review.whyPositiveReviews && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-brand" aria-hidden="true">help_outline</span>
              Perché questo PC ha tante recensioni positive su Amazon?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {review.whyPositiveReviews}
            </p>
          </div>
        )}

        {/* Scheda Hardware */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Scheda Tecnica Rilevata:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">CPU</span>
              <span className="font-semibold text-slate-900">{pc.cpuModel}</span>
              {pc.cpuGen && <span className="block text-[10px] text-slate-500">{pc.cpuGen}</span>}
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">GPU</span>
              <span className="font-semibold text-slate-900">{pc.gpuModel}</span>
              {pc.gpuVramGb && <span className="block text-[10px] text-slate-500">{pc.gpuVramGb}GB VRAM</span>}
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RAM</span>
              <span className="font-semibold text-slate-900">
                {pc.ramGb}GB {pc.ramType} ({pc.ramChannel})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">STORAGE</span>
              <span className="font-semibold text-slate-900">
                {pc.storageType} {pc.storageCapacityGb}GB
              </span>
            </div>
          </div>
        </div>

        {/* SEMAFORO STANDARD */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Idoneità d'Uso Standard PCChiaro:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border bg-slate-50/70 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🎮</span> Gaming
                </span>
                <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border bg-white">
                  {review.ratingGaming}
                </span>
              </div>
              <p className="text-xs text-slate-600">{review.notesGaming || "Nessuna nota specifica"}</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50/70 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>💼</span> Lavoro & CAD
                </span>
                <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border bg-white">
                  {review.ratingWork}
                </span>
              </div>
              <p className="text-xs text-slate-600">{review.notesWork || "Nessuna nota specifica"}</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50/70 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🎓</span> Studio & Web
                </span>
                <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border bg-white">
                  {review.ratingOffice}
                </span>
              </div>
              <p className="text-xs text-slate-600">{review.notesOffice || "Nessuna nota specifica"}</p>
            </div>
          </div>
        </div>

        {/* Punti di Forza e Limiti */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-base" aria-hidden="true">check_circle</span>
              Punti di Forza
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              {strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-red-50/40 border border-red-200 space-y-2">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-base" aria-hidden="true">cancel</span>
              Limiti e Compromessi
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              {weaknesses.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Prezzo Inserzione vs Valore Congruo */}
        {(review.amazonListingPriceEur || review.estimatedFairValueEur) && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">PREZZO INSERZIONE AMAZON</span>
              {showExactPrices ? (
                <span className="text-red-700 font-bold text-sm">
                  {review.amazonListingPriceEur ? `~${review.amazonListingPriceEur.toFixed(0)} €` : "N/D"}
                </span>
              ) : (
                <span className="text-slate-800 font-semibold text-xs flex items-center gap-1">
                  <span>Prezzo variabile</span>
                  <span className="text-[10px] text-slate-500 font-normal font-sans">(Verifica su Amazon)</span>
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">VALORE HARDWARE CONGRUO</span>
              <span className="text-slate-900 font-bold text-sm">
                {review.estimatedFairValueEur ? `~${review.estimatedFairValueEur.toFixed(0)} €` : "N/D"}
              </span>
            </div>
          </div>
        )}

      </article>

      {/* SEZIONE ALTERNATIVE CURATE MANUALMENTE (FASE 3) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-lg text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600" aria-hidden="true">compare_arrows</span>
              Alternative Consigliate dalla Redazione ({alternatives.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Collegamenti curati ed approvati manualmente (nessuna raccomandazione automatica).
            </p>
          </div>
          <Link
            href={`/admin/alternatives/new?reviewId=${review.id}`}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Collega Alternativa
          </Link>
        </div>

        {alternatives.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Nessuna alternativa collegata a questa recensione. Seleziona un PC valido dal catalogo da raccomandare.
          </div>
        ) : (
          <div className="space-y-4">
            {alternatives.map(({ alt, targetPc }) => {
              const isApproved = alt.isApproved === 1;

              return (
                <div
                  key={alt.id}
                  className={`p-5 rounded-2xl border ${
                    isApproved
                      ? "bg-status-successBg border-status-successBorder"
                      : "bg-amber-50/60 border-amber-300"
                  } space-y-3`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${
                        isApproved
                          ? "bg-emerald-200 text-emerald-900 border-emerald-300"
                          : "bg-amber-200 text-amber-900 border-amber-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">
                        {isApproved ? "verified" : "hourglass_top"}
                      </span>
                      {isApproved ? "ALTERNATIVA APPROVATA" : "⚠️ IN ATTESA DI APPROVAZIONE (Non pubblica)"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Ordine #{alt.displayOrder} &bull; Controllato: {new Date(alt.lastVerifiedAt).toLocaleDateString("it-IT")}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-headline font-bold text-lg text-slate-900">
                      {targetPc.brand} {targetPc.modelName}
                    </h4>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      Target: {alt.intendedUse}
                    </p>
                  </div>

                  {/* Hardware Target */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">CPU</span>
                      <span className="font-semibold text-slate-900">{targetPc.cpuModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">GPU</span>
                      <span className="font-semibold text-slate-900">{targetPc.gpuModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">RAM</span>
                      <span className="font-semibold text-slate-900">{targetPc.ramGb}GB {targetPc.ramType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PSU</span>
                      <span className="font-semibold text-slate-900">{targetPc.psuWattage ? `${targetPc.psuWattage}W` : "Standard"}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>Motivazione:</strong> {alt.editorialReasoning}
                  </p>

                  {(alt.prosVsSource || alt.consVsSource) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {alt.prosVsSource && (
                        <div className="text-emerald-900">
                          <strong className="block text-[10px] uppercase font-mono text-emerald-700">Vantaggi:</strong>
                          <span>{alt.prosVsSource}</span>
                        </div>
                      )}
                      {alt.consVsSource && (
                        <div className="text-amber-900">
                          <strong className="block text-[10px] uppercase font-mono text-amber-700">Compromessi:</strong>
                          <span>{alt.consVsSource}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SEZIONE FONTI E METODOLOGIA (FASE 3) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-lg text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand" aria-hidden="true">menu_book</span>
              Fonti Consultate e Metodologia ({reviewSources.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trasparenza sulla provenienza dei dati tecnici e dei benchmark.
            </p>
          </div>
          <Link
            href={`/admin/sources/new?reviewId=${review.id}`}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-brand border border-blue-200 text-xs font-semibold hover:bg-blue-100 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Aggiungi Fonte
          </Link>
        </div>

        {reviewSources.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Nessuna fonte documentata per questa recensione. Aggiungi il link al datasheet o al benchmark per dare massima autorevolezza al giudizio.
          </div>
        ) : (
          <div className="space-y-3">
            {reviewSources.map((s) => (
              <div key={s.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{s.sourceName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 uppercase text-slate-600">
                    {s.sourceType.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{s.notes}</p>
                <div className="text-[11px] font-mono pt-1">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline inline-flex items-center gap-1"
                  >
                    <span>{s.url}</span>
                    <span className="material-symbols-outlined text-xs" aria-hidden="true">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEZIONE OFFERTE COMMERCIALI ATTIVE (FASE 3) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-lg text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700" aria-hidden="true">sell</span>
              Offerte Commerciali Monitorate ({offers.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Link affiliati e prezzi con data dell'ultima verifica.
            </p>
          </div>
          <Link
            href={`/admin/prices/new?pcId=${pc.id}`}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Aggiungi Offerta
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Nessuna offerta registrata per questo modello.
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => {
              const isStale = o.lastVerifiedAt < thirtyDaysAgo;

              return (
                <div
                  key={o.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-slate-900">
                      {o.retailer} &bull;{" "}
                      {showExactPrices && o.priceAmountEur
                        ? `${o.priceAmountEur.toFixed(2)} €`
                        : "Prezzo variabile in tempo reale"}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Ultima verifica: {new Date(o.lastVerifiedAt).toLocaleDateString("it-IT")}{" "}
                      {isStale && <strong className="text-red-700">(⚠️ Prezzo non controllato da &gt;30 gg)</strong>}
                    </div>
                  </div>

                  <a
                    href={buildAffiliateUrl(o.cleanUrl || o.affiliateUrl || o.asin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-brand text-white font-semibold text-xs rounded-xl hover:bg-brand-hover inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>{SITE_CONFIG.pricing.ctaText}</span>
                    <span className="material-symbols-outlined text-xs" aria-hidden="true">open_in_new</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
