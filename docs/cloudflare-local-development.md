# Guida allo Sviluppo Locale e Architettura Cloudflare Workers + D1 per PCChiaro

Questa guida descrive l'architettura ibrida e le procedure di sviluppo locale predisposte per il porting di **PCChiaro** su **Cloudflare Workers** con database **Cloudflare D1**, utilizzando `@opennextjs/cloudflare`.

---

## 1. Architettura del Database: Separazione Node vs Cloudflare Workers

Il codice sorgente di PCChiaro supporta una duplice modalità di esecuzione senza conflitti tra driver nativi e runtime Edge:

```
                          ┌───────────────────────────────────────┐
                          │         Applicazione PCChiaro          │
                          └───────────────────┬───────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [Cloudflare Workers Runtime]                      [Node.js / CLI / Test]
       (OpenNext / Cloudflare Context)                   (Scripts / tsx / In-Memory)
                      │                                               │
             getCloudflareContext()                              better-sqlite3
                      │                                               │
             drizzle(env.DB) (D1)                               drizzle(sqlite)
                      │                                               │
                      ▼                                               ▼
              Cloudflare D1                                      pcchiaro.db
            (.wrangler/state)                                   (File Locale)
```

### Moduli Database

1. **`src/db/node.ts` (Esclusivo per Node.js):**
   - Utilizza `better-sqlite3` per la persistenza su file (`data/pcchiaro.db`).
   - Viene utilizzato esclusivamente da CLI e script di manutenzione locale:
     - `scripts/manage-csv.ts` (import/export catalogo e PC Finder)
     - `src/db/migrate.ts` (migrazioni SQLite locali per Node)
     - `src/db/seed.ts` (popolamento seed per test locali Node)
   - **Nota:** È escluso dal bundle Workers (`serverExternalPackages: ["better-sqlite3"]` in `next.config.ts`).

2. **`src/db/index.ts` (Runtime Agnostico & Worker-Ready):**
   - Espone `getDb()`: recupera il binding `DB` request-scoped tramite `getCloudflareContext({ async: true }).env.DB`. Se il contesto Cloudflare non è presente (es. test unitari o build time), effettua un fallback trasparente su `src/db/node.ts` o sul database in-memory registrato con `setTestDb()`.
   - Espone il tipo unificato `AppDatabase = DrizzleD1Database<typeof schema>`.
   - Espone `executeBatch(db, statements)`:
     - Su Cloudflare D1: esegue `db.batch([stmt1, stmt2, ...])` che sfrutta l'API batch transazionale nativa di D1.
     - Su Node/better-sqlite3: esegue `sqlite.transaction(() => { ... })()` garantendo atomicità e rollback completo in caso di errore.
     - È stato validato con la suite di test `src/tests/batch-atomicity.test.ts`.

---

## 2. Configurazione Locale OpenNext e Wrangler

Il repository include i seguenti file di configurazione per il bundle Cloudflare:

- **`open-next.config.ts`:**
  Configura OpenNext con `defineCloudflareConfig({})`.
- **`wrangler.jsonc`:**
  - `name`: `"pcchiaro"`
  - `main`: `".open-next/worker.js"`
  - `compatibility_date`: `"2024-12-30"`
  - `compatibility_flags`: `["nodejs_compat"]`
  - `assets`: `{ "binding": "ASSETS", "directory": ".open-next/assets" }`
  - `d1_databases`: binding `DB` con `database_name: "pcchiaro-local"`, `database_id: "local-pcchiaro-db"`, `migrations_dir: "src/db/migrations"`.
- **`next.config.ts`:**
  Inizializza `initOpenNextCloudflareForDev()` per garantire l'iniezione dei binding Miniflare anche durante l'esecuzione di `next dev`.

---

## 3. Comandi di Sviluppo e Preview Locale

Tutti i comandi possono essere eseguiti localmente senza necessità di account Cloudflare o connessione a risorse remote:

### Sviluppo Standard con Next.js (Node.js)
```bash
npm run dev
```
Avvia il server Next.js su `http://localhost:3000` con accesso al database SQLite locale `data/pcchiaro.db`.

### Applicazione Migrazioni a Cloudflare D1 Locale
```bash
npm run d1:migrate:local
```
Applica i file SQL in `src/db/migrations/` all'istanza D1 locale gestita da Wrangler in `.wrangler/state/v3/d1`.

### Build del Worker OpenNext
```bash
npm run build:cf
```
Compila l'applicazione Next.js App Router e genera il bundle standalone `.open-next/worker.js` e gli asset statici in `.open-next/assets`.

### Preview Locale su Worker Cloudflare (Miniflare)
```bash
npm run preview:cf
# Oppure, se la build è già stata eseguita:
npx wrangler dev --port 8787
```
Avvia il simulatore locale di Cloudflare Workers (Miniflare) su `http://127.0.0.1:8787`, collegato al database D1 locale e ai binding configurati.

---

## 4. Popolamento Dati D1 Locale per Test

Per testare l'interfaccia con recensioni e schede tecniche sul Worker locale:
```bash
npx wrangler d1 execute DB --local --file=./data/local_d1_seed.sql
```
Verifica delle tabelle:
```bash
npx wrangler d1 execute DB --local --command="SELECT count(*) FROM reviews;"
```

---

## 5. Strategia di Caching, Workers Cache ed Invalidazione

Per operare nel piano **Workers Free** (100.000 richieste/giorno e limite di 10 ms CPU) senza superare i limiti né consumare risorse del database D1 inutilmente, il progetto adotta la seguente architettura di caching a costo zero:

### 1. Abilitazione Workers Cache in Wrangler
Nel file `wrangler.jsonc` è attivo il layer Workers Cache nativo:
```jsonc
"cache": {
  "enabled": true
}
```
Questo consente a Cloudflare di intercettare le richieste a monte dell'esecuzione del Worker anche su sottodomini `workers.dev` e domini personalizzati.

### 2. Intestazioni HTTP per Rotte Pubbliche vs Protette
In `next.config.ts` e `src/middleware.ts` sono configurati header mirati:
- **Pagine Editoriali (`/recensioni/:slug*`)**:
  - `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400`
  - `Cache-Tag: public-page,reviews,review-detail`
- **Homepage (`/`)**:
  - `Cache-Control: public, max-age=60, s-maxage=1800, stale-while-revalidate=86400`
  - `Cache-Tag: public-page,homepage,reviews`
- **Pagine Statiche (`/metodo`, `/sitemap.xml`)**:
  - `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`
- **Area Amministrativa (`/admin/:path*`)**:
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma: no-cache`
  - Applicato a doppio livello: sia in `next.config.ts` sia in `src/middleware.ts` su ogni risposta anonima o autenticata.

### 3. Strategia di Invalidazione Pubblica (`src/lib/cache-invalidation.ts`)
Quando un amministratore salva, pubblica, ritira o elimina una recensione o un'offerta prezzi, l'azione invoca:
```ts
await invalidatePublicCache({ slug: reviewSlug });
```
Questa funzione:
1. Esegue `revalidatePath` per `/recensioni/[slug]`, `/` e `/sitemap.xml`.
2. Esegue il purge puntuale tramite la Cloudflare Cache API (`caches.default.delete()`).
3. Elimina le voci per tag tramite Workers Cache (`cache.purge({ tags })`).
4. Registra l'evento per la tracciabilità nei test automatizzati (`src/tests/cache-invalidation-flow.test.ts`).

### 4. Come Verificare Headers di Cache, HTML e CPU Time in Produzione

Una volta pubblicato il Worker su Cloudflare (es. `https://pcchiaro.<tuo-subdomain>.workers.dev`), eseguire le verifiche empiriche utilizzando PowerShell (Windows) o curl:

#### A. Verifica Headers di Cache (PowerShell su Windows)

```powershell
$url = "https://tuo-worker.workers.dev/recensioni/lenovo-ideapad-slim-3-82xq00ebus-amd-ryzen-5-7520u-amd-radeo-b0f6nqfbwn"

# 1. Prima richiesta: popola la cache (atteso MISS o DYNAMIC al primo caricamento)
$res1 = Invoke-WebRequest -Uri $url -UseBasicParsing
$res1.Headers["CF-Cache-Status"]
$res1.Headers["Cache-Control"]
$res1.Headers["Age"]

# 2. Seconda richiesta immediata: verifica memorizzazione in edge cache
$res2 = Invoke-WebRequest -Uri $url -UseBasicParsing
Write-Host "CF-Cache-Status:" $res2.Headers["CF-Cache-Status"]   # Atteso: HIT se servito da cache
Write-Host "Age:"             $res2.Headers["Age"]               # Atteso: valore in secondi (> 0)
Write-Host "Cache-Control:"   $res2.Headers["Cache-Control"]     # Atteso: public, s-maxage=3600...
```

Per l'area amministrativa (verifica tassativa dell'assenza di cache):
```powershell
$adminUrl = "https://tuo-worker.workers.dev/admin/login"
$resAdmin = Invoke-WebRequest -Uri $adminUrl -UseBasicParsing
Write-Host "Admin Cache-Control:" $resAdmin.Headers["Cache-Control"] # Deve contenere 'no-store, no-cache'
Write-Host "Admin CF-Cache-Status:" $resAdmin.Headers["CF-Cache-Status"] # Atteso: DYNAMIC o BYPASS
```

#### B. Verifica Contenuto HTML Prima e Dopo una Modifica Amministrativa

Per verificare che l'invalidazione della cache funzioni end-to-end anche in produzione:

```powershell
# 1. Lettura contenuto attuale prima della modifica
$before = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
$before -match "<title>(.*?)</title>" | Out-Null
Write-Host "Titolo iniziale:" $matches[1]

# 2. Esegui la modifica nel pannello amministrativo (/admin/reviews) e salva/pubblica.
# L'azione amministrativa invoca automaticamente `invalidatePublicCache({ slug })`.

# 3. Lettura successiva dalla CDN:
$after = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
$after -match "<title>(.*?)</title>" | Out-Null
Write-Host "Titolo dopo modifica:" $matches[1]

# 4. Verifica che il contenuto sia cambiato senza dover attendere la scadenza del TTL di 1 ora
if ($matches[1] -ne $beforeTitle) {
    Write-Host "[OK] Invalidazione cache riuscita: il nuovo contenuto è già visibile." -ForegroundColor Green
} else {
    Write-Host "[ATTENZIONE] Il contenuto non si è aggiornato. Verificare l'esecuzione del purge." -ForegroundColor Yellow
}
```

> [!NOTE]
> **Differenza tra ambiente locale e remoto:**
> In ambiente locale (Miniflare/workerd su localhost), Cloudflare non emette gli header `CF-Cache-Status: HIT` o `Age` poiché la rete Anycast edge non è presente. L'effettivo comportamento `HIT` e il conteggio `Age` devono essere misurati sull'URL `workers.dev` pubblicato.

#### C. Misurazione del CPU Time Reale
1. **Tramite Cloudflare Dashboard**:
   - Accedere a *Workers & Pages > pcchiaro > Metrics > CPU time*.
   - Verificare i valori percentili `p50` e `p99`: per rimanere nel piano Workers Free, la mediana p50 deve attestarsi stabilmente sotto i 10 ms.
2. **Tramite CLI in tempo reale**:
   ```bash
   npx wrangler tail --format=json
   ```
   Ispezionare i record JSON emessi per ogni richiesta HTTP:
   `"cpuTimeMs": <valore>` (es. `"cpuTimeMs": 3.8`).
   Non assumere a priori un CPU time senza averlo monitorato durante le richieste reali.

---

## 6. Script e Pipeline CSV (PC Finder)

La pipeline editoriale di PCChiaro mantiene la separazione tra la cartella di analisi `pc_finder/` e l'applicazione web:
```bash
# Esportazione catalogo corrente in CSV
npx tsx scripts/manage-csv.ts export data/catalogo_esportato.csv

# Importazione schede da PC Finder (in bozza)
npx tsx scripts/manage-csv.ts import pc_finder/output_sito/import_schede_sito.csv

# Importazione schede direttamente pubblicate
npx tsx scripts/manage-csv.ts import pc_finder/output_sito/import_schede_sito.csv --publish
```

---

## 7. Procedura per il Futuro Deploy in Produzione (NON ESEGUITA)

*Promemoria: In questa fase non è stata creata alcuna risorsa remota né eseguito alcun comando `--remote`.*

Quando si deciderà di andare in produzione su Cloudflare:

1. **Creazione Database D1 Remoto:**
   ```bash
   npx wrangler d1 create pcchiaro-db
   ```
   Inserire il `database_id` restituito all'interno di `wrangler.jsonc` (sezione `d1_databases`).

2. **Applicazione Migrazioni sul Database Remoto:**
   ```bash
   npx wrangler d1 migrations apply DB --remote
   ```

3. **Configurazione Segreti e Variabili d'Ambiente:**
   ```bash
   npx wrangler secret put ADMIN_PASSWORD_HASH
   npx wrangler secret put ADMIN_SESSION_SECRET
   npx wrangler secret put ADMIN_USERNAME
   ```

4. **Configurazione Dominio Personalizzato (.it vs .com):**
   - **Dominio `.it` (Consigliato per pubblico italiano):** Cloudflare Registrar non supporta la registrazione diretta di domini `.it`. Acquistare il dominio su un registrar accreditato (es. Serverplan, Netsons, Aruba ~8–12 €/anno) e configurare i Name Server gratuiti di Cloudflare sul registrar.
   - **Dominio `.com`:** Può essere acquistato direttamente tramite Cloudflare Registrar al prezzo di costo all'ingrosso (~$9.77/anno).
   - Aggiungere il dominio come Custom Domain nella dashboard Cloudflare Workers.

5. **Deploy Finale:**
   ```bash
   npm run build:cf
   npx wrangler deploy
   ```
