"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveReviewAction } from "./actions";
import { SITE_CONFIG } from "@/config/site";

interface ReviewFormProps {
  availablePcs: { id: string; modelName: string; brand: string }[];
  initialData?: any;
  defaultPcId?: string;
  isEditing?: boolean;
}

export default function ReviewForm({
  availablePcs,
  initialData,
  defaultPcId,
  isEditing,
}: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState(saveReviewAction, undefined);

  // Decodifica JSON stringhe per textarea
  let strengthsText = "";
  if (initialData?.strengths) {
    try {
      const arr = JSON.parse(initialData.strengths);
      if (Array.isArray(arr)) strengthsText = arr.join("\n");
    } catch {
      strengthsText = initialData.strengths;
    }
  }

  let weaknessesText = "";
  if (initialData?.weaknesses) {
    try {
      const arr = JSON.parse(initialData.weaknesses);
      if (Array.isArray(arr)) weaknessesText = arr.join("\n");
    } catch {
      weaknessesText = initialData.weaknesses;
    }
  }

  return (
    <form action={formAction} className="space-y-8 max-w-4xl">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      {isEditing && <input type="hidden" name="isEditing" value="1" />}

      {/* Messaggio Errore */}
      {state?.error && (
        <div
          role="alert"
          className="p-4 bg-status-dangerBg border border-status-dangerBorder rounded-xl text-xs text-status-danger flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* SEZIONE 1: PC ASSOCIATO & TITOLO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          1. Associazione Prodotto e Intestazione
        </h2>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            PC del Catalogo Associato *
          </label>
          <select
            name="pcId"
            required
            defaultValue={initialData?.pcId || defaultPcId || ""}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
          >
            <option value="">-- Seleziona un PC dal catalogo --</option>
            {availablePcs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} - {p.modelName} ({p.id})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Titolo Recensione *
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={initialData?.title || ""}
              placeholder="es. Megaport PC Gaming (Intel Core i7 4ª Gen + GTX 1650 4GB)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Slug URL (Univoco) *
            </label>
            <input
              type="text"
              name="slug"
              required
              defaultValue={initialData?.slug || ""}
              placeholder="es. megaport-pc-gaming-i7-4770-gtx-1650"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Meta Title (SEO)
            </label>
            <input
              type="text"
              name="metaTitle"
              defaultValue={initialData?.metaTitle || ""}
              placeholder="Titolo ottimizzato per i motori di ricerca"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Meta Description (SEO)
            </label>
            <input
              type="text"
              name="metaDescription"
              defaultValue={initialData?.metaDescription || ""}
              placeholder="Descrizione sintetica per i risultati di Google"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 2: VERDETTO E LIVELLO DELLE PROVE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          2. Verdetto Editoriale e Base Informativa
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Verdetto Principale Standardizzato *
            </label>
            <select
              name="verdict"
              required
              defaultValue={initialData?.verdict || "sconsigliato"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white font-bold font-mono"
            >
              {Object.entries(SITE_CONFIG.verdicts).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} ({item.description})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Livello delle Prove *
            </label>
            <select
              name="evidenceLevel"
              required
              defaultValue={initialData?.evidenceLevel || "verifica_indipendente"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              {Object.entries(SITE_CONFIG.evidenceLevels).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} — {item.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Sintesi Iniziale (Minimo 20 caratteri) *
          </label>
          <textarea
            name="summaryIntro"
            rows={2}
            required
            defaultValue={initialData?.summaryIntro || ""}
            placeholder="Riassunto in poche righe: per chi è adatto il PC e per chi è assolutamente sconsigliato..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Perché ha tante recensioni positive su Amazon?
          </label>
          <textarea
            name="whyPositiveReviews"
            rows={2}
            defaultValue={initialData?.whyPositiveReviews || ""}
            placeholder="Spiega l'impatto iniziale: es. case con luci RGB scenografiche e avvio SSD rapido nei primi giorni..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
          />
        </div>
      </div>

      {/* SEZIONE 3: PUNTI DI FORZA E LIMITI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          3. Punti di Forza e Limiti Hardware (1 per riga)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Punti di Forza * (1 per riga)
            </label>
            <textarea
              name="strengths"
              rows={4}
              required
              defaultValue={strengthsText}
              placeholder="Case con buona ventilazione&#10;SSD NVMe reattivo&#10;Consumi energetici ridotti"
              className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/20 text-xs focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-red-800">
              Limiti e Punti Deboli * (1 per riga)
            </label>
            <textarea
              name="weaknesses"
              rows={4}
              required
              defaultValue={weaknessesText}
              placeholder="CPU datata del 2013&#10;RAM in canale singolo&#10;Alimentatore generico senza certificazioni"
              className="w-full px-3 py-2 rounded-xl border border-red-300 bg-red-50/20 text-xs focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 4: SEMAFORO STANDARD SUI 3 AMBITI D'USO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          4. Semaforo Standard sui 3 Ambiti d'Uso
        </h2>

        {/* 1. GAMING */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
              <span className="text-lg" aria-hidden="true">🎮</span> 1. Gaming (1080p Reale, VRAM, DLSS/FSR)
            </span>
            <select
              name="ratingGaming"
              defaultValue={initialData?.ratingGaming || "non_adatto"}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold font-mono bg-white"
            >
              <option value="idoneo">IDONEO</option>
              <option value="limitato">LIMITATO</option>
              <option value="non_adatto">NON ADATTO</option>
            </select>
          </div>
          <input
            type="text"
            name="notesGaming"
            defaultValue={initialData?.notesGaming || ""}
            placeholder="es. Max 720p instabile (<30 FPS) • 4GB VRAM insufficienti"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-brand"
          />
        </div>

        {/* 2. LAVORO & CAD */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
              <span className="text-lg" aria-hidden="true">💼</span> 2. Lavoro, CAD & Video (CUDA, Revit, Blender)
            </span>
            <select
              name="ratingWork"
              defaultValue={initialData?.ratingWork || "non_adatto"}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold font-mono bg-white"
            >
              <option value="idoneo">IDONEO</option>
              <option value="limitato">LIMITATO</option>
              <option value="non_adatto">NON ADATTO</option>
            </select>
          </div>
          <input
            type="text"
            name="notesWork"
            defaultValue={initialData?.notesWork || ""}
            placeholder="es. Idoneo 2D • Inadatto 3D e rendering video pesante"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-brand"
          />
        </div>

        {/* 3. STUDIO & OFFICE */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
              <span className="text-lg" aria-hidden="true">🎓</span> 3. Studio & Ufficio (Office, AV1, Win 11)
            </span>
            <select
              name="ratingOffice"
              defaultValue={initialData?.ratingOffice || "idoneo"}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold font-mono bg-white"
            >
              <option value="idoneo">IDONEO</option>
              <option value="limitato">LIMITATO</option>
              <option value="non_adatto">NON ADATTO</option>
            </select>
          </div>
          <input
            type="text"
            name="notesOffice"
            defaultValue={initialData?.notesOffice || ""}
            placeholder="es. Fluido per Office e navigazione • Windows 11 nativo"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-brand"
          />
        </div>
      </div>

      {/* SEZIONE 5: VALUTAZIONE ECONOMICA E STATO PUBBLICAZIONE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          5. Valutazione Economica e Flusso Editoriale
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Prezzo Rilevato Inserzione (€)
            </label>
            <input
              type="number"
              step="0.01"
              name="amazonListingPriceEur"
              defaultValue={initialData?.amazonListingPriceEur ?? ""}
              placeholder="es. 489.00"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Valore Hardware Congruo Stimato (€)
            </label>
            <input
              type="number"
              step="0.01"
              name="estimatedFairValueEur"
              defaultValue={initialData?.estimatedFairValueEur ?? ""}
              placeholder="es. 140.00"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="space-y-1 w-full sm:w-auto">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Stato Editoriale Recensione
            </label>
            <select
              name="status"
              defaultValue={initialData?.status || "draft"}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white font-bold"
            >
              <option value="draft">Bozza (Salvataggio provvisorio)</option>
              <option value="in_review">In Revisione interna</option>
              <option value="published">Pubblica Online</option>
              <option value="archived">Archiviata</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/admin/reviews"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">save</span>
              <span>{isPending ? "Salvataggio..." : isEditing ? "Salva Modifiche" : "Salva Recensione"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
