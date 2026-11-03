# Manuale Operativo — Deploy, Rollback e Manutenzione PCChiaro

> **Progetto:** PCChiaro (Sito editoriale recensioni PC & Affiliazione)  
> **Infrastruttura:** Cloudflare Workers + Cloudflare D1 (SQL) + OpenNext  
> **URL Produzione:** [https://pcchiaro.domcibstudios.workers.dev](https://pcchiaro.domcibstudios.workers.dev)  
> **Costi:** 0 €/mese (piani gratuiti Workers Free + D1 Free)

---

## 1. Architettura di Produzione

* **Runtime:** Cloudflare Workers con compatibilità `nodejs_compat`.
* **Framework Web:** Next.js 15 (App Router) + React 19 compilato tramite `@opennextjs/cloudflare`.
* **Database:** Cloudflare D1 SQLite serverless (`pcchiaro-db`, ID: `b4054e51-a108-48cc-baef-8ea9e58cde61`).
* **Caching Edge:** Workers Cache abilitata (`"cache": { "enabled": true }`) con invalidazione globale per tag tramite `ctx.cache.purge({ tags })`.
* **Asset Statici:** Serviti direttamente da Cloudflare CDN Assets (immagini, font, CSS e JS precompilati).

---

## 2. Come viene eseguito il Deploy

Il processo di deploy è completamente automatizzato e richiede due passaggi:

### Passaggio 1: Build OpenNext
Compila l'applicazione Next.js e la impacchetta per il runtime dei Workers di Cloudflare:
```bash
cmd.exe /c npm run build:cf
# Oppure in PowerShell:
# npx.cmd opennextjs-cloudflare build
```
Questo comando genera:
* `.open-next/worker.js`: il codice compilato del server Worker.
* `.open-next/assets/`: tutti gli asset statici ottimizzati e i file prerenderizzati.

### Passaggio 2: Pubblicazione su Cloudflare
Carica gli asset e il bundle del Worker sui server globali di Cloudflare:
```bash
cmd.exe /c npx wrangler deploy
# Oppure in PowerShell:
# npx.cmd wrangler deploy
```

---

## 3. Gestione dei Segreti di Produzione

I segreti **non sono salvati nel codice né in Git**, ma sono iniettati in modo cifrato a livello di Worker.

| Nome Segreto | Descrizione | Come Modificarlo |
| :--- | :--- | :--- |
| `SESSION_SECRET` | Chiave crittografica HMAC per firmare i cookie di sessione admin | `echo <stringa_32_caratteri> \| cmd.exe /c npx wrangler secret put SESSION_SECRET` |
| `ADMIN_PASSWORD_HASH` | Hash Scrypt (`salt:derivedKey`) della password di accesso ad `/admin/login` | `echo <hash_scrypt> \| cmd.exe /c npx wrangler secret put ADMIN_PASSWORD_HASH` |

### Come cambiare la password Admin:
1. Genera il nuovo hash Scrypt da terminale:
   ```bash
   node -e "const crypto=require('crypto'); const salt=crypto.randomBytes(16).toString('hex'); crypto.scrypt('NUOVA_PASSWORD', salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => console.log(salt + ':' + key.toString('hex')));"
   ```
2. Caricalo su Cloudflare:
   ```bash
   echo TUO_NUOVO_HASH | cmd.exe /c npx wrangler secret put ADMIN_PASSWORD_HASH
   ```

---

## 4. Gestione dei Rollback (Come annullare un errore)

Cloudflare offre il versioning istantaneo di ogni deploy. Se un rilascio introduce un bug, esistono due livelli di rollback:

### Livello A: Rollback Istantaneo del Worker (senza ricompilare)

Ogni deploy riceve un `Version ID` univoco (es. `cf65d4ad-1e00-421b-a87b-face225a7578`).

1. **Visualizza lo storico delle versioni pubblicate:**
   ```bash
   cmd.exe /c npx wrangler versions list
   ```
2. **Esegui il rollback immediato alla versione precedente:**
   ```bash
   cmd.exe /c npx wrangler rollback
   # Oppure a una versione specifica:
   # cmd.exe /c npx wrangler rollback <VERSION_ID>
   ```
   *Tempo di propagazione:* **~2-3 secondi a livello globale**.

*In alternativa via Browser:*  
Accedi a [dash.cloudflare.com](https://dash.cloudflare.com) -> **Workers e Pages** -> **pcchiaro** -> scheda **Deployments**, individua il deploy precedente funzionante e clicca su **Rollback**.

---

### Livello B: Rollback del Database D1 (Ripristino Dati)

Se un'operazione manuale o una migrazione corrompe o elimina dati indesiderati:

1. **Ripristina dall'ultimo backup esportato:**
   ```bash
   cmd.exe /c npx wrangler d1 execute pcchiaro-db --remote --file=./data/backups/backup_initial.sql
   ```
2. **Best Practice:** Prima di applicare nuove migrazioni D1 o modifiche massicce, esporta sempre un backup:
   ```bash
   cmd.exe /c npx wrangler d1 export pcchiaro-db --remote --output=./data/backups/backup_%date:~6,4%%date:~3,2%%date:~0,2%.sql
   ```

---

## 5. Migrazioni del Database D1

Quando in futuro modificherai lo schema (`src/db/schema.ts`):

1. **Genera il nuovo file di migrazione SQL:**
   ```bash
   cmd.exe /c npm run db:generate
   ```
2. **Testa la migrazione in locale:**
   ```bash
   cmd.exe /c npx wrangler d1 migrations apply pcchiaro-db --local
   ```
3. **Applica la migrazione sul database remoto di Cloudflare:**
   ```bash
   cmd.exe /c npx wrangler d1 migrations apply pcchiaro-db --remote
   ```

---

## 6. Passaggio futuro a un Dominio Personalizzato (es. `pcchiaro.it`)

Quando deciderai di acquistare e collegare il dominio definitivo:
1. Aggiungi il dominio al tuo account Cloudflare (DNS gestito da Cloudflare a costo 0).
2. Nella dashboard di Cloudflare, apri **Workers e Pages** -> **pcchiaro** -> **Impostazioni** -> **Domini e percorsi** -> Clicca su **Aggiungi** -> **Dominio personalizzato** (es. `pcchiaro.it`).
3. Aggiorna `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` con il nuovo dominio:
   ```jsonc
   "vars": {
     "NEXT_PUBLIC_SITE_URL": "https://pcchiaro.it"
   }
   ```
4. Esegui `npm run build:cf` e `npx wrangler deploy`.
