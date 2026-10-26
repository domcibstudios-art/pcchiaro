"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand mb-2">
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">lock</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-slate-900">
            Area Riservata Redazione
          </h1>
          <p className="text-xs text-slate-500">
            Accesso amministrativo protetto a PCChiaro.it
          </p>
        </div>

        {/* Avviso credenziali di sviluppo */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-0.5">
          <p className="font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
            Credenziali di default (Ambiente Locale):
          </p>
          <p className="text-[11px] font-mono text-blue-800">
            Username: <code>admin</code> &bull; Password: <code>admin12345</code>
          </p>
        </div>

        {/* Messaggio di Errore Accessibile */}
        {state?.error && (
          <div
            role="alert"
            className="p-3 bg-status-dangerBg border border-status-dangerBorder rounded-xl text-xs text-status-danger flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Form di Login */}
        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Nome Utente
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="admin"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-brand transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-brand transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[48px] bg-brand text-white font-semibold text-sm rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
                <span>Verifica in corso...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base" aria-hidden="true">login</span>
                <span>Accedi al Pannello</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-brand font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            Torna alla Home pubblica
          </a>
        </div>

      </div>
    </div>
  );
}
