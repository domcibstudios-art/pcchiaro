import { db } from "@/db";
import { pcs, reviews, priceOffers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SITE_CONFIG } from "@/config/site";
import { getShowExactPrices } from "@/lib/settings";
import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";
import BottomNav from "@/components/public/bottom-nav";
import FilterFeed from "@/components/public/filter-feed";
import { ReviewCardItem } from "@/components/public/review-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const showExactPrices = getShowExactPrices();

  // Query recensioni pubblicate dal database SQLite
  const rawReviews = db
    .select({
      review: reviews,
      pc: pcs,
    })
    .from(reviews)
    .innerJoin(pcs, eq(reviews.pcId, pcs.id))
    .where(eq(reviews.status, "published"))
    .orderBy(desc(reviews.updatedAt))
    .all();

  // Recupera le offerte commerciali valide associate ai PC
  const allOffers = db
    .select()
    .from(priceOffers)
    .where(eq(priceOffers.isValid, 1))
    .all();

  // Crea la mappa pcId -> offerta migliore
  const offersByPcId = new Map<string, typeof priceOffers.$inferSelect>();
  for (const offer of allOffers) {
    if (!offersByPcId.has(offer.pcId)) {
      offersByPcId.set(offer.pcId, offer);
    }
  }

  // Prepara gli elementi per il feed pubblico
  const feedItems: ReviewCardItem[] = rawReviews.map(({ review, pc }) => {
    const offer = offersByPcId.get(pc.id);
    return {
      review,
      pc,
      offer: offer
        ? {
            affiliateUrl: offer.affiliateUrl,
            asin: offer.asin,
            priceAmountEur: offer.priceAmountEur,
            isValid: offer.isValid,
          }
        : null,
      showExactPrices,
    };
  });

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* HEADER PUBBLICO */}
      <SiteHeader />

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 space-y-10 w-full">
        {/* HERO SECTION */}
        <section className="space-y-4">
          <h1 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
            Cosa stai comprando davvero su Amazon?
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            {SITE_CONFIG.description}
          </p>

          {/* Badge di Fiducia e Tutela Consumatore */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="material-symbols-outlined text-brand text-sm" aria-hidden="true">
                check_circle
              </span>
              100% Indipendenti
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="material-symbols-outlined text-brand text-sm" aria-hidden="true">
                block
              </span>
              Zero Sponsor da Venditori
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="material-symbols-outlined text-brand text-sm" aria-hidden="true">
                gavel
              </span>
              Trasparenza L. 145/2018
            </span>
          </div>
        </section>

        {/* FEED INTERATTIVO CON FILTRI E RICERCA */}
        <FilterFeed items={feedItems} />

        {/* GUIDA RAPIDA AUTODIFESA HARDWARE */}
        <section id="autodifesa" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
              lightbulb
            </span>
            <h2 className="font-headline font-bold text-xl text-slate-900">
              Guida Rapida Autodifesa Hardware
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            5 controlli essenziali prima di cliccare &ldquo;Acquista ora&rdquo; su qualsiasi PC preassemblato:
          </p>

          <div className="space-y-2.5 pt-1">
            <details className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 group">
              <summary className="font-semibold text-sm cursor-pointer flex justify-between items-center text-slate-900 min-h-[32px]">
                <span>1. Attento all&apos;etichetta &ldquo;Core i7&rdquo; senza generazione</span>
                <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
                Un i7 di 4ª generazione (es. i7-4770 uscito nel 2013) è fino a 3 volte più lento di un economico processore entry-level moderno come il Core i3 di 12ª gen o un Ryzen 5600, ed è incompatibile con Windows 11 nativo.
              </p>
            </details>

            <details className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 group">
              <summary className="font-semibold text-sm cursor-pointer flex justify-between items-center text-slate-900 min-h-[32px]">
                <span>2. VRAM Dedicata: minimo 6-8GB per giocare oggi</span>
                <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
                Le schede grafiche con soli 4GB di memoria (come le vecchie GTX 1650 o RX 550) saturano la memoria anche a 1080p nei giochi moderni, provocando continui microscatti e freeze anche abbassando i dettagli grafici.
              </p>
            </details>

            <details className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 group">
              <summary className="font-semibold text-sm cursor-pointer flex justify-between items-center text-slate-900 min-h-[32px]">
                <span>3. CUDA Core per chi lavora con AutoCAD, Premiere o Blender</span>
                <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
                I software professionali di rendering, grafica 3D e montaggio video sfruttano intensamente l&apos;ecosistema CUDA proprietario di NVIDIA. Una scheda con grafica integrata o GPU datata rallenta le anteprime e le esportazioni.
              </p>
            </details>

            <details className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 group">
              <summary className="font-semibold text-sm cursor-pointer flex justify-between items-center text-slate-900 min-h-[32px]">
                <span>4. RAM a Singolo Canale: banda passante dimezzata</span>
                <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
                Installare un solo modulo RAM da 16GB invece di due da 8GB (Dual Channel) dimezza la banda passante della memoria, riducendo le prestazioni in gioco fino al 20-25% a parità di processore.
              </p>
            </details>

            <details className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 group">
              <summary className="font-semibold text-sm cursor-pointer flex justify-between items-center text-slate-900 min-h-[32px]">
                <span>5. Windows 11 su CPU non supportata</span>
                <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
                Se il venditore ha installato Windows 11 su CPU Intel precedenti all&apos;8ª generazione aggirando i requisiti ufficiali Microsoft, il sistema rischia di non ricevere i futuri aggiornamenti critici di sicurezza.
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* FOOTER A NORMA DI LEGGE */}
      <SiteFooter />

      {/* BOTTOM NAV PER MOBILE */}
      <BottomNav />
    </div>
  );
}
