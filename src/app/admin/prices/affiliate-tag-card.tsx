"use client";

import { useActionState, useState } from "react";
import { updateAmazonAffiliateTagAction } from "./actions";

export default function AffiliateTagCard({ initialTag }: { initialTag: string }) {
  const [state, formAction, isPending] = useActionState(updateAmazonAffiliateTagAction, undefined);
  const [tagValue, setTagValue] = useState(initialTag);

  const hasTag = Boolean(tagValue.trim());

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
            sell
          </span>
          <div>
            <h2 className="font-bold text-sm text-slate-900">Tag Affiliazione Amazon Centralizzato</h2>
            <p className="text-xs text-slate-500">
              Il codice di tracciamento associato al tuo account Amazon Associates applicato dinamicamente a tutti i link del sito.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {hasTag ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Attivo: {tagValue.trim()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Nessun tag (Link diretti Amazon)
            </span>
          )}
        </div>
      </div>

      <form action={formAction} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <div className="relative flex-1">
          <input
            type="text"
            name="amazonAffiliateTag"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            placeholder="Es. pcchiaro-21 (lascia vuoto se in attesa di account)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            save
          </span>
          <span>{isPending ? "Salvataggio..." : "Salva Codice"}</span>
        </button>
      </form>

      {state?.success && (
        <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Tag aggiornato con successo: attivo istantaneamente su tutte le recensioni e pulsanti di acquisto!
        </p>
      )}

      <p className="text-[11px] text-slate-400 leading-normal">
        💡 <strong>Come funziona:</strong> finché non hai ancora l'account Amazon, lascia il campo vuoto. I visitatori verranno reindirizzati normalmente al prodotto su Amazon senza codici fittizi. Appena Amazon ti assegna il Tag, salvalo qui e l'intero catalogo diventerà monetizzabile all'istante senza modificare singolarmente le offerte.
      </p>
    </div>
  );
}
