"use client";

import { useState, useMemo, useEffect } from "react";
import ReviewCard, { ReviewCardItem } from "./review-card";

interface FilterFeedProps {
  items: ReviewCardItem[];
}

type FilterCategory = "all" | "gaming" | "work" | "office" | "trappole";

export default function FilterFeed({ items }: FilterFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const f = params.get("filter") as FilterCategory;
      if (f && ["all", "gaming", "work", "office", "trappole"].includes(f)) {
        setActiveFilter(f);
      }
    }
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filtro categoria
      let matchesCat = true;
      if (activeFilter === "gaming") {
        matchesCat = item.review.ratingGaming === "idoneo";
      } else if (activeFilter === "work") {
        matchesCat = item.review.ratingWork === "idoneo";
      } else if (activeFilter === "office") {
        matchesCat = item.review.ratingOffice === "idoneo";
      } else if (activeFilter === "trappole") {
        matchesCat = item.review.verdict === "sconsigliato";
      }

      if (!matchesCat) return false;

      // Filtro ricerca testuale
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textToSearch = [
          item.review.title,
          item.review.summaryIntro,
          item.pc.brand,
          item.pc.modelName,
          item.pc.cpuModel,
          item.pc.gpuModel,
          item.offer?.asin || "",
        ]
          .join(" ")
          .toLowerCase();

        return textToSearch.includes(q);
      }

      return true;
    });
  }, [items, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* FILTRI SCORREVOLI PER ESIGENZA */}
      <section id="esigenze" aria-label="Filtri per Esigenza" className="space-y-3">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          <div className="flex gap-2.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all ${
                activeFilter === "all"
                  ? "bg-brand text-white"
                  : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                apps
              </span>
              Tutti i PC ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("gaming")}
              className={`min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all ${
                activeFilter === "gaming"
                  ? "bg-brand text-white"
                  : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">🎮</span> Gaming (1080p Reale)
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("work")}
              className={`min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all ${
                activeFilter === "work"
                  ? "bg-brand text-white"
                  : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">💼</span> Lavoro &amp; CAD (Con CUDA)
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("office")}
              className={`min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all ${
                activeFilter === "office"
                  ? "bg-brand text-white"
                  : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">🎓</span> Studio &amp; Ufficio
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("trappole")}
              className={`min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all ${
                activeFilter === "trappole"
                  ? "bg-red-700 text-white"
                  : "bg-white border border-red-300 text-red-800 hover:bg-red-50"
              }`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                warning
              </span>
              Trappole Rilevate
            </button>
          </div>
        </div>

        {/* Barra di Ricerca rapida */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              search
            </span>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per modello, processore (es. i7, Ryzen), scheda video (es. GTX, RTX) o ASIN..."
            aria-label="Cerca scheda o modello"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Cancella ricerca"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                close
              </span>
            </button>
          )}
        </div>
      </section>

      {/* FEED DELLE SCHEDE VERIFICATE */}
      <section id="feed" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-headline font-bold text-2xl text-slate-900">
              Ultime Verifiche Pubblicate ({filteredItems.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Valutazione oggettiva standardizzata sui 3 ambiti d&apos;uso principali
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> IDONEO
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> LIMITATO
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> NON ADATTO
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-400" aria-hidden="true">
              filter_alt_off
            </span>
            <h3 className="text-base font-bold text-slate-800">
              Nessuna verifica trovata per i criteri selezionati
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Prova a cambiare filtro o a rimuovere il termine di ricerca inserito.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                refresh
              </span>
              Mostra tutti i PC
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) => (
              <ReviewCard key={item.review.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
