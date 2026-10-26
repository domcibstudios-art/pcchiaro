import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { reviews, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publishReviewAction, unpublishReviewAction } from "../../actions";
import { SITE_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function ReviewPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = db.select().from(reviews).where(eq(reviews.id, id)).get();

  if (!review) notFound();

  const pc = db.select().from(pcs).where(eq(pcs.id, review.pcId)).get();
  if (!pc) notFound();

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

      {/* RENDER DELLA SCHEDA ESATTAMENTE SECONDO IL DESIGN SYSTEM */}
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

        {/* Analisi Recensioni Positive Amazon se presente */}
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

        {/* Scheda Hardware Sintetica */}
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

        {/* SEMAFORO STANDARD SUI 3 AMBITI D'USO */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Idoneità d'Uso Standard PCChiaro:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* GAMING */}
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

            {/* LAVORO */}
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

            {/* STUDIO */}
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
              <span className="text-red-700 font-bold text-sm">
                {review.amazonListingPriceEur ? `~${review.amazonListingPriceEur.toFixed(0)} €` : "N/D"}
              </span>
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
    </div>
  );
}
