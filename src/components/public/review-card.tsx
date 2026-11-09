import Link from "next/link";
import VerdictBadge from "./verdict-badge";
import TrafficLightGrid from "./traffic-light-grid";
import { SITE_CONFIG } from "@/config/site";
import { fixItalianApostrophes } from "@/lib/typography";

export interface ReviewCardItem {
  review: {
    id: string;
    slug: string;
    title: string;
    summaryIntro: string;
    verdict: string;
    evidenceLevel: string;
    ratingGaming: string;
    notesGaming?: string | null;
    ratingWork: string;
    notesWork?: string | null;
    ratingOffice: string;
    notesOffice?: string | null;
    publishedAt?: number | null;
    updatedAt: number;
  };
  pc: {
    id: string;
    brand: string;
    modelName: string;
    cpuModel: string;
    cpuGen?: string | null;
    gpuModel: string;
    gpuVramGb?: number | null;
    ramGb: number;
    ramType?: string | null;
    ramChannel?: string | null;
    storageType?: string | null;
    storageCapacityGb?: number | null;
    motherboardChipset?: string | null;
    psuWattage?: number | null;
    osInstalled?: string | null;
    unverifiedSpecs?: string | null;
  };
  offer?: {
    affiliateUrl: string;
    cleanUrl?: string | null;
    asin?: string | null;
    priceAmountEur?: number | null;
    isValid?: number | null;
  } | null;
  showExactPrices: boolean;
}

export default function ReviewCard({
  item,
}: {
  item: ReviewCardItem;
}) {
  const { review, pc, offer, showExactPrices } = item;
  const isBad = review.verdict === "sconsigliato";
  const isGood = review.verdict === "buon_acquisto";

  // Target CTA url (calcolato dal server con il tag affiliato centralizzato)
  const affiliateUrl = offer?.isValid && offer.affiliateUrl ? offer.affiliateUrl : "#";

  let parsedUnverified: string[] = [];
  if (pc.unverifiedSpecs) {
    try {
      parsedUnverified = JSON.parse(pc.unverifiedSpecs);
    } catch {
      // Ignora parsing error
    }
  }

  return (
    <article
      className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 ${
        isBad
          ? "border-red-200"
          : isGood
          ? "border-emerald-200 bg-emerald-50/10"
          : "border-slate-200"
      }`}
    >
      {/* Intestazione Card: Badge Verdetto & ASIN / Bestseller */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VerdictBadge verdict={review.verdict} size="md" />
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          {offer?.asin && (
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ASIN: {offer.asin}
            </span>
          )}
          {review.updatedAt && (
            <span>
              Verificato il {new Date(review.updatedAt).toLocaleDateString("it-IT")}
            </span>
          )}
        </div>
      </div>

      {/* Titolo e Sommario */}
      <div>
        <h3 className="font-headline font-bold text-xl text-slate-900 leading-snug">
          <Link
            href={`/recensioni/${review.slug}`}
            className="hover:text-brand transition-colors"
          >
            {fixItalianApostrophes(review.title || `${pc.brand} ${pc.modelName}`)}
          </Link>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
          {fixItalianApostrophes(review.summaryIntro)}
        </p>
      </div>

      {/* Specifiche Chiave Sintetiche (Tabellare compatta) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
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
          <span
            className={`font-semibold ${
              pc.ramChannel === "single" ? "text-red-700 font-bold" : "text-slate-900"
            }`}
          >
            {pc.ramGb}GB {pc.ramType || ""}{" "}
            {pc.ramChannel === "single" ? "(Single)" : pc.ramChannel === "dual" ? "(Dual)" : ""}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">STORAGE</span>
          <span className="font-semibold text-slate-900">
            {pc.storageType || "SSD"} {pc.storageCapacityGb ? `${pc.storageCapacityGb}GB` : ""}
          </span>
        </div>
      </div>

      {/* Avviso Specifiche Omesse o Ingannevoli (se presenti) */}
      {parsedUnverified.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
          <span className="material-symbols-outlined text-base text-red-700 mt-0.5 shrink-0" aria-hidden="true">
            warning
          </span>
          <div>
            <strong>Specifiche omesse o non verificate dal venditore:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-red-800">
              {parsedUnverified.map((spec, i) => (
                <li key={i}>{spec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Semaforo Idoneità d'Uso (Compatto in Card) */}
      <div className="space-y-1.5 pt-1">
        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Idoneità d&apos;Uso Standard PCChiaro:
        </p>
        <TrafficLightGrid
          gamingRating={review.ratingGaming}
          gamingReason={review.notesGaming}
          workRating={review.ratingWork}
          workReason={review.notesWork}
          officeRating={review.ratingOffice}
          officeReason={review.notesOffice}
          compact
        />
      </div>

      {/* Pulsanti Azione e Amazon Compliance */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
        <Link
          href={`/recensioni/${review.slug}`}
          className="min-h-[48px] px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Leggi Scheda Completa &amp; Alternative</span>
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            arrow_forward
          </span>
        </Link>

        {affiliateUrl !== "#" ? (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="min-h-[48px] px-5 rounded-xl bg-brand text-white font-semibold text-xs sm:text-sm hover:bg-brand-hover active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {showExactPrices && offer?.priceAmountEur ? (
              <span>Vedi Offerta ({offer.priceAmountEur.toFixed(2)}€)</span>
            ) : (
              <span>{SITE_CONFIG.pricing.ctaText}</span>
            )}
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              open_in_new
            </span>
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic text-center sm:text-right py-2">
            Disponibilità Amazon da verificare
          </span>
        )}
      </div>
    </article>
  );
}
