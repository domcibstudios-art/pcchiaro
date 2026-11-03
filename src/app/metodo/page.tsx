import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";
import BottomNav from "@/components/public/bottom-nav";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://pcchiaro.domcibstudios.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Metodo Editoriale & Criteri di Verifica | PCChiaro.it",
  description:
    "Scopri come analizziamo i PC preassemblati su Amazon.it: i 5 livelli di verdetto, le basi informative e i 10 segnali d'allarme per smontare le trappole hardware.",
  alternates: {
    canonical: "/metodo",
  },
};

export default function MetodoPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 space-y-12 w-full">
        {/* HERO METODO */}
        <header className="space-y-4 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-brand">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              fact_check
            </span>
            Trasparenza Editoriale &amp; Deontologia
          </div>
          <h1 className="font-headline font-extrabold text-3xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Il Nostro Metodo di Verifica Hardware
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            PCChiaro.it è un progetto editoriale indipendente nato per tutelare gli acquirenti di PC preassemblati su Amazon.it. Non accettiamo prodotti gratuiti da venditori, non pubblichiamo contenuti sponsorizzati e basiamo ogni verdetto su dati tecnici verificabili e benchmark di settore.
          </p>
        </header>

        {/* DICHIARAZIONE TRASPARENZA LABORATORIO */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-xs sm:text-sm text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-base">
            <span className="material-symbols-outlined text-amber-700 text-2xl" aria-hidden="true">
              info
            </span>
            Dichiarazione Esplicita sui Test Fisici
          </div>
          <p className="leading-relaxed">
            <strong>PCChiaro.it dichiara apertamente di NON effettuare test fisici di laboratorio</strong> sulle configurazioni recensite, salvo dove espressamente indicato come &ldquo;Test diretto&rdquo;. Le nostre verifiche si basano sull&apos;incrocio delle schede tecniche ufficiali rilasciate dai produttori di componenti (Intel, AMD, NVIDIA, Crucial, Kingston, ecc.), sui benchmark indipendenti pubblici universalmente accreditati (Geekbench, Cinebench, 3DMark, PassMark) e sull&apos;analisi delle normative di compatibilità dei sistemi operativi.
          </p>
        </section>

        {/* I 5 LIVELLI DI VERDETTO */}
        <section id="verdetti" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-headline font-bold text-2xl text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
                balance
              </span>
              I 5 Livelli Standardizzati di Verdetto
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ogni recensione si conclude con uno dei seguenti 5 giudizi univoci, non negoziabili:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.values(SITE_CONFIG.verdicts).map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${v.badgeClass}`}
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">
                      {v.icon}
                    </span>
                    {v.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Codice: {v.id}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* I 3 LIVELLI DI PROVA */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-headline font-bold text-2xl text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
                verified
              </span>
              I 3 Livelli di Base Informativa (Prove)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ogni scheda recensione dichiara in modo trasparente la natura delle informazioni utilizzate:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.values(SITE_CONFIG.evidenceLevels).map((e) => (
              <div
                key={e.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-brand block uppercase tracking-wider mb-1">
                    {e.label}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {e.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* I 10 SEGNALI D'ALLARME */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-headline font-bold text-2xl text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-2xl" aria-hidden="true">
                warning
              </span>
              I 10 Segnali d&apos;Allarme che Attivano la Nostra Analisi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Un PC preassemblato viene selezionato e analizzato prioritariamente se presenta 3 o più di queste criticità:
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <ol className="list-decimal pl-5 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <li>
                <strong>CPU vecchia spacciata per recente:</strong> Intel Core di 4ª-8ª generazione (es. i7-4770, i5-6500) o AMD FX/Athlon venduti come &ldquo;PC gaming veloce di ultima generazione&rdquo;.
              </li>
              <li>
                <strong>Assenza di scheda video dedicata:</strong> utilizzo dell&apos;etichetta &ldquo;Gaming&rdquo; per macchine dotate unicamente di grafica integrata obsoleta (es. Intel HD 4600).
              </li>
              <li>
                <strong>Scheda video citata in modo ingannevole:</strong> menzione generica &ldquo;GTX&rdquo; o &ldquo;RTX&rdquo; senza modello specifico, o schede con soli 2-4GB di VRAM inadatte ai giochi moderni.
              </li>
              <li>
                <strong>RAM a singolo canale (Single Channel):</strong> un unico banco di memoria installato, che dimezza la banda passante del processore penalizzando i frame rate fino al 25%.
              </li>
              <li>
                <strong>SSD generico di marca sconosciuta:</strong> dischi a stato solido privi di cache DRAM e con celle a bassa durata, soggetti a rallentamenti termici drastici.
              </li>
              <li>
                <strong>Alimentatore omesso o non certificato:</strong> unità di potenza senza certificazione 80 Plus, potenzialmente rumorose o instabili sotto carico.
              </li>
              <li>
                <strong>Windows 11 forzato su CPU non supportata:</strong> installazione con bypass dei requisiti Microsoft TPM 2.0 / Secure Boot, a rischio di interruzione degli aggiornamenti di sicurezza.
              </li>
              <li>
                <strong>Venditore terzo con storico recente:</strong> account di vendita con recensioni concentrate in poche settimane o cambi frequenti di denominazione commerciale.
              </li>
              <li>
                <strong>Recensioni positive anomale:</strong> pattern di recensioni entusiaste scritte il giorno stesso della consegna, entusiaste solo per le luci RGB del case senza aver testato carichi reali.
              </li>
              <li>
                <strong>Prezzo incoerente rispetto al valore reale:</strong> oscillazioni improvvise di listino per simulare sconti percentuali artificiosi su hardware svalutato.
              </li>
            </ol>
          </div>
        </section>

        {/* SELEZIONE EDITORIALE DELLE ALTERNATIVE */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-headline font-bold text-2xl text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-2xl" aria-hidden="true">
                thumb_up
              </span>
              Come Selezioniamo le Alternative
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Una recensione critica non ha valore pratico per l&apos;utente se non propone una soluzione migliore. Per questo motivo associamo a ogni PC recensito una o più <strong>Alternative Curate Manualmente</strong>.
            </p>
            <p>
              Ciascuna alternativa deve soddisfare requisiti rigorosi:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Piattaforma moderna con supporto garantito e nativo a Windows 11.</li>
              <li>Memoria RAM configurata in Dual Channel (almeno 2 moduli).</li>
              <li>Scheda video con VRAM e architettura adeguate alla risoluzione promessa (minimo 6-8GB per gaming 1080p).</li>
              <li>Approvazione esplicita e manuale del coordinatore editoriale prima di qualsiasi pubblicazione sul sito.</li>
            </ul>
          </div>
        </section>

        {/* CONFORMITÀ LEGALE E AFFILIAZIONE */}
        <section className="bg-slate-900 text-slate-300 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-2xl" aria-hidden="true">
              gavel
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white">
              Conformità Normativa e Trasparenza Commerciale
            </h2>
          </div>

          <p className="leading-relaxed">
            PCChiaro.it opera nel pieno rispetto della <strong>Legge 145/2018</strong> sulla trasparenza delle comunicazioni commerciali digitali e dell&apos;<strong>Amazon Associates Operating Agreement</strong>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            {SITE_CONFIG.compliance.amazonDisclosure} Nessun venditore o inserzionista può pagare per ottenere una valutazione positiva o per rimuovere una recensione sconsigliata. I nostri giudizi riguardano esclusivamente i dati oggettivi dei componenti hardware e mai le persone dei venditori.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white font-semibold text-xs sm:text-sm hover:bg-brand-hover transition-colors"
            >
              <span>Torna alle Verifiche Pubblicate</span>
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
