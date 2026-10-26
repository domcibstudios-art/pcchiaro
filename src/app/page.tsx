import { db } from "@/db";
import { pcs, reviews, priceOffers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SITE_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Query dati pubblicati dal database SQLite
  const publishedReviews = db
    .select({
      review: reviews,
      pc: pcs,
    })
    .from(reviews)
    .innerJoin(pcs, eq(reviews.pcId, pcs.id))
    .where(eq(reviews.status, "published"))
    .all();

  return (
    <div className="min-h-screen flex flex-col">
      {/* BANNER TRASPARENZA METODO */}
      <aside aria-label="Trasparenza Editoriale" className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-center text-xs text-slate-700">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
          <span className="material-symbols-outlined text-brand text-base" aria-hidden="true">fact_check</span>
          <span><strong>{SITE_CONFIG.compliance.methodBannerText}</strong></span>
        </div>
      </aside>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-3xl" aria-hidden="true">verified_user</span>
            <div>
              <span className="font-headline font-extrabold text-xl tracking-tight text-slate-900">
                PCChiaro<span className="text-brand">.it</span>
              </span>
              <p className="text-[11px] font-medium text-slate-500 leading-none hidden sm:block">
                {SITE_CONFIG.tagline}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
            Fase 1: Fondamenta Attive
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 space-y-8 w-full">
        <section className="space-y-4">
          <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            Cosa stai comprando davvero su Amazon?
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            {SITE_CONFIG.description}
          </p>
        </section>

        {/* FEED RECENSIONI CARICATE DAL DATABASE */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="font-headline font-bold text-2xl text-slate-900">
              Verifiche nel Database ({publishedReviews.length})
            </h2>
            <span className="text-xs font-mono text-slate-500">Alimentato da SQLite locale</span>
          </div>

          <div className="space-y-6">
            {publishedReviews.map(({ review, pc }) => {
              const isBad = review.verdict === "sconsigliato";
              const isGood = review.verdict === "buon_acquisto";

              return (
                <article
                  key={review.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 ${
                    isBad ? "border-red-200" : isGood ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
                        isBad
                          ? "bg-status-dangerBg text-status-danger border-status-dangerBorder"
                          : isGood
                          ? "bg-status-successBg text-status-success border-status-successBorder"
                          : "bg-status-warningBg text-status-warning border-status-warningBorder"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        {isBad ? "cancel" : isGood ? "verified" : "warning"}
                      </span>
                      VERDETTO: {review.verdict.toUpperCase().replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Aggiornato: {new Date(review.updatedAt).toLocaleDateString("it-IT")}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline font-bold text-xl text-slate-900">
                      {review.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{review.summaryIntro}</p>
                  </div>

                  {/* SPECIFICHE CHIAVE */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">CPU</span>
                      <span className="font-semibold text-slate-900">{pc.cpuModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">GPU</span>
                      <span className="font-semibold text-slate-900">{pc.gpuModel}</span>
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

                  {/* SEMAFORO 3 AMBITI D'USO */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-xl border bg-slate-50 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1 text-slate-800">
                        <span>🎮</span> Gaming: <strong className="uppercase">{review.ratingGaming}</strong>
                      </span>
                      <p className="text-[11px] text-slate-600">{review.notesGaming}</p>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-slate-50 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1 text-slate-800">
                        <span>💼</span> Lavoro & CAD: <strong className="uppercase">{review.ratingWork}</strong>
                      </span>
                      <p className="text-[11px] text-slate-600">{review.notesWork}</p>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-slate-50 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1 text-slate-800">
                        <span>🎓</span> Studio & Web: <strong className="uppercase">{review.ratingOffice}</strong>
                      </span>
                      <p className="text-[11px] text-slate-600">{review.notesOffice}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-8 px-4 mt-12 text-xs">
        <div className="max-w-5xl mx-auto space-y-2 text-center text-slate-400">
          <p>{SITE_CONFIG.compliance.amazonDisclosure}</p>
          <p>{SITE_CONFIG.compliance.lawReference}</p>
        </div>
      </footer>
    </div>
  );
}
