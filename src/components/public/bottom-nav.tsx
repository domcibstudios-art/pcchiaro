"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isMetodo = pathname === "/metodo";

  return (
    <nav
      aria-label="Navigazione Rapida Mobile"
      className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center px-2 py-1.5 md:hidden"
    >
      <Link
        href="/#feed"
        className={`flex flex-col items-center justify-center p-1.5 min-w-[64px] min-h-[48px] ${
          isHome ? "text-brand" : "text-slate-500 hover:text-brand"
        }`}
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          feed
        </span>
        <span className="text-[11px] font-semibold">Verifiche</span>
      </Link>

      <Link
        href="/#esigenze"
        className="flex flex-col items-center justify-center p-1.5 min-w-[64px] min-h-[48px] text-slate-500 hover:text-brand"
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          tune
        </span>
        <span className="text-[11px] font-semibold">Esigenze</span>
      </Link>

      <Link
        href="/#autodifesa"
        className="flex flex-col items-center justify-center p-1.5 min-w-[64px] min-h-[48px] text-slate-500 hover:text-brand"
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          shield
        </span>
        <span className="text-[11px] font-semibold">Autodifesa</span>
      </Link>

      <Link
        href="/metodo"
        className={`flex flex-col items-center justify-center p-1.5 min-w-[64px] min-h-[48px] ${
          isMetodo ? "text-brand" : "text-slate-500 hover:text-brand"
        }`}
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          menu_book
        </span>
        <span className="text-[11px] font-semibold">Metodo</span>
      </Link>
    </nav>
  );
}
