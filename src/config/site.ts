/**
 * Configurazione centralizzata del sito PCChiaro.it
 * Punto unico di verità per brand, metadati, conformità e tassonomie editoriali.
 */
export const SITE_CONFIG = {
  name: "PCChiaro.it",
  legalName: "PCChiaro",
  tagline: "La chiarezza sull'hardware prima di comprare",
  description:
    "Portale indipendente che analizza le schede tecniche dei PC preassemblati su Amazon.it per smontare le trappole commerciali e guidarti all'acquisto consapevole.",
  defaultUrl: "https://pcchiaro.it",
  locale: "it-IT",
  themeColor: "#1d4ed8", // Blu Cobalto primario

  // Conformità legale e trasparenza
  compliance: {
    lawReference: "Conforme alla Legge 145/2018 sulla trasparenza commerciale",
    amazonDisclosure:
      "In qualità di Affiliato Amazon, PCChiaro.it riceve un guadagno dagli acquisti idonei effettuati tramite i link del portale, senza alcun sovrapprezzo per l'acquirente.",
    editorialIndependence:
      "I nostri verdetti e le alternative consigliate sono selezionati ed approvati esclusivamente dalla redazione e non sono influenzati da accordi con venditori o produttori.",
    methodBannerText:
      "Metodo PCChiaro: Analisi indipendente da schede tecniche ufficiali e benchmark pubblici (Nessun test fisico di laboratorio).",
  },

  // Livelli di verdetto standardizzati (esattamente come definiti nel documento strategico)
  verdicts: {
    sconsigliato: {
      id: "sconsigliato",
      label: "SCONSIGLIATO",
      description: "Configurazione inadeguata all'uso dichiarato o al prezzo.",
      badgeClass: "bg-status-dangerBg text-status-danger border-status-dangerBorder",
      icon: "cancel",
    },
    accettabile_base: {
      id: "accettabile_base",
      label: "ACCETTABILE PER USO BASE",
      description: "Valido per navigazione, documenti e attività d'ufficio leggere, con limiti espliciti.",
      badgeClass: "bg-status-warningBg text-status-warning border-status-warningBorder",
      icon: "warning",
    },
    conveniente_offerta: {
      id: "conveniente_offerta",
      label: "CONVENIENTE SOLO IN OFFERTA",
      description: "Il prezzo di listino non è conveniente, ma l'acquisto ha senso sotto una soglia definita.",
      badgeClass: "bg-status-infoBg text-status-info border-status-infoBorder",
      icon: "info",
    },
    buon_acquisto: {
      id: "buon_acquisto",
      label: "BUON ACQUISTO",
      description: "Configurazione equilibrata e raccomandabile per il pubblico e l'uso specificato.",
      badgeClass: "bg-status-successBg text-status-success border-status-successBorder",
      icon: "verified",
    },
    info_insufficienti: {
      id: "info_insufficienti",
      label: "INFORMAZIONI INSUFFICIENTI",
      description: "Dati tecnici non verificabili o omessi dal venditore, impossibilitando un giudizio sicuro.",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      icon: "help_outline",
    },
  } as const,

  // Livelli di prova standardizzati
  evidenceLevels: {
    specifiche_dichiarate: {
      id: "specifiche_dichiarate",
      label: "Specifiche dichiarate",
      description: "Dati forniti dall'inserzione o dal produttore del componente.",
    },
    verifica_indipendente: {
      id: "verifica_indipendente",
      label: "Verifica indipendente",
      description: "Dati incrociati con fonti tecniche ufficiali e benchmark pubblici.",
    },
    test_diretto: {
      id: "test_diretto",
      label: "Test diretto",
      description: "Prodotto verificato fisicamente in laboratorio o banco di prova.",
    },
  } as const,

  // Semaforo idoneità sui 3 ambiti d'uso chiave
  usageRatings: {
    idoneo: {
      id: "idoneo",
      label: "IDONEO",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
      dotClass: "bg-emerald-600",
      icon: "check_circle",
    },
    limitato: {
      id: "limitato",
      label: "LIMITATO",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
      dotClass: "bg-amber-500",
      icon: "warning",
    },
    non_adatto: {
      id: "non_adatto",
      label: "NON ADATTO",
      badgeClass: "bg-red-100 text-red-900 border-red-300",
      dotClass: "bg-red-600",
      icon: "cancel",
    },
  } as const,
};

export type VerdictKey = keyof typeof SITE_CONFIG.verdicts;
export type EvidenceLevelKey = keyof typeof SITE_CONFIG.evidenceLevels;
export type UsageRatingKey = keyof typeof SITE_CONFIG.usageRatings;
