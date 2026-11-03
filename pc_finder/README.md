# PC Finder & Generatore CSV (Sistema Semi-Automatico PCChiaro)

Questo modulo realizza l'architettura tecnica a 2 fasi per scovare i modelli di PC più cercati su Amazon, individuare i loro punti deboli (trappole hardware), valutarne il potenziale SEO/affiliazione e generare i CSV pronti per l'importazione sul sito.

---

## 📁 Struttura della Cartella

```text
pc_finder/
│
├── config.json                 # URL classifiche Amazon, soglie trappole, tag affiliato
├── database_pc.db              # Database SQLite locale anti-duplicati e memoria storica
├── catalogo_campioni.csv       # I tuoi 8-10 PC "Best Buy" divisi per fascia e categoria
│
├── 1_trova_candidati.py        # FASE 1: Trova PC, rileva SKU, trappole e assegna Priorità SEO
├── 2_genera_csv_import.py      # FASE 2: Abbina i campioni, genera testi e crea il CSV finale
│
├── input_keepa/                # Cartella per drop rapido di CSV Keepa o file HTML salvati
├── output_candidati/           # CSV intermedio per la revisione rapida dell'utente
│   └── candidati_settimana.csv
│
└── output_sito/                # CSV finale conforme al sito
    └── import_schede_sito.csv
```

---

## 🚀 Guida all'Uso in 3 Passaggi

### Passo 1: Individuare i Candidati (`1_trova_candidati.py`)

Puoi trovare candidati in 3 modalità:

1. **Scansione Live delle classifiche Amazon**:
   ```powershell
   python pc_finder/1_trova_candidati.py
   ```
2. **Analisi di un ASIN o URL specifico**:
   ```powershell
   python pc_finder/1_trova_candidati.py --asin B0GQZDM5WK
   ```
3. **Importazione tramite Keepa CSV o HTML salvato da browser**:
   Trascina il file esportato da Keepa dentro `pc_finder/input_keepa/`, oppure passa il percorso:
   ```powershell
   python pc_finder/1_trova_candidati.py --file "pc_finder/input_keepa/export_keepa.csv"
   ```

Lo script popola `pc_finder/output_candidati/candidati_settimana.csv` e aggiorna `database_pc.db` per non mostrarti mai duplicati nelle settimane successive.

---

### Passo 2: Revisione Rapida (Umana - 2 minuti)

Apri con Excel o Blocco Note il file:
`pc_finder/output_candidati/candidati_settimana.csv`

- I modelli con SKU preciso e difetti gravi ricevono automaticamente **Priorità ORO** e `Da_Generare = SI`.
- Se vuoi escludere un modello, imposta la prima colonna su `NO`.
- Se vuoi includere modelli di Priorità ARGENTO o BRONZO, cambia la prima colonna in `SI`.

Salva il file.

---

### Passo 3: Generazione CSV e Importazione nel Sito (`2_genera_csv_import.py`)

1. **Genera le schede tecniche con le alternative raccomandate**:
   ```powershell
   python pc_finder/2_genera_csv_import.py
   ```
   Lo script:
   - Abbina in automatico l'alternativa Best Buy ideale da `catalogo_campioni.csv`
   - Interroga il database hardware interno (`cpus.json` e `gpus.json`) per dettagli su rebadge e supporto a Windows 11
   - Genera sommari incisivi con verdetto, semafori, punti di forza e criticità
   - Esporta il file in `pc_finder/output_sito/import_schede_sito.csv`

2. **Importa subito nel sito web**:
   ```powershell
   npx.cmd tsx scripts/manage-csv.ts import "pc_finder/output_sito/import_schede_sito.csv"
   ```
   Le schede appariranno immediatamente come bozze pronte per la pubblicazione su PCChiaro!

---

## 🎯 Il "Catalogo Campioni" (`catalogo_campioni.csv`)

Contiene le alternative vincenti divise per categoria (`laptop`, `mini_pc`, `desktop_gaming`, `desktop_office`) e budget. Puoi aggiornarlo periodicamente per cambiare le raccomandazioni commerciali che lo script inserisce automaticamente nelle schede delle macchine con difetti.
