import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { pcs, reviews, curatedAlternatives, priceOffers, sources } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { SITE_CONFIG } from "@/config/site";
import { getShowExactPrices, getAmazonAffiliateTagAsync } from "@/lib/settings";
import { buildAffiliateUrl } from "@/lib/affiliate";
import { generateSeoMeta, generateReviewFaqs, generateStructuredData, getCleanBrandModel } from "@/lib/seo-engine";
import { fixItalianApostrophes } from "@/lib/typography";
import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";
import BottomNav from "@/components/public/bottom-nav";
import VerdictBadge from "@/components/public/verdict-badge";
import EvidenceBadge from "@/components/public/evidence-badge";
import TrafficLightGrid from "@/components/public/traffic-light-grid";

interface ReviewPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600; // Cache di 1 ora: le recensioni cambiano solo su modifica redazionale

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const items = await db
    .select({
      review: reviews,
      pc: pcs,
    })
    .from(reviews)
    .innerJoin(pcs, eq(reviews.pcId, pcs.id))
    .where(and(eq(reviews.slug, slug), eq(reviews.status, "published")))
    .limit(1);

  if (!items || items.length === 0) {
    return {
      title: "Recensione non trovata - PCChiaro.it",
    };
  }

  const { review, pc } = items[0];
  const activeOffers = await db
    .select()
    .from(priceOffers)
    .where(and(eq(priceOffers.pcId, pc.id), eq(priceOffers.isValid, 1)))
    .limit(1);

  const activeOffer = activeOffers && activeOffers.length > 0 ? activeOffers[0] : null;

  const { title: pageTitle, description: pageDesc } = generateSeoMeta(
    review,
    pc,
    activeOffer ? { asin: activeOffer.asin, priceAmountEur: activeOffer.priceAmountEur } : undefined
  );

  return {
    metadataBase: new URL(SITE_CONFIG.defaultUrl),
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      type: "article",
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
    },
    alternates: {
      canonical: `/recensioni/${slug}`,
    },
  };
}

export default async function ReviewDetailPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const db = await getDb();
  const [showExactPrices, affiliateTag] = await Promise.all([
    getShowExactPrices(),
    getAmazonAffiliateTagAsync(),
  ]);

  // Query la recensione e i dettagli hardware del PC
  const items = await db
    .select({
      review: reviews,
      pc: pcs,
    })
    .from(reviews)
    .innerJoin(pcs, eq(reviews.pcId, pcs.id))
    .where(and(eq(reviews.slug, slug), eq(reviews.status, "published")))
    .limit(1);

  if (!items || items.length === 0) {
    notFound();
  }

  const { review, pc } = items[0];

  // Offerte commerciali valide
  const allValidOffers = await db
    .select()
    .from(priceOffers)
    .where(eq(priceOffers.isValid, 1));

  const offersByPcId = new Map<string, typeof priceOffers.$inferSelect>(
    allValidOffers.map((o: any) => [o.pcId, o])
  );
  const activeOffer = offersByPcId.get(pc.id);

  // Alternative curate APPROVATE (isApproved = 1)
  const approvedAlternatives = await db
    .select({
      alt: curatedAlternatives,
      targetPc: pcs,
    })
    .from(curatedAlternatives)
    .innerJoin(pcs, eq(curatedAlternatives.targetPcId, pcs.id))
    .where(
      and(
        eq(curatedAlternatives.sourceReviewId, review.id),
        eq(curatedAlternatives.isApproved, 1)
      )
    )
    .orderBy(asc(curatedAlternatives.displayOrder));

  // Per ciascuna alternativa, controlla se il targetPc ha a sua volta una recensione pubblicata
  const targetPcReviews = await db
    .select({
      pcId: reviews.pcId,
      slug: reviews.slug,
      verdict: reviews.verdict,
    })
    .from(reviews)
    .where(eq(reviews.status, "published"));

  const reviewsByPcId = new Map<string, { pcId: string; slug: string; verdict: any }>(
    targetPcReviews.map((r: any) => [r.pcId, r])
  );

  // Fonti consultate registrate per questa recensione
  const reviewSources = await db
    .select()
    .from(sources)
    .where(eq(sources.reviewId, review.id));

  // Parsing JSON arrays di punti di forza, criticità e specifiche omesse
  let strengthsList: string[] = [];
  try {
    strengthsList = JSON.parse(review.strengths);
  } catch {
    strengthsList = [];
  }

  let weaknessesList: string[] = [];
  try {
    weaknessesList = JSON.parse(review.weaknesses);
  } catch {
    weaknessesList = [];
  }

  let unverifiedList: string[] = [];
  if (pc.unverifiedSpecs) {
    try {
      unverifiedList = JSON.parse(pc.unverifiedSpecs);
    } catch {
      unverifiedList = [];
    }
  }

  const affiliateUrl = activeOffer
    ? buildAffiliateUrl(activeOffer.cleanUrl || activeOffer.affiliateUrl || activeOffer.asin, affiliateTag)
    : "#";

  // Generazione automatica FAQ e Dati Strutturati Schema.org
  const faqs = generateReviewFaqs(review, pc);
  const { reviewSchema, techArticleSchema, faqSchema } = generateStructuredData(
    review,
    pc,
    activeOffer
      ? {
          asin: activeOffer.asin,
          priceAmountEur: activeOffer.priceAmountEur,
          affiliateUrl: buildAffiliateUrl(
            activeOffer.cleanUrl || activeOffer.affiliateUrl || activeOffer.asin,
            affiliateTag
          ),
        }
      : undefined,
    faqs,
    `/recensioni/${slug}`
  );

  const isWin11Official = pc.cpuWin11Support === 1 || (pc.osOfficialSupport === 1 && pc.cpuWin11Support !== 0);
  const isWin11Unsupported = pc.cpuWin11Support === 0 || pc.osOfficialSupport === 0;
  const win11SupportLabel = isWin11Official
    ? "Garantito (Requisiti Microsoft soddisfatti)"
    : isWin11Unsupported
    ? "Non garantito / Bypass"
    : "Da verificare";

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* SCHEMA.ORG STRUCTURED DATA (JSON-LD) PER GOOGLE */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewSchema).replace(/</g, "\\u003c"),
        }}
      />
      {techArticleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(techArticleSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-8 w-full">
        {/* BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 font-mono">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li>
              <Link href="/" className="hover:text-brand transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/#feed" className="hover:text-brand transition-colors">
                Verifiche
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
              {getCleanBrandModel(pc.brand, pc.modelName, pc.cpuModel)}
            </li>
          </ol>
        </nav>

        {/* HEADER RECENSIONE */}
        <header className="space-y-4 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold">
              {pc.category.replace("_", " ")}
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              {activeOffer?.asin && <span>ASIN: <strong>{activeOffer.asin}</strong></span>}
              <span>&bull;</span>
              <span>
                Aggiornato: {new Date(review.updatedAt).toLocaleDateString("it-IT")}
              </span>
            </div>
          </div>

          <h1 className="font-headline font-extrabold text-2xl sm:text-4xl text-slate-900 leading-tight">
            {fixItalianApostrophes(review.title)}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {fixItalianApostrophes(review.summaryIntro)}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <VerdictBadge verdict={review.verdict} size="lg" />
            <EvidenceBadge level={review.evidenceLevel} />
          </div>
        </header>

        {/* SCHEDA SPECIFICHE HARDWARE DETTAGLIATE */}
        <section aria-labelledby="specs-heading" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="specs-heading" className="font-headline font-bold text-xl text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
                memory
              </span>
              Scheda Tecnica Analizzata
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Verifica configurazione fisica
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-mono">Processore (CPU)</span>
              <span className="font-bold text-slate-900 mt-1">{pc.cpuModel}</span>
              {pc.cpuGen && (
                <span className="text-slate-500 text-[11px] mt-0.5">
                  Generazione / Architettura: {pc.cpuGen}
                </span>
              )}
              {pc.cpuWin11Support === 0 && (
                <span className="text-red-700 font-semibold text-[11px] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">warning</span>
                  CPU NON supportata ufficialmente da Windows 11
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-mono">Scheda Video (GPU)</span>
              <span className="font-bold text-slate-900 mt-1">{pc.gpuModel}</span>
              <span className="text-slate-500 text-[11px] mt-0.5">
                VRAM: {pc.gpuVramGb ? `${pc.gpuVramGb} GB` : "Condivisa con la RAM"} &bull; Tipo: {pc.gpuType}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-mono">Memoria RAM</span>
              <span className={`font-bold mt-1 ${pc.ramChannel === "single" ? "text-red-700" : "text-slate-900"}`}>
                {pc.ramGb} GB {pc.ramType || ""} {pc.ramChannel === "single" ? "(Singolo Canale ⚠️)" : pc.ramChannel === "dual" ? "(Doppio Canale)" : ""}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">
                {pc.ramChannel === "single"
                  ? "Banda passante dimezzata rispetto al Dual Channel."
                  : "Configurazione Dual Channel a piena banda."}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-mono">Archiviazione (Storage)</span>
              <span className="font-bold text-slate-900 mt-1">
                {pc.storageType || "SSD"} {pc.storageCapacityGb ? `${pc.storageCapacityGb} GB` : ""}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">
                {pc.storageDetails || "Dati fornitore standard"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-mono">Alimentatore (PSU)</span>
              <span className="font-bold text-slate-900 mt-1">
                {pc.psuWattage ? `${pc.psuWattage}W` : "Non dichiarato dal venditore"}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">
                {pc.psuRating ? `Certificazione: ${pc.psuRating}` : "Certificazione 80+ omessa o assente"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-mono">Sistema Operativo</span>
              <span className="font-bold text-slate-900 mt-1">
                {pc.osInstalled || "Windows"}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">
                Supporto ufficiale Microsoft: {win11SupportLabel}
              </span>
            </div>
          </div>

          {/* AVVISO SPECIFICHE OMESSE O INGANNEVOLI */}
          {unverifiedList.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-950">
                <span className="material-symbols-outlined text-red-700 text-lg" aria-hidden="true">
                  warning
                </span>
                Componenti critici omessi dal venditore:
              </div>
              <ul className="list-disc pl-6 space-y-1 text-red-800 pt-1">
                {unverifiedList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* SEMAFORO STANDARD SUI 3 AMBITI D'USO */}
        <section aria-labelledby="traffic-heading" className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h2 id="traffic-heading" className="font-headline font-bold text-xl text-slate-900">
              Idoneità d&apos;Uso Standardizzata
            </h2>
            <p className="text-xs text-slate-500">
              Analisi oggettiva basata su benchmark di settore e requisiti hardware reali
            </p>
          </div>

          <TrafficLightGrid
            gamingRating={review.ratingGaming}
            gamingReason={review.notesGaming}
            workRating={review.ratingWork}
            workReason={review.notesWork}
            officeRating={review.ratingOffice}
            officeReason={review.notesOffice}
          />
        </section>

        {/* PUNTI DI FORZA & LIMITI CRITICI */}
        <section aria-labelledby="pros-cons-heading" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 id="pros-cons-heading" className="font-headline font-bold text-base text-emerald-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl" aria-hidden="true">
                check_circle
              </span>
              Punti a Favore
            </h3>
            {strengthsList.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {strengthsList.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">&bull;</span>
                    <span>{fixItalianApostrophes(str)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Nessun punto di forza di rilievo.</p>
            )}
          </div>

          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-base text-red-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-xl" aria-hidden="true">
                cancel
              </span>
              Limiti &amp; Criticità Rilevate
            </h3>
            {weaknessesList.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {weaknessesList.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold shrink-0 mt-0.5">&bull;</span>
                    <span>{fixItalianApostrophes(weak)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Nessuna criticità grave riscontrata.</p>
            )}
          </div>
        </section>

        {/* ANALISI EDITORIA: PERCHÉ HA RECENSIONI POSITIVE SU AMAZON */}
        {review.whyPositiveReviews && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-2xl" aria-hidden="true">
                psychology
              </span>
              <h2 className="font-headline font-bold text-lg text-slate-900">
                Perché ha molte recensioni positive su Amazon?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {fixItalianApostrophes(review.whyPositiveReviews)}
            </p>
          </section>
        )}

        {/* BOX OFFERTA AMAZON (CONFORME POLICY AMAZON) */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline font-bold text-lg text-slate-900">
              Verifica Offerta su Amazon.it
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {SITE_CONFIG.pricing.stalePriceNotice}
            </p>
          </div>

          {review.estimatedFairValueEur && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              <span className="material-symbols-outlined text-base text-emerald-600" aria-hidden="true">price_check</span>
              <span>Soglia di convenienza stimata dalla redazione: <strong>entro ~{review.estimatedFairValueEur.toFixed(0)}€</strong></span>
            </div>
          )}

          {activeOffer?.priceAmountEur && review.estimatedFairValueEur && activeOffer.priceAmountEur > review.estimatedFairValueEur * 1.25 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-w-lg mx-auto text-left flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5" aria-hidden="true">warning</span>
              <div>
                <strong>Attenzione all&apos;oscillazione dei prezzi su Amazon:</strong>
                <p className="mt-0.5 text-amber-800">
                  Questa macchina rappresenta un acquisto valido solo se acquistata entro la soglia stimata (~{review.estimatedFairValueEur.toFixed(0)}€). 
                  Se su Amazon il prezzo attuale risulta sensibilmente superiore (spesso a causa di commercianti terzi sul marketplace), il rapporto qualità/prezzo viene meno ed è preferibile orientarsi sulle alternative riportate in basso.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {affiliateUrl !== "#" ? (
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {showExactPrices && activeOffer?.priceAmountEur ? (
                  <span>Controlla Offerta ({activeOffer.priceAmountEur.toFixed(2)}€)</span>
                ) : (
                  <span>{SITE_CONFIG.pricing.ctaText}</span>
                )}
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  open_in_new
                </span>
              </a>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Link all&apos;offerta commerciale attualmente non disponibile
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            {SITE_CONFIG.compliance.amazonDisclosure}
          </p>
        </section>

        {/* SEZIONE ALTERNATIVE CURATE MANUALMENTE (APPROVATE) */}
        <section aria-labelledby="alt-heading" className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
                recommend
              </span>
              <h2 id="alt-heading" className="font-headline font-bold text-xl text-slate-900">
                Alternative Consigliate dalla Redazione
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Alternative verificate e approvate manualmente, prive delle criticità riscontrate su questa macchina
            </p>
          </div>

          {approvedAlternatives.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              Nessuna alternativa alternativa inserita o attualmente approvata per questo modello.
            </div>
          ) : (
            <div className="space-y-4">
              {approvedAlternatives.map(({ alt, targetPc }) => {
                const targetReview = reviewsByPcId.get(targetPc.id);
                const targetOffer = offersByPcId.get(targetPc.id);

                return (
                  <div
                    key={alt.id}
                    className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          Alternativa per: {alt.intendedUse}
                        </span>
                        {targetReview && (
                          <VerdictBadge verdict={targetReview.verdict} size="sm" />
                        )}
                      </div>
                      {alt.priceDifferenceEur !== null && (
                        <span className="text-xs font-mono text-slate-500">
                          Differenza stima listino: {alt.priceDifferenceEur > 0 ? `+${alt.priceDifferenceEur}€` : `${alt.priceDifferenceEur}€`}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-headline font-bold text-lg text-slate-900">
                        {targetPc.brand} {targetPc.modelName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {alt.editorialReasoning}
                      </p>
                    </div>

                    {/* Specifiche hardware comparative */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">CPU</span>
                        <span className="font-semibold text-slate-800">{targetPc.cpuModel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">GPU</span>
                        <span className="font-semibold text-slate-800">{targetPc.gpuModel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">RAM</span>
                        <span className="font-semibold text-slate-800">{targetPc.ramGb}GB {targetPc.ramType || ""}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">STORAGE</span>
                        <span className="font-semibold text-slate-800">{targetPc.storageCapacityGb ? `${targetPc.storageCapacityGb}GB` : "SSD"}</span>
                      </div>
                    </div>

                    {/* Vantaggi specifici rispetto al PC recensito */}
                    {alt.prosVsSource && (
                      <div className="text-xs text-emerald-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-700 mt-0.5 shrink-0" aria-hidden="true">
                          check
                        </span>
                        <span><strong>Vantaggio chiave:</strong> {alt.prosVsSource}</span>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-emerald-100/60">
                      <div>
                        {targetReview ? (
                          <Link
                            href={`/recensioni/${targetReview.slug}`}
                            className="min-h-[44px] px-4 rounded-xl border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-brand text-lg" aria-hidden="true">
                              article
                            </span>
                            <span>Leggi la Recensione Completa su PCChiaro</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Scheda dettagliata PCChiaro in lavorazione
                          </span>
                        )}
                      </div>

                      {targetOffer && (
                        <a
                          href={buildAffiliateUrl(
                            targetOffer.cleanUrl || targetOffer.affiliateUrl || targetOffer.asin
                          )}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="min-h-[44px] px-5 rounded-xl bg-brand text-white font-semibold text-xs sm:text-sm hover:bg-brand-hover active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {showExactPrices && targetOffer.priceAmountEur ? (
                            <span>Vedi Offerta su Amazon ({targetOffer.priceAmountEur.toFixed(2)}€)</span>
                          ) : (
                            <span>Controlla Offerta su Amazon.it</span>
                          )}
                          <span className="material-symbols-outlined text-base" aria-hidden="true">
                            open_in_new
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DOMANDE FREQUENTI SULL'HARDWARE (FAQ OTTIMIZZATE SEO GOOGLE) */}
        <section aria-labelledby="faq-heading" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
              help
            </span>
            <div>
              <h2 id="faq-heading" className="font-headline font-bold text-xl text-slate-900">
                Domande Frequenti su {pc.brand} {pc.modelName} (FAQ)
              </h2>
              <p className="text-xs text-slate-500">
                Risposte tecniche oggettive basate sulla configurazione hardware reale
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group border border-slate-200 rounded-xl bg-slate-50/50 p-4 open:bg-white transition-colors"
                open={idx === 0}
              >
                <summary className="font-semibold text-sm text-slate-900 cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform text-lg shrink-0">
                    expand_more
                  </span>
                </summary>
                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed pt-2 border-t border-slate-100">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* FONTI CONSULTATE & METODOLOGIA */}
        <section aria-labelledby="sources-heading" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
              menu_book
            </span>
            <h2 id="sources-heading" className="font-headline font-bold text-lg text-slate-900">
              Fonti Consultate &amp; Metodologia
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Ogni affermazione tecnica pubblicata su PCChiaro.it si fonda sull&apos;incrocio delle schede ufficiali dei produttori (Intel, AMD, NVIDIA) e benchmark indipendenti pubblici.
          </p>

          {reviewSources.length > 0 ? (
            <div className="space-y-2 pt-1">
              {reviewSources.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{s.sourceName}</span>
                    <span className="font-mono text-[11px] text-slate-500 uppercase px-1.5 py-0.5 bg-slate-200 rounded">
                      {s.sourceType.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{s.notes}</p>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-brand hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Consulta fonte</span>
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">open_in_new</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Fonti specifiche archiviate secondo il protocollo standard PCChiaro.
            </p>
          )}

          <div className="pt-2">
            <Link
              href="/metodo"
              className="text-xs text-brand hover:underline font-semibold flex items-center gap-1"
            >
              <span>Approfondisci il metodo di verifica PCChiaro</span>
              <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
