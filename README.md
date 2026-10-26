# PCChiaro.it — Piattaforma Indipendente di Recensioni Hardware & Analisi PC Preassemblati

> **La chiarezza sull'hardware prima di comprare.**  
> Portale indipendente e conforme alle normative di affiliazione per analizzare le schede tecniche dei PC preassemblati più venduti su Amazon.it, smontare le trappole commerciali e guidare l'utente all'acquisto consapevole tramite alternative curate manualmente.

---

## 1. Obiettivi e Modello Editoriale

PCChiaro.it risponde all'esigenza di verificare in modo oggettivo cosa si nasconde dietro ai titoli altisonanti dei PC desktop venduti online:
- **Nessuna raccomandazione automatica o da AI generativa:** ogni recensione, verdetto e collegamento ad alternative è inserito, verificato e approvato manualmente dal titolare editoriale.
- **5 Livelli di Verdetto Standardizzati:**
  1. `SCONSIGLIATO`: configurazione inadeguata all'uso dichiarato o al prezzo.
  2. `ACCETTABILE PER USO BASE`: valido per navigazione, documenti e ufficio leggero.
  3. `CONVENIENTE SOLO IN OFFERTA`: valido solo sotto una determinata soglia di prezzo.
  4. `BUON ACQUISTO`: configurazione equilibrata e raccomandabile per l'uso specificato.
  5. `INFORMAZIONI INSUFFICIENTI`: dati tecnici non verificabili o omessi dal venditore.
- **3 Basi Informative Esplicite:**
  - `Specifiche dichiarate`
  - `Verifica indipendente` (datasheet ufficiali Intel/AMD/NVIDIA e benchmark pubblici accreditati)
  - `Test diretto` (esplicito disclaimer: *nessun test fisico di laboratorio* salvo ove specificato)
- **Semaforo d'uso standardizzato a 3 ambiti:**
  - 🎮 *Gaming 1080p Reale* (VRAM dedicata $\ge 6\text{-}8\text{GB}$, supporto DLSS/FSR)
  - 💼 *Lavoro & CAD* (Accelerazione CUDA, RAM Dual Channel)
  - 🎓 *Studio & Ufficio* (Decodifica hardware AV1, supporto nativo Windows 11)
- **Conformità Normativa Amazon Associates & Legge 145/2018:**
  - I prezzi statici in Euro sono **nascosti di default** sul frontend pubblico per rispettare la policy Amazon sui prezzi statici privi di API in tempo reale.
  - Al loro posto viene mostrata la call-to-action conforme: *"Controlla il prezzo su Amazon.it"*.
  - Un toggle a 1-clic nel pannello amministrativo (`/admin/prices`) permette di attivare/disattivare la visualizzazione dei prezzi in qualsiasi momento.

---

## 2. Stack Tecnologico

- **Frontend & Server Framework:** Next.js 15 (App Router con React 19 e Server Actions)
- **Linguaggio:** TypeScript (strict mode)
- **Stile & Design System:** Tailwind CSS nativo (Palette Blu Cobalto `#1d4ed8`, font *Inter*, *Hanken Grotesk* e *JetBrains Mono*)
- **Database:** SQLite su filesystem persistente con driver nativo `better-sqlite3` (modalità WAL attiva)
- **ORM & Migrazioni:** Drizzle ORM + Drizzle Kit
- **Validazione:** Zod schemas
- **Sicurezza & Autenticazione:** Hash Scrypt con salt crittografico, token di sessione firmati HMAC-SHA256, cookie `HttpOnly` / `SameSite=Lax`, protezione brute-force con blocco IP (5 tentativi / 15 min).

---

## 3. Struttura del Progetto

```
├── data/
│   └── pcchiaro.db            # Database SQLite locale con WAL abilitato
├── public/                    # Risorse statiche
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage pubblica (Hero, filtri, feed, autodifesa)
│   │   ├── layout.tsx         # Root layout con Google Fonts e CSS globale
│   │   ├── globals.css        # Stili base, reset e outline accessibile WCAG
│   │   ├── metodo/            # Pagina pubblica su metodo, verdetti e 10 segnali d'allarme
│   │   ├── recensioni/[slug]/ # Scheda recensione completa con specifiche, alternative e fonti
│   │   ├── sitemap.ts         # Sitemap dinamica XML per motori di ricerca
│   │   ├── robots.ts          # Direttive robots.txt (esclude /admin/)
│   │   └── admin/             # Area Amministrativa protetta
│   │       ├── login/         # Form di autenticazione con rate limiting
│   │       ├── pcs/           # Gestione catalogo hardware PC (CRUD)
│   │       ├── reviews/       # Gestione recensioni editoriali e verdetti (CRUD + preview)
│   │       ├── alternatives/  # Gestione alternative curate e approvazione (CRUD)
│   │       ├── prices/        # Gestione offerte affiliate e toggle conformità Amazon
│   │       └── sources/       # Gestione fonti e benchmark consultati (CRUD)
│   ├── components/
│   │   ├── public/            # Header, Footer, BottomNav, ReviewCard, Badges, Filtri
│   │   └── admin/             # AdminHeader, DeleteButton client component
│   ├── config/
│   │   └── site.ts            # Configurazione centralizzata (brand, tassonomie, disclaimers)
│   ├── db/
│   │   ├── schema.ts          # Tabelle Drizzle SQLite
│   │   ├── index.ts           # Connessione better-sqlite3 e client Drizzle
│   │   ├── migrate.ts         # Runner migrazioni SQL
│   │   ├── seed.ts            # Dati dimostrativi iniziali (PC, recensioni, offerte, fonti)
│   │   └── migrations/        # File SQL versionati generati da drizzle-kit
│   ├── lib/
│   │   ├── auth.ts            # Scrypt password hashing & verifica
│   │   ├── session.ts         # HMAC token creation, cookie management & verify
│   │   ├── settings.ts        # Gestione site_settings (toggle prezzi Amazon)
│   │   └── validations.ts     # Schema di validazione Zod per form e API
│   └── tests/                 # Suite di test automatizzati (Node test runner + tsx)
├── .env.example               # Template variabili d'ambiente
└── package.json
```

---

## 4. Installazione e Avvio Locale

### Prerequisiti
- **Node.js** v20.x o superiore
- **npm** v10.x o superiore

### 1. Clona il repository e installa le dipendenze
```bash
git clone <URL_REPO>
cd "sito recensioni pc"
npm install
```

### 2. Configura le variabili d'ambiente
Copia il template `.env.example` in `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Esegui le migrazioni e il seed del database
```bash
npm run db:migrate
npm run db:seed
```

### 4. Avvia il server di sviluppo
```bash
npm run dev
```
L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000).

---

## 5. Credenziali Amministrative & Configurazione Produzione

### Credenziali predefinite in ambiente di sviluppo:
- **URL Login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Username:** `admin`
- **Password:** `admin12345`

### Procedura per impostare una password personalizzata in produzione:
1. Genera un hash Scrypt per la tua nuova password con questo comando Node:
   ```bash
   node -e "const crypto=require('crypto'); const salt=crypto.randomBytes(16).toString('hex'); crypto.scrypt('TUA_NUOVA_PASSWORD_SICURA', salt, 64, (err, key) => console.log(salt + ':' + key.toString('hex')))"
   ```
2. Genera un segreto crittografico casuale di almeno 32 caratteri per la firma delle sessioni:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Inserisci i valori risultanti nel file `.env.local`:
   ```ini
   ADMIN_USERNAME="tuo_username_amministratore"
   ADMIN_PASSWORD_HASH="salt_generato:derived_key_generata"
   SESSION_SECRET="stringa_segreta_generata_di_almeno_32_caratteri"
   SECURE_COOKIE="true"
   ```

---

## 6. Guida al Deployment & Backup SQLite

### Requisito Fondamentale: Storage Persistente
Il database SQLite risiede su file (`data/pcchiaro.db`).  
Nel deployment su server o container (es. VPS Hetzner, Docker, Railway, Fly.io, Render con Persistent Disk), **la directory `data/` deve risiedere su un volume persistente montato**, non su un filesystem effimero di tipo serverless senza disco permanente.

### Procedura di Backup di Sicurezza SQLite
Poiché SQLite è in modalità WAL (*Write-Ahead Logging*), per eseguire un backup affidabile a caldo senza bloccare le letture degli utenti, esegui:
```bash
# Esempio backup locale o da cron job:
sqlite3 data/pcchiaro.db ".backup 'data/backups/pcchiaro-backup-$(date +%Y%m%d_%H%M%S).db'"
```

---

## 7. Esecuzione dei Test Automatizzati

Il progetto include **23 test automatizzati** che coprono l'intero stack:
- Validazioni Zod dei dati hardware ed editoriali
- Integrità referenziale SQLite (`ON DELETE CASCADE`, `ON DELETE RESTRICT`)
- Hashing Scrypt e firma HMAC dei cookie di sessione
- Rifiuto attacchi brute-force e token manomessi
- Flusso CRUD PC, bozza, pubblicazione e ritiro recensione
- Divieto di auto-raccomandazione e isolamento alternative non approvate
- Toggle conformità prezzi Amazon a 1 clic

Per eseguire tutti i test:
```bash
npm test
```

Per verificare la build di produzione completa:
```bash
npm run build
```

---

## 8. Licenza e Note Legali
Progetto sviluppato ad uso editoriale indipendente.  
Tutti i marchi citati (Intel, AMD, NVIDIA, Microsoft, Amazon) appartengono ai rispettivi proprietari e sono impiegati esclusivamente per finalità descrittive e di verifica tecnica. Conforme alla Legge 145/2018 sulla trasparenza commerciale digitale.
