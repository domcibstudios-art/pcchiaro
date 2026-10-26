"use client";

import { useActionState } from "react";
import Link from "next/link";
import { savePriceOfferAction } from "./actions";

interface PriceFormProps {
  availablePcs: { id: string; brand: string; modelName: string }[];
  initialData?: any;
  defaultPcId?: string;
  isEditing?: boolean;
}

export default function PriceForm({
  availablePcs,
  initialData,
  defaultPcId,
  isEditing,
}: PriceFormProps) {
  const [state, formAction, isPending] = useActionState(savePriceOfferAction, undefined);

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      {isEditing && <input type="hidden" name="isEditing" value="1" />}

      {/* Errore */}
      {state?.error && (
        <div
          role="alert"
          className="p-4 bg-status-dangerBg border border-status-dangerBorder rounded-xl text-xs text-status-danger flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* SEZIONE 1: PC E RIVENDITORE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          1. Dati Prodotto e Rivenditore
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              PC Associato *
            </label>
            <select
              name="pcId"
              required
              defaultValue={initialData?.pcId || defaultPcId || ""}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand bg-white"
            >
              <option value="">-- Seleziona PC dal catalogo --</option>
              {availablePcs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.modelName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Rivenditore / Piattaforma *
            </label>
            <input
              type="text"
              name="retailer"
              required
              defaultValue={initialData?.retailer || "Amazon.it"}
              placeholder="es. Amazon.it, MediaWorld..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Prezzo Rilevato (€)
            </label>
            <input
              type="number"
              step="0.01"
              name="priceAmountEur"
              defaultValue={initialData?.priceAmountEur ?? ""}
              placeholder="es. 489.00"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Codice ASIN / ID Commerciale
            </label>
            <input
              type="text"
              name="asin"
              defaultValue={initialData?.asin || ""}
              placeholder="es. B00XXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Fonte del Dato Prezzo *
            </label>
            <select
              name="dataSource"
              defaultValue={initialData?.dataSource || "manual_check"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand bg-white"
            >
              <option value="manual_check">Verifica manuale diretta</option>
              <option value="keepa">Keepa / Storico prezzi</option>
              <option value="creators_api">Amazon Creators API</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: LINK E AFFILIAZIONE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          2. Collegamenti e Trasparenza Affiliazione
        </h2>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            URL Affiliato (Destinazione Finale) *
          </label>
          <input
            type="url"
            name="affiliateUrl"
            required
            defaultValue={initialData?.affiliateUrl || ""}
            placeholder="https://www.amazon.it/dp/B00...?tag=pcchiaro-21"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-brand"
          />
          <p className="text-[11px] text-slate-500">
            Niente link cloaking: il link deve portare chiaramente all'inserzione ufficiale del merchant.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            URL Pulito (Senza Tag di Tracciamento)
          </label>
          <input
            type="url"
            name="cleanUrl"
            defaultValue={initialData?.cleanUrl || ""}
            placeholder="https://www.amazon.it/dp/B00..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-brand"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Note sull'Offerta / Disponibilità
          </label>
          <input
            type="text"
            name="notes"
            defaultValue={initialData?.notes || ""}
            placeholder="es. Venduto e spedito da Amazon, oppure Venditore terzo con storico breve"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
          />
        </div>

        {/* VALIDITÀ OFFERTA */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isValid"
              value="1"
              defaultChecked={initialData ? initialData.isValid === 1 : true}
              className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand"
            />
            <div className="text-xs text-slate-800">
              <span className="font-bold block">
                Offerta attualmente attiva e disponibile all'acquisto
              </span>
              <span className="text-[11px] text-slate-500 block">
                Se l'articolo è esaurito o non più reperibile, deseleziona questa casella per non mostrare link ingannevoli.
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/prices"
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">save</span>
            <span>{isPending ? "Salvataggio..." : isEditing ? "Aggiorna Prezzo" : "Salva Offerta"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
