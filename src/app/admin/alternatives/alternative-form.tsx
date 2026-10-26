"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAlternativeAction } from "./actions";

interface AlternativeFormProps {
  availableReviews: { id: string; title: string; pcId: string }[];
  availablePcs: { id: string; brand: string; modelName: string; editorialStatus: string }[];
  initialData?: any;
  defaultReviewId?: string;
  isEditing?: boolean;
}

export default function AlternativeForm({
  availableReviews,
  availablePcs,
  initialData,
  defaultReviewId,
  isEditing,
}: AlternativeFormProps) {
  const [state, formAction, isPending] = useActionState(saveAlternativeAction, undefined);

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

      {/* SEZIONE 1: COLLEGAMENTO PRODOTTI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          1. Collegamento Recensione &rarr; Alternativa
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Recensione di Partenza *
            </label>
            <select
              name="sourceReviewId"
              required
              defaultValue={initialData?.sourceReviewId || defaultReviewId || ""}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand bg-white"
            >
              <option value="">-- Seleziona recensione --</option>
              {availableReviews.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              PC Alternativo Consigliato *
            </label>
            <select
              name="targetPcId"
              required
              defaultValue={initialData?.targetPcId || ""}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand bg-white"
            >
              <option value="">-- Seleziona PC alternativo dal catalogo --</option>
              {availablePcs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.modelName} {p.editorialStatus === "archived" ? "(⚠️ ARCHIVIATO)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Destinazione d'Uso / Target Consigliato *
          </label>
          <input
            type="text"
            name="intendedUse"
            required
            defaultValue={initialData?.intendedUse || ""}
            placeholder="es. Gaming 1080p Reale e longevità hardware nella stessa fascia di prezzo"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
          />
        </div>
      </div>

      {/* SEZIONE 2: MOTIVAZIONE EDITORIALE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          2. Motivazione e Confronto Tecnico
        </h2>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Motivazione Editoriale della Raccomandazione *
          </label>
          <textarea
            name="editorialReasoning"
            rows={3}
            required
            defaultValue={initialData?.editorialReasoning || ""}
            placeholder="Spiega chiaramente perché consigli questo PC invece di quello recensito (es. hardware moderno, Windows 11 nativo, 3x prestazioni)..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Vantaggi rispetto al PC recensito
            </label>
            <input
              type="text"
              name="prosVsSource"
              defaultValue={initialData?.prosVsSource || ""}
              placeholder="es. 3x FPS, 8GB VRAM moderna, Windows 11 nativo"
              className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/20 text-xs focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-800">
              Compromessi / Differenze a sfavore
            </label>
            <input
              type="text"
              name="consVsSource"
              defaultValue={initialData?.consVsSource || ""}
              placeholder="es. Richiede circa 20-30€ in più a seconda delle offerte"
              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/20 text-xs focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Differenza Prezzo Stimata (€)
            </label>
            <input
              type="number"
              step="0.01"
              name="priceDifferenceEur"
              defaultValue={initialData?.priceDifferenceEur ?? ""}
              placeholder="es. +30.00 oppure -15.00"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Ordine di Visualizzazione
            </label>
            <input
              type="number"
              name="displayOrder"
              defaultValue={initialData?.displayOrder ?? 1}
              min="1"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 3: APPROVAZIONE MANUALE REDAZIONALE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>3. Approvazione Editoriale Manuale</span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Regola di Qualità
          </span>
        </h2>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isApproved"
              value="1"
              defaultChecked={initialData ? initialData.isApproved === 1 : true}
              className="mt-1 w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand"
            />
            <div className="text-xs text-amber-950 space-y-0.5">
              <span className="font-bold block">
                Approva esplicitamente questa alternativa per la pubblicazione
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Le regole editoriali di PCChiaro.it vietano la generazione o pubblicazione automatica di raccomandazioni. Se deselezioni questa casella, l'alternativa rimarrà visibile solo in bozza all'amministratore e non comparirà mai nelle pagine pubbliche.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/alternatives"
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
            <span>{isPending ? "Salvataggio..." : isEditing ? "Aggiorna Alternativa" : "Salva e Collega Alternativa"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
