"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveSourceAction } from "./actions";

interface SourceFormProps {
  availableReviews: { id: string; title: string }[];
  initialData?: any;
  defaultReviewId?: string;
  isEditing?: boolean;
}

export default function SourceForm({
  availableReviews,
  initialData,
  defaultReviewId,
  isEditing,
}: SourceFormProps) {
  const [state, formAction, isPending] = useActionState(saveSourceAction, undefined);

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

      {/* DATI FONTE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          Fonte Consultata e Base Informativa
        </h2>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Recensione Associata *
          </label>
          <select
            name="reviewId"
            required
            defaultValue={initialData?.reviewId || defaultReviewId || ""}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nome della Fonte *
            </label>
            <input
              type="text"
              name="sourceName"
              required
              defaultValue={initialData?.sourceName || ""}
              placeholder="es. Intel ARK Database, TechPowerUp..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Tipologia di Fonte *
            </label>
            <select
              name="sourceType"
              required
              defaultValue={initialData?.sourceType || "benchmark_indipendente"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand bg-white"
            >
              <option value="benchmark_indipendente">Benchmark Indipendente / Test terze parti</option>
              <option value="produttore">Specifiche Ufficiali Produttore (Intel, AMD, NVIDIA...)</option>
              <option value="inserzione_commerciale">Scheda Commerciale Venditore (Amazon)</option>
              <option value="test_diretto">Test Diretto in Laboratorio</option>
              <option value="community">Community Tecnica Verificata</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            URL della Fonte *
          </label>
          <input
            type="url"
            name="url"
            required
            defaultValue={initialData?.url || ""}
            placeholder="https://ark.intel.com/... oppure https://www.techpowerup.com/..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-brand"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Quali informazioni supporta questa fonte? (Note) *
          </label>
          <textarea
            name="notes"
            rows={3}
            required
            defaultValue={initialData?.notes || ""}
            placeholder="es. Conferma data di lancio Q2 2013, TDP 84W, incompatibilità Windows 11..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/sources"
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
            <span>{isPending ? "Salvataggio..." : isEditing ? "Aggiorna Fonte" : "Salva Fonte"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
