import Link from "next/link";
import { getAdminSession } from "@/lib/session";
import { logoutAction } from "./login/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Se non c'è sessione attiva (es. pagina di login), renderizza solo il contenuto
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      {/* Top Navbar dell'Amministrazione */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-brand-light text-2xl" aria-hidden="true">
                admin_panel_settings
              </span>
              <span className="font-headline font-bold text-lg tracking-tight text-white">
                PCChiaro <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand text-white">ADMIN</span>
              </span>
            </Link>

            {/* Navigazione Principale Admin */}
            <nav className="hidden lg:flex items-center gap-1 font-medium text-xs">
              <Link
                href="/admin"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
                Dashboard
              </Link>
              <Link
                href="/admin/pcs"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">devices</span>
                Catalogo PC
              </Link>
              <Link
                href="/admin/reviews"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">rate_review</span>
                Recensioni
              </Link>
              <Link
                href="/admin/alternatives"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">compare_arrows</span>
                Alternative
              </Link>
              <Link
                href="/admin/prices"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">sell</span>
                Prezzi & Link
              </Link>
              <Link
                href="/admin/sources"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">menu_book</span>
                Fonti
              </Link>
              <Link
                href="/admin/import"
                className="px-3 py-2 rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">auto_fix_high</span>
                Importa da Amazon
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">open_in_new</span>
              <span className="hidden sm:inline">Vedi Sito</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-red-300 hover:text-white hover:bg-red-950/60 border border-red-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                title="Disconnetti sessione"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">logout</span>
                <span>Esci</span>
              </button>
            </form>
          </div>
        </div>

        {/* Barra di Navigazione Mobile per Admin */}
        <div className="lg:hidden border-t border-slate-800 px-4 py-2 flex gap-2 overflow-x-auto text-xs">
          <Link href="/admin" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white shrink-0">
            Dashboard
          </Link>
          <Link href="/admin/pcs" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white shrink-0">
            Catalogo PC
          </Link>
          <Link href="/admin/reviews" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white shrink-0">
            Recensioni
          </Link>
          <Link href="/admin/alternatives" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white shrink-0">
            Alternative
          </Link>
          <Link href="/admin/prices" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white shrink-0">
            Prezzi & Link
          </Link>
          <Link href="/admin/sources" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white shrink-0">
            Fonti
          </Link>
        </div>
      </header>

      {/* Contenuto Principale Admin */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
