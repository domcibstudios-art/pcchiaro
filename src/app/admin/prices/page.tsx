import Link from "next/link";
import { db } from "@/db";
import { priceOffers, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPriceOfferAction,
  toggleOfferValidityAction,
  deletePriceOfferAction,
  toggleShowExactPricesAction,
} from "./actions";
import DeleteButton from "@/components/admin/delete-button";
import { getShowExactPrices } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage({
  searchParams,
}: {
  searchParams: Promise<{ pcId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const showExactPrices = getShowExactPrices();

  const allOffers = db
    .select({
      offer: priceOffers,
      pc: pcs,
    })
    .from(priceOffers)
    .innerJoin(pcs, eq(priceOffers.pcId, pcs.id))
    .all();

  const filtered = allOffers.filter(({ offer }) => {
    if (params.pcId && offer.pcId !== params.pcId) return false;
    if (params.status === "valid" && offer.isValid !== 1) return false;
    if (params.status === "stale" && offer.lastVerifiedAt >= thirtyDaysAgo) return false;
    if (params.status === "invalid" && offer.isValid !== 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-slate-900">
            Offerte e Link Commerciali ({allOffers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoraggio manuale di prezzi, rivenditori, link affiliati conformi e date di verifica.
          </p>
        </div>

        <Link
          href="/admin/prices/new"
          className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Aggiungi Nuova Offerta
        </Link>
      </div>

      {/* Box Regola di Conformità Normativa Amazon (Configurabile con 1 clic) */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          showExactPrices
            ? "bg-amber-50 border-amber-300 text-amber-950"
            : "bg-emerald-50 border-emerald-300 text-emerald-950"
        }`}
      >
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              {showExactPrices ? "warning" : "verified_user"}
            </span>
            <span>
              Policy Amazon: {showExactPrices ? "Prezzi Esatti Attivi in Frontend" : "Modalità Conforme (Prezzi Esatti Nascosti)"}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {showExactPrices
              ? "I prezzi numerici fissi sono attualmente visibili al pubblico. Assicurati di disporre dell'accesso alle Amazon Creators API per non violare l'accordo operativo sull'aggiornamento in tempo reale."
              : "I prezzi numerici manuali sono protetti e nascosti agli utenti pubblici: il sito mostra conformemente la CTA 'Controlla il prezzo su Amazon.it'. Nessun rischio di sospensione account."}
          </p>
        </div>

        <form action={toggleShowExactPricesAction}>
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-sm shrink-0 flex items-center gap-1.5 ${
              showExactPrices
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : "bg-amber-700 hover:bg-amber-800 text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {showExactPrices ? "shield" : "visibility"}
            </span>
            <span>{showExactPrices ? "Passa a Modalità Conforme (Nascondi)" : "Attiva Prezzi Esatti con 1 Clic"}</span>
          </button>
        </form>
      </div>

      {/* Filtri */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/prices"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !params.status ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Tutte ({allOffers.length})
        </Link>
        <Link
          href="/admin/prices?status=valid"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "valid"
              ? "bg-brand text-white"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          Attive ({allOffers.filter((o) => o.offer.isValid === 1).length})
        </Link>
        <Link
          href="/admin/prices?status=stale"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "stale"
              ? "bg-brand text-white"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          Da Verificare (&gt;30 gg) ({allOffers.filter((o) => o.offer.lastVerifiedAt < thirtyDaysAgo).length})
        </Link>
        <Link
          href="/admin/prices?status=invalid"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            params.status === "invalid"
              ? "bg-brand text-white"
              : "bg-red-50 text-red-800 hover:bg-red-100 border border-red-200"
          }`}
        >
          Non Disponibili ({allOffers.filter((o) => o.offer.isValid === 0).length})
        </Link>
      </div>

      {/* Tabella Offerte */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nessuna offerta trovata con i filtri selezionati.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">PC & Rivenditore</th>
                  <th className="px-4 py-3">Prezzo Registrato</th>
                  <th className="px-4 py-3">Stato Offerta</th>
                  <th className="px-4 py-3">Data Ultimo Controllo</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(({ offer, pc }) => {
                  const isStale = offer.lastVerifiedAt < thirtyDaysAgo;

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-bold text-slate-900 text-sm">
                          <Link href={`/admin/pcs/${pc.id}/edit`} className="hover:underline">
                            {pc.brand} {pc.modelName}
                          </Link>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{offer.retailer}</span>
                          {offer.asin && <span>&bull; ASIN: {offer.asin}</span>}
                          <span>&bull; Fonte: {offer.dataSource}</span>
                        </div>
                        <div>
                          <a
                            href={offer.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:underline text-[11px] inline-flex items-center gap-0.5"
                          >
                            <span>Apri link inserzione</span>
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">open_in_new</span>
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-sm">
                        {offer.priceAmountEur ? (
                          <div className="font-extrabold text-slate-900">
                            {offer.priceAmountEur.toFixed(2)} €
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">Non registrato</span>
                        )}
                        {offer.notes && (
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">{offer.notes}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {offer.isValid === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-mono">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">check_circle</span>
                            DISPONIBILE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-300 text-[10px] font-bold font-mono">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">cancel</span>
                            NON DISPONIBILE
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>{new Date(offer.lastVerifiedAt).toLocaleDateString("it-IT")}</div>
                        {isStale && (
                          <span className="text-red-700 text-[10px] font-semibold flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">error</span>
                            Obsoleto (&gt;30 gg)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Segna Verificato Oggi */}
                          <form action={verifyPriceOfferAction.bind(null, offer.id)}>
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-100 transition-colors"
                              title="Aggiorna data verifica a oggi"
                            >
                              <span className="material-symbols-outlined text-base" aria-hidden="true">
                                event_available
                              </span>
                            </button>
                          </form>

                          {/* Toggle Disponibilità */}
                          <form action={toggleOfferValidityAction.bind(null, offer.id)}>
                            <button
                              type="submit"
                              className={`p-1.5 rounded-lg transition-colors ${
                                offer.isValid === 1 ? "text-emerald-700 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                              }`}
                              title={offer.isValid === 1 ? "Segna non disponibile" : "Segna disponibile"}
                            >
                              <span className="material-symbols-outlined text-base" aria-hidden="true">
                                {offer.isValid === 1 ? "toggle_on" : "toggle_off"}
                              </span>
                            </button>
                          </form>

                          {/* Modifica */}
                          <Link
                            href={`/admin/prices/${offer.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-slate-100 transition-colors"
                            title="Modifica offerta"
                          >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                              edit
                            </span>
                          </Link>

                          {/* Elimina */}
                          <form action={deletePriceOfferAction.bind(null, offer.id)}>
                            <DeleteButton
                              title="Elimina offerta commerciale"
                              confirmMessage="Vuoi davvero eliminare questa offerta?"
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
