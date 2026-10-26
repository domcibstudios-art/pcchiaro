"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";

export default function SiteHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    }

    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* BANNER TRASPARENZA METODO (NO LABORATORIO) */}
      <aside
        aria-label="Trasparenza Editoriale"
        className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-center text-xs text-slate-700"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
          <span className="material-symbols-outlined text-brand text-base" aria-hidden="true">
            fact_check
          </span>
          <span>
            <strong>{SITE_CONFIG.compliance.methodBannerText}</strong>
          </span>
        </div>
      </aside>

      {/* HEADER PRINCIPALE */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group min-h-[48px] items-center"
            aria-label="PCChiaro.it Home"
          >
            <span className="material-symbols-outlined text-brand text-3xl" aria-hidden="true">
              verified_user
            </span>
            <div>
              <span className="font-headline font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand transition-colors">
                PCChiaro<span className="text-brand">.it</span>
              </span>
              <p className="text-[11px] font-medium text-slate-500 leading-none hidden sm:block">
                {SITE_CONFIG.tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Menu Desktop" className="hidden md:flex items-center gap-1 font-medium text-sm">
            <Link
              href="/#feed"
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors"
            >
              Ultime Verifiche
            </Link>
            <Link
              href="/#esigenze"
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors"
            >
              Per Esigenza
            </Link>
            <Link
              href="/#autodifesa"
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors"
            >
              Autodifesa Hardware
            </Link>
            <Link
              href="/metodo"
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors"
            >
              Metodo & Criteri
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs font-mono text-slate-500 hover:text-brand px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-1"
              title="Area riservata redazione"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">admin_panel_settings</span>
              <span>Redazione</span>
            </Link>

            {/* Hamburger Button per Mobile Drawer */}
            <button
              id="menuOpenBtn"
              aria-expanded={isDrawerOpen}
              aria-controls="mobileDrawer"
              aria-label="Apri menu di navigazione"
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* OVERLAY MOBILE */}
      <div
        id="drawerOverlay"
        onClick={() => setIsDrawerOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* MOBILE DRAWER */}
      <nav
        id="mobileDrawer"
        aria-label="Menu Mobile"
        className={`fixed top-0 right-0 z-50 w-full max-w-[340px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
              verified_user
            </span>
            <span className="font-headline font-bold text-lg text-slate-900">Menu PCChiaro</span>
          </div>
          <button
            id="menuCloseBtn"
            aria-label="Chiudi menu"
            onClick={() => setIsDrawerOpen(false)}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Vincolo Editoriale Esplicito nel Menu */}
        <div className="p-3 mx-4 my-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
          <span className="material-symbols-outlined text-base text-amber-700 mt-0.5 shrink-0" aria-hidden="true">
            info
          </span>
          <span>
            Selezione editoriale autonoma dei bestseller Amazon.{" "}
            <strong>Non si accettano sponsorizzazioni da venditori.</strong>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Cerca per Esigenza
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/?filter=gaming#feed"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="text-xl" aria-hidden="true">🎮</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Gaming & Risoluzione</div>
                    <div className="text-xs text-slate-500">Verifica 1080p reale, DLSS e VRAM</div>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="/?filter=work#feed"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="text-xl" aria-hidden="true">💼</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Lavoro, CAD & Video Editing</div>
                    <div className="text-xs text-slate-500">CUDA Core e RAM Dual Channel</div>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="/?filter=office#feed"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="text-xl" aria-hidden="true">🎓</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Studio & Ufficio</div>
                    <div className="text-xs text-slate-500">Codec AV1, Office e Windows 11 nativo</div>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="/?filter=trappole#feed"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="text-xl" aria-hidden="true">🚨</span>
                  <div>
                    <div className="text-sm font-semibold text-red-700">Trappole Rilevate</div>
                    <div className="text-xs text-slate-500">CPU obsolete spacciate per nuove</div>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Guide & Garanzia
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/#autodifesa"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-brand text-lg" aria-hidden="true">warning</span>
                  I 5 Controlli Essenziali
                </Link>
              </li>
              <li>
                <Link
                  href="/metodo"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-brand text-lg" aria-hidden="true">menu_book</span>
                  Il Nostro Metodo Editoriale
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">lock</span>
                  Area Riservata Redazione
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 text-center bg-slate-50">
          PCChiaro.it &bull; 100% Indipendente &bull; Conforme L. 145/2018
        </div>
      </nav>
    </>
  );
}
