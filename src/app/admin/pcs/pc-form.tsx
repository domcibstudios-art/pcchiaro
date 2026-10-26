"use client";

import { useActionState } from "react";
import Link from "next/link";
import { savePcAction } from "./actions";

interface PcFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function PcForm({ initialData, isEditing }: PcFormProps) {
  const [state, formAction, isPending] = useActionState(savePcAction, undefined);

  // Decodifica unverifiedSpecs se presente
  let unverifiedText = "";
  if (initialData?.unverifiedSpecs) {
    try {
      const arr = JSON.parse(initialData.unverifiedSpecs);
      if (Array.isArray(arr)) unverifiedText = arr.join("\n");
    } catch {
      unverifiedText = initialData.unverifiedSpecs;
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

      {/* SEZIONE 1: IDENTIFICAZIONE GENERALE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          1. Identificazione e Modello
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Marca / Brand *
            </label>
            <input
              type="text"
              name="brand"
              required
              defaultValue={initialData?.brand || ""}
              placeholder="es. Megaport, Ankermann, HP..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nome Modello *
            </label>
            <input
              type="text"
              name="modelName"
              required
              defaultValue={initialData?.modelName || ""}
              placeholder="es. PC Gaming Megaport Core i7"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Categoria Hardware *
            </label>
            <select
              name="category"
              required
              defaultValue={initialData?.category || "desktop_gaming"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="desktop_gaming">Desktop Gaming</option>
              <option value="desktop_office">Desktop Ufficio / Studio</option>
              <option value="mini_pc">Mini PC</option>
              <option value="laptop">Portatile / Notebook</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Configurazione Esatta Riportata nell'Inserzione *
          </label>
          <input
            type="text"
            name="exactConfig"
            required
            defaultValue={initialData?.exactConfig || ""}
            placeholder="es. Intel Core i7-4770, 16GB RAM DDR3, GTX 1650 4GB, 512GB SSD"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              URL Immagine
            </label>
            <input
              type="text"
              name="imageUrl"
              defaultValue={initialData?.imageUrl || ""}
              placeholder="https://... o /images/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Testo Alternativo (Alt Text)
            </label>
            <input
              type="text"
              name="imageAlt"
              defaultValue={initialData?.imageAlt || ""}
              placeholder="Descrizione accessibile dell'immagine"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 2: CPU E GPU */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          2. Processore (CPU) e Scheda Video (GPU)
        </h2>

        {/* CPU */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Modello CPU *
            </label>
            <input
              type="text"
              name="cpuModel"
              required
              defaultValue={initialData?.cpuModel || ""}
              placeholder="es. Intel Core i7-4770 o Ryzen 5 5600"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Generazione / Anno
            </label>
            <input
              type="text"
              name="cpuGen"
              defaultValue={initialData?.cpuGen || ""}
              placeholder="es. Haswell (4ª Gen - 2013)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Compatibilità Win 11 Ufficiale
            </label>
            <select
              name="cpuWin11Support"
              defaultValue={
                initialData?.cpuWin11Support !== undefined && initialData?.cpuWin11Support !== null
                  ? String(initialData.cpuWin11Support)
                  : ""
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="">Non verificato</option>
              <option value="1">Sì (Supportato ufficialmente)</option>
              <option value="0">No (Bypass o non supportato)</option>
            </select>
          </div>
        </div>

        {/* GPU */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Modello Scheda Video *
            </label>
            <input
              type="text"
              name="gpuModel"
              required
              defaultValue={initialData?.gpuModel || ""}
              placeholder="es. NVIDIA GTX 1650 o Radeon Vega 7"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Tipo GPU *
            </label>
            <select
              name="gpuType"
              required
              defaultValue={initialData?.gpuType || "dedicated"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="dedicated">Dedicata</option>
              <option value="integrated">Integrata nella CPU</option>
              <option value="unknown">Non chiaro / Non dichiarato</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              VRAM (GB)
            </label>
            <input
              type="number"
              name="gpuVramGb"
              defaultValue={initialData?.gpuVramGb ?? ""}
              placeholder="es. 4, 8, 12..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Upscaling / Tecnologie (DLSS, FSR, AV1)
          </label>
          <input
            type="text"
            name="gpuDlssFsr"
            defaultValue={initialData?.gpuDlssFsr || ""}
            placeholder="es. FSR supportato, No DLSS, oppure DLSS 3.5 con Frame Gen"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
          />
        </div>
      </div>

      {/* SEZIONE 3: RAM E STORAGE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          3. Memoria RAM e Archiviazione (Storage)
        </h2>

        {/* RAM */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              RAM Totale (GB) *
            </label>
            <input
              type="number"
              name="ramGb"
              required
              min="1"
              defaultValue={initialData?.ramGb || 16}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Tipo RAM
            </label>
            <select
              name="ramType"
              defaultValue={initialData?.ramType || "DDR4"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="DDR5">DDR5</option>
              <option value="DDR4">DDR4</option>
              <option value="DDR3">DDR3 (Obsoleta)</option>
              <option value="unknown">Non specificata</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Canale RAM *
            </label>
            <select
              name="ramChannel"
              defaultValue={initialData?.ramChannel || "single"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="dual">Dual Channel (Ottimale)</option>
              <option value="single">Single Channel (Banda dimezzata)</option>
              <option value="unknown">Non specificato nell'inserzione</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Velocità (MHz)
            </label>
            <input
              type="number"
              name="ramSpeedMhz"
              defaultValue={initialData?.ramSpeedMhz ?? ""}
              placeholder="es. 3200 o 1600"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>

        {/* STORAGE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Tipo Storage Primario
            </label>
            <select
              name="storageType"
              defaultValue={initialData?.storageType || "NVMe"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="NVMe">M.2 NVMe (Veloce)</option>
              <option value="SATA_SSD">SSD SATA 2.5 pollici</option>
              <option value="HDD">Disco Meccanico HDD</option>
              <option value="unknown">Non specificato</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Capacità (GB)
            </label>
            <input
              type="number"
              name="storageCapacityGb"
              defaultValue={initialData?.storageCapacityGb ?? 512}
              placeholder="es. 500, 1000..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Dettagli Storage
            </label>
            <input
              type="text"
              name="storageDetails"
              defaultValue={initialData?.storageDetails || ""}
              placeholder="es. PCIe 3.0 x4 o SATA generico"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 4: ALIMENTATORE, SCHEDA MADRE E SPECIFICHE OMESSE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-headline font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
          4. Alimentazione e Dati Omessi nell'Inserzione
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Potenza PSU (Watt)
            </label>
            <input
              type="number"
              name="psuWattage"
              defaultValue={initialData?.psuWattage ?? ""}
              placeholder="es. 400, 550..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Certificazione 80 Plus
            </label>
            <select
              name="psuRating"
              defaultValue={initialData?.psuRating || "unknown"}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white"
            >
              <option value="80+_bronze">80+ Bronze</option>
              <option value="80+_gold">80+ Gold</option>
              <option value="non_certificato">Nessuna certificazione (OEM)</option>
              <option value="unknown">Non dichiarata dal venditore</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Scheda Madre (Chipset / Formato)
            </label>
            <input
              type="text"
              name="motherboardChipset"
              defaultValue={initialData?.motherboardChipset || ""}
              placeholder="es. B450, H81 OEM..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand"
            />
          </div>
        </div>

        {/* CAMPO ESPLICITO PER COMPONENTI NON DICHIARATI */}
        <div className="space-y-1 pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-amber-600" aria-hidden="true">warning</span>
            Componenti Non Dichiarati / Dati Sconosciuti nell'Inserzione (1 per riga)
          </label>
          <p className="text-[11px] text-slate-500">
            Regola del portale: indica esplicitamente ciò che il venditore non dichiara (es. marca alimentatore, frequenza RAM, slot di espansione liberi).
          </p>
          <textarea
            name="unverifiedSpecs"
            rows={3}
            defaultValue={unverifiedText}
            placeholder="Marca alimentatore non specificata&#10;Frequenza e canale della RAM omessi&#10;Modello esatto di SSD non dichiarato"
            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/30 text-slate-900 text-xs font-mono focus:border-brand"
          />
        </div>
      </div>

      {/* SEZIONE 5: STATO EDITORIALE E SALVATAGGIO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Stato Editoriale del Prodotto
          </label>
          <select
            name="editorialStatus"
            defaultValue={initialData?.editorialStatus || "draft"}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-brand bg-white font-semibold"
          >
            <option value="draft">Bozza (Non visibile in pubblico)</option>
            <option value="published">Pubblicato (Disponibile a catalogo)</option>
            <option value="archived">Archiviato (Non più in vendita/obsoleto)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/admin/pcs"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">save</span>
            <span>{isPending ? "Salvataggio..." : isEditing ? "Aggiorna PC" : "Salva Nuovo PC"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
