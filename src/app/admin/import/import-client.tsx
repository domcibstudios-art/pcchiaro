"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseAmazonInputAction, saveImportedPackageAction } from "./actions";
import { ExtractedHardwarePackage } from "@/lib/amazon-extractor";
import VerdictBadge from "@/components/public/verdict-badge";

export default function ImportClient() {
  const router = useRouter();

  // Stato input iniziale
  const [activeTab, setActiveTab] = useState<"url" | "text" | "json">("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [jsonInput, setJsonInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dati estratti pronti per la revisione
  const [extractedData, setExtractedData] = useState<ExtractedHardwarePackage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ reviewId: string; slug: string } | null>(null);

  // Esegue l'estrazione iniziale
  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    const input = activeTab === "url" ? urlInput : activeTab === "text" ? textInput : jsonInput;
    const mode = activeTab === "url" ? "url" : activeTab === "text" ? "text_or_html" : "json";

    const res = await parseAmazonInputAction(input, mode);
    setIsLoading(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || "Impossibile analizzare i dati inseriti.");
      return;
    }

    setExtractedData(res.data);
  }

  // Gestione caricamento file JSON locale
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setActiveTab("json");
    };
    reader.readAsText(file);
  }

  // Salva il pacchetto completo nel database SQLite
  async function handleSave() {
    if (!extractedData) return;
    setIsSaving(true);
    setErrorMsg(null);

    const res = await saveImportedPackageAction(extractedData);
    setIsSaving(false);

    if (!res.success) {
      setErrorMsg(res.error || "Errore durante il salvataggio.");
      return;
    }

    setSuccessInfo({
      reviewId: res.reviewId || "",
      slug: res.slug || "",
    });
  }

  return (
    <div className="space-y-8">
      {/* SELEZIONE MODALITÀ DI INSERIMENTO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-headline font-bold text-lg text-slate-900">
            Sorgente Dati Inserzione Amazon.it
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Scegli come fornire i dati dell&apos;inserzione. Il sistema estrarrà automaticamente la configurazione tecnica, le fonti e genererà una bozza di recensione.
          </p>
        </div>

        {/* Tab di selezione */}
        <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setErrorMsg(null);
            }}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "url"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">link</span>
            Link Diretto Amazon
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("text");
              setErrorMsg(null);
            }}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "text"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">code</span>
            Incolla HTML o Testo
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("json");
              setErrorMsg(null);
            }}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "json"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">upload_file</span>
            Carica Pacchetto JSON
          </button>
        </div>

        {/* Form di input */}
        <form onSubmit={handleExtract} className="space-y-4">
          {activeTab === "url" && (
            <div>
              <label htmlFor="urlInput" className="block text-xs font-semibold text-slate-700 mb-1">
                URL dell&apos;inserzione Amazon.it:
              </label>
              <div className="flex gap-2">
                <input
                  id="urlInput"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.amazon.it/dp/B0..."
                  required
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                💡 Se Amazon restituisce un controllo CAPTCHA temporaneo, usa la scheda &ldquo;Incolla HTML o Testo&rdquo;.
              </p>
            </div>
          )}

          {activeTab === "text" && (
            <div>
              <label htmlFor="textInput" className="block text-xs font-semibold text-slate-700 mb-1">
                Incolla il codice HTML o il testo della scheda tecnica Amazon:
              </label>
              <textarea
                id="textInput"
                rows={6}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Incolla qui il testo dell'inserzione, la tabella 'Dettagli tecnici' o il codice sorgente della pagina salvata..."
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          {activeTab === "json" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Carica file .json estratto tramite CLI (`extract-amazon.ts`):
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-hover cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="jsonInput" className="block text-xs font-semibold text-slate-700 mb-1">
                  Oppure incolla il contenuto JSON grezzo:
                </label>
                <textarea
                  id="jsonInput"
                  rows={4}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"pc": {...}, "review": {...}, "sources": [...]}'
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-700 text-lg shrink-0 mt-0.5" aria-hidden="true">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[44px] px-6 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover active:scale-95 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                {isLoading ? "hourglass_empty" : "auto_fix_high"}
              </span>
              <span>{isLoading ? "Analisi ed Estrazione in corso..." : "Analizza ed Estrai Specifiche"}</span>
            </button>

            {extractedData && (
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Cancella e ricomincia
              </button>
            )}
          </div>
        </form>
      </div>

      {/* NOTIFICA SUCCESSO SALVATAGGIO */}
      {successInfo && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
            <span className="material-symbols-outlined text-emerald-600 text-2xl" aria-hidden="true">
              check_circle
            </span>
            Importazione Completata con Successo!
          </div>
          <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
            Il PC, la bozza di recensione, le fonti e l&apos;offerta sono stati salvati nel database SQLite con stato <strong>BOZZA (draft)</strong>. Nulla è stato ancora pubblicato sul sito pubblico.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/admin/reviews/${successInfo.reviewId}/edit`}
              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">edit</span>
              <span>Revisiona e Rifinisci Recensione Bozza</span>
            </Link>
            <Link
              href={`/admin/reviews/${successInfo.reviewId}/preview`}
              className="min-h-[44px] px-5 rounded-xl border border-emerald-300 bg-white text-emerald-900 font-semibold text-xs sm:text-sm hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">visibility</span>
              <span>Anteprima Scheda Editoriale</span>
            </Link>
          </div>
        </div>
      )}

      {/* ANTEPRIMA COMPLETA DEL PACCHETTO ESTRATTO (MODIFICABILE DALL'ADMIN) */}
      {extractedData && !successInfo && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-headline font-bold text-xl text-slate-900">
                Revisione Pacchetto Estratto (Bozza)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controlla o modifica i campi prima di salvarli nel database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="min-h-[44px] px-6 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                {isSaving ? "hourglass_empty" : "save"}
              </span>
              <span>{isSaving ? "Salvataggio..." : "Salva Tutto come Bozza"}</span>
            </button>
          </div>

          {/* 1. SEZIONE SCHEDA TECNICA PC */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-xl" aria-hidden="true">memory</span>
                1. Scheda Sintetica Hardware (PC)
              </h3>
              <span className="text-xs font-mono text-slate-400">pcs table</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand:</label>
                <input
                  type="text"
                  value={extractedData.pc.brand}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, brand: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modello:</label>
                <input
                  type="text"
                  value={extractedData.pc.modelName}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, modelName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Processore (CPU):</label>
                <input
                  type="text"
                  value={extractedData.pc.cpuModel}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, cpuModel: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Generazione CPU:</label>
                <input
                  type="text"
                  value={extractedData.pc.cpuGen || ""}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, cpuGen: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supporto Windows 11 Nativo:</label>
                <select
                  value={extractedData.pc.cpuWin11Support}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, cpuWin11Support: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value={1}>Sì (Supportato ufficialmente)</option>
                  <option value={0}>No (CPU non supportata)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheda Video (GPU):</label>
                <input
                  type="text"
                  value={extractedData.pc.gpuModel}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, gpuModel: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">VRAM GPU (GB):</label>
                <input
                  type="number"
                  value={extractedData.pc.gpuVramGb || ""}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: {
                        ...extractedData.pc,
                        gpuVramGb: e.target.value ? parseInt(e.target.value, 10) : null,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Memoria RAM (GB):</label>
                <input
                  type="number"
                  value={extractedData.pc.ramGb}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, ramGb: parseInt(e.target.value, 10) || 16 },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Canale RAM:</label>
                <select
                  value={extractedData.pc.ramChannel}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: {
                        ...extractedData.pc,
                        ramChannel: e.target.value as "single" | "dual" | "unknown",
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="dual">Dual Channel (2 banchi)</option>
                  <option value="single">Single Channel (1 banco ⚠️)</option>
                  <option value="unknown">Non verificato / Ignoto</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Storage (GB):</label>
                <input
                  type="number"
                  value={extractedData.pc.storageCapacityGb}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: {
                        ...extractedData.pc,
                        storageCapacityGb: parseInt(e.target.value, 10) || 512,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo Storage:</label>
                <select
                  value={extractedData.pc.storageType}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      pc: { ...extractedData.pc, storageType: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="NVMe">NVMe (Veloce)</option>
                  <option value="SATA_SSD">SATA SSD</option>
                  <option value="HDD">HDD Meccanico</option>
                </select>
              </div>
            </div>

            {/* Specifiche omesse */}
            {extractedData.pc.unverifiedSpecs.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-red-950">
                  <span className="material-symbols-outlined text-base text-red-700" aria-hidden="true">warning</span>
                  Componenti o omessi rilevati dal venditore:
                </span>
                <ul className="list-disc pl-5 space-y-0.5">
                  {extractedData.pc.unverifiedSpecs.map((spec, idx) => (
                    <li key={idx}>{spec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 2. SEZIONE RECENSIONE EDITORIALE BOZZA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-xl" aria-hidden="true">article</span>
                2. Recensione Editoriale (Bozza)
              </h3>
              <VerdictBadge verdict={extractedData.review.verdict} size="sm" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Titolo Recensione:</label>
                  <input
                    type="text"
                    value={extractedData.review.title}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: { ...extractedData.review, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verdetto Editoriale:</label>
                  <select
                    value={extractedData.review.verdict}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: {
                          ...extractedData.review,
                          verdict: e.target.value as ExtractedHardwarePackage["review"]["verdict"],
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="sconsigliato">SCONSIGLIATO (Trappola Hardware)</option>
                    <option value="accettabile_base">ACCETTABILE PER USO BASE</option>
                    <option value="conveniente_offerta">CONVENIENTE SOLO IN OFFERTA</option>
                    <option value="buon_acquisto">BUON ACQUISTO</option>
                    <option value="info_insufficienti">INFORMAZIONI INSUFFICIENTI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sommario Introspettivo:</label>
                <textarea
                  rows={2}
                  value={extractedData.review.summaryIntro}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      review: { ...extractedData.review, summaryIntro: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Semafori 3 utilizzi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <span>🎮</span> Gaming 1080p
                  </span>
                  <select
                    value={extractedData.review.ratingGaming}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: {
                          ...extractedData.review,
                          ratingGaming: e.target.value as "idoneo" | "limitato" | "non_adatto",
                        },
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="idoneo">IDONEO</option>
                    <option value="limitato">LIMITATO</option>
                    <option value="non_adatto">NON ADATTO</option>
                  </select>
                  <textarea
                    rows={2}
                    value={extractedData.review.notesGaming}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: { ...extractedData.review, notesGaming: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <span>💼</span> Lavoro &amp; CAD
                  </span>
                  <select
                    value={extractedData.review.ratingWork}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: {
                          ...extractedData.review,
                          ratingWork: e.target.value as "idoneo" | "limitato" | "non_adatto",
                        },
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="idoneo">IDONEO</option>
                    <option value="limitato">LIMITATO</option>
                    <option value="non_adatto">NON ADATTO</option>
                  </select>
                  <textarea
                    rows={2}
                    value={extractedData.review.notesWork}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: { ...extractedData.review, notesWork: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <span>🎓</span> Studio &amp; Ufficio
                  </span>
                  <select
                    value={extractedData.review.ratingOffice}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: {
                          ...extractedData.review,
                          ratingOffice: e.target.value as "idoneo" | "limitato" | "non_adatto",
                        },
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="idoneo">IDONEO</option>
                    <option value="limitato">LIMITATO</option>
                    <option value="non_adatto">NON ADATTO</option>
                  </select>
                  <textarea
                    rows={2}
                    value={extractedData.review.notesOffice}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        review: { ...extractedData.review, notesOffice: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. SEZIONE FONTI VERIFICATE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-xl" aria-hidden="true">menu_book</span>
              3. Fonti Informative Collegate ({extractedData.sources.length})
            </h3>
            <div className="space-y-2">
              {extractedData.sources.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800">{s.sourceName}</span>
                    <span className="ml-2 font-mono text-[10px] uppercase px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">
                      {s.sourceType}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.notes}</p>
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline text-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Vedi URL</span>
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">open_in_new</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. SEZIONE OFFERTA COMMERCIALE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-xl" aria-hidden="true">shopping_cart</span>
              4. Offerta Commerciale Amazon
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ASIN:</label>
                <input
                  type="text"
                  value={extractedData.offer.asin || ""}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      offer: { ...extractedData.offer, asin: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prezzo Indicativo (€):</label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.offer.priceAmountEur || ""}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      offer: {
                        ...extractedData.offer,
                        priceAmountEur: e.target.value ? parseFloat(e.target.value) : null,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Affiliato:</label>
                <input
                  type="text"
                  value={extractedData.offer.affiliateUrl}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      offer: { ...extractedData.offer, affiliateUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* PULSANTE FINALE SALVATAGGIO BOZZA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Salva contemporaneamente: PC in `pcs`, Recensione in `reviews` (bozza), Fonti in `sources` e Offerta in `price_offers`.
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                {isSaving ? "hourglass_empty" : "save"}
              </span>
              <span>{isSaving ? "Salvataggio in corso..." : "Salva Tutto come Bozza nel Catalogo"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
