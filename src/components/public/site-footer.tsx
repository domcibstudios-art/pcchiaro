import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4 mt-16 text-xs border-t border-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
              verified_user
            </span>
            <span className="font-headline font-bold text-lg text-white">
              PCChiaro<span className="text-brand">.it</span>
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {SITE_CONFIG.compliance.lawReference}
          </span>
        </div>

        {/* Amazon Disclosure & Editorial Independence */}
        <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <p className="text-slate-300 leading-relaxed max-w-3xl font-medium">
            <strong>Trasparenza Affiliazione:</strong> {SITE_CONFIG.compliance.amazonDisclosure}
          </p>
          <p className="text-slate-400 leading-relaxed max-w-3xl">
            <strong>Indipendenza Editoriale:</strong> {SITE_CONFIG.compliance.editorialIndependence}
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed max-w-3xl">
            {SITE_CONFIG.pricing.realtimeDisclaimer}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-slate-400 font-mono">
          <Link href="/metodo" className="hover:text-white transition-colors">
            Metodo Editoriale &amp; Criteri
          </Link>
          <Link href="/#autodifesa" className="hover:text-white transition-colors">
            Guida Autodifesa Hardware
          </Link>
          <Link href="/#feed" className="hover:text-white transition-colors">
            Verifiche Recenti
          </Link>
          <Link href="/admin" className="hover:text-white transition-colors">
            Accesso Redazione
          </Link>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-slate-800 text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} {SITE_CONFIG.name} &bull; Tutti i diritti riservati. Selezione autonoma delle inserzioni.</span>
          <span className="font-mono text-[11px]">Nessun test fisico di laboratorio, solo analisi verificata di specifiche e benchmark.</span>
        </div>
      </div>
    </footer>
  );
}
