#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2_genera_csv_import.py
Fase 2 del sistema PCChiaro / PC Finder:
- Legge i candidati da output_candidati/candidati_settimana.csv.
- Abbina i Campioni reali dal Catalogo Campioni (catalogo_campioni.csv).
- Genera sia le schede dei candidati con trappole, sia le schede dei Campioni raccomandati a catalogo.
- Rispetta tassativamente le normative Amazon: NESSUN prezzo statico nei testi, NESSUNA emoji/icona.
- Compila le colonne per le alternative (alternativa_asin, alternativa_motivo, alternativa_ambito).
- Esporta in output_sito/import_schede_sito.csv pronto per 'npx.cmd tsx scripts/manage-csv.ts import ... --publish'.
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import re
import csv
import json
import sqlite3
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")
DB_PATH = os.path.join(SCRIPT_DIR, "database_pc.db")
CAMPIONI_PATH = os.path.join(SCRIPT_DIR, "catalogo_campioni.csv")
INPUT_CANDIDATI_PATH = os.path.join(SCRIPT_DIR, "output_candidati", "candidati_settimana.csv")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output_sito")
OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, "import_schede_sito.csv")

CPUS_JSON_PATH = os.path.join(PROJECT_DIR, "data", "hardware-db", "cpus.json")
GPUS_JSON_PATH = os.path.join(PROJECT_DIR, "data", "hardware-db", "gpus.json")

CSV_HEADER = [
    "asin",
    "brand",
    "modello",
    "categoria",
    "cpu_modello",
    "cpu_gen",
    "cpu_win11_support",
    "gpu_modello",
    "gpu_tipo",
    "gpu_vram_gb",
    "ram_gb",
    "ram_tipo",
    "ram_canale",
    "storage_gb",
    "storage_tipo",
    "verdetto",
    "titolo_recensione",
    "sommario_intro",
    "semaforo_gaming",
    "note_gaming",
    "semaforo_lavoro",
    "note_lavoro",
    "semaforo_ufficio",
    "note_ufficio",
    "punti_forza",
    "criticita",
    "prezzo_indicativo",
    "amazon_url",
    "alternativa_asin",
    "alternativa_motivo",
    "alternativa_ambito",
    "valore_stimato_eur"
]

def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def load_campioni():
    campioni = []
    if not os.path.exists(CAMPIONI_PATH):
        return campioni
    with open(CAMPIONI_PATH, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for r in reader:
            try:
                campioni.append({
                    "categoria": r.get("categoria", "").strip(),
                    "prezzo_min": float(r.get("prezzo_min", 0)),
                    "prezzo_max": float(r.get("prezzo_max", 9999)),
                    "brand": r.get("brand", "").strip(),
                    "modello": r.get("modello", "").strip(),
                    "cpu": r.get("cpu", "").strip(),
                    "cpu_gen": r.get("cpu_gen", "Architettura Moderna").strip(),
                    "cpu_win11_support": int(r.get("cpu_win11_support", 1)),
                    "ram_gb": int(r.get("ram_gb", 16)),
                    "ram_tipo": r.get("ram_tipo", "DDR5").strip(),
                    "ram_canale": r.get("ram_canale", "dual").strip(),
                    "gpu": r.get("gpu", "").strip(),
                    "gpu_tipo": r.get("gpu_tipo", "integrated").strip(),
                    "gpu_vram_gb": int(r.get("gpu_vram_gb", 0)),
                    "storage_gb": int(r.get("storage_gb", 512)),
                    "storage_tipo": r.get("storage_tipo", "NVMe").strip(),
                    "prezzo_indicativo": float(r.get("prezzo_indicativo", 0)),
                    "valore_stimato_congruo": float(r.get("valore_stimato_congruo") or r.get("prezzo_indicativo", 0)),
                    "asin_campione": r.get("asin_campione", "").strip(),
                    "amazon_url": r.get("amazon_url", "").strip(),
                    "titolo_recensione": r.get("titolo_recensione", "").strip(),
                    "sommario_intro": r.get("sommario_intro", "").strip(),
                    "punti_forza": r.get("punti_forza", "").strip(),
                    "criticita": r.get("criticita", "").strip(),
                    "perche_e_migliore": r.get("perche_e_migliore", "").strip()
                })
            except Exception:
                continue
    return campioni

def find_best_campione(categoria, prezzo, campioni):
    candidates = [c for c in campioni if c["categoria"] == categoria]
    if not candidates:
        candidates = campioni

    for c in candidates:
        if c["prezzo_min"] <= prezzo <= c["prezzo_max"]:
            return c

    if candidates:
        candidates.sort(key=lambda x: abs(x["prezzo_indicativo"] - prezzo))
        return candidates[0]

    return None

def lookup_hardware(cpu_query, gpu_query, cpus_db, gpus_db):
    cpu_info = {
        "canonicalName": cpu_query,
        "realArchitecture": "Architettura Standard",
        "win11Supported": 1,
        "isRebadge": False,
        "antiTrapWarning": None
    }
    gpu_info = {
        "canonicalName": gpu_query,
        "type": "integrated" if any(k in gpu_query.lower() for k in ["integrata", "uhd", "iris", "radeon 6", "vega", "graphics"]) else "dedicated",
        "realArchitecture": "Standard",
        "vramGb": 0,
        "tier1080p": "limitato",
        "antiTrapWarning": None
    }

    q_cpu = cpu_query.lower()
    for item in cpus_db:
        if item.get("canonicalName", "").lower() in q_cpu or any(a.lower() in q_cpu for a in item.get("aliases", [])):
            cpu_info["canonicalName"] = item.get("canonicalName")
            cpu_info["realArchitecture"] = item.get("realArchitecture")
            cpu_info["win11Supported"] = item.get("win11Supported", 1)
            cpu_info["isRebadge"] = item.get("isRebadge", False)
            cpu_info["antiTrapWarning"] = item.get("antiTrapWarning")
            break

    q_gpu = gpu_query.lower()
    for item in gpus_db:
        if item.get("canonicalName", "").lower() in q_gpu or any(a.lower() in q_gpu for a in item.get("aliases", [])):
            gpu_info["canonicalName"] = item.get("canonicalName")
            gpu_info["type"] = item.get("type", "integrated")
            gpu_info["realArchitecture"] = item.get("realArchitecture")
            gpu_info["vramGb"] = item.get("standardVramGb", 0)
            gpu_info["tier1080p"] = item.get("tier1080p", "limitato")
            gpu_info["antiTrapWarning"] = item.get("antiTrapWarning")
            break

    return cpu_info, gpu_info

def generate_scheda_candidato(candidato, campione, cpus_db, gpus_db):
    prezzo = float(candidato.get("Prezzo", 0))
    ram_gb = int(candidato.get("RAM_GB", 8))
    storage_gb = int(candidato.get("Storage_GB", 512))
    categoria = candidato.get("Categoria", "laptop")
    brand = candidato.get("Brand", "Brand")
    modello = candidato.get("Codice_Modello", "Modello")
    raw_cpu = candidato.get("CPU", "Processore Standard")
    raw_gpu = candidato.get("GPU", "Grafica Integrata")
    asin = candidato.get("ASIN", "")
    amazon_url = candidato.get("URL_Amazon", "")

    cpu_info, gpu_info = lookup_hardware(raw_cpu, raw_gpu, cpus_db, gpus_db)

    # Calcolo Valore Hardware Congruo Stimato (Soglia di convenienza redazionale)
    if "n4500" in raw_cpu.lower() or "celeron" in raw_cpu.lower():
        valore_stimato = 220.0
    elif "7520" in raw_cpu or "7320" in raw_cpu:
        valore_stimato = 419.0 if ram_gb >= 16 else 379.0
    elif "core 5" in raw_cpu.lower() or "120u" in raw_cpu.lower() or "1335u" in raw_cpu.lower():
        valore_stimato = 549.0 if ram_gb >= 16 else 469.0
    elif "240h" in raw_cpu.lower() or "rtx" in raw_gpu.lower():
        valore_stimato = 899.0
    elif "5800h" in raw_cpu.lower():
        valore_stimato = 369.0
    elif "n100" in raw_cpu.lower():
        valore_stimato = 179.0
    else:
        valore_stimato = 450.0

    traps = candidato.get("Note_Affiliazione", "")
    is_severe = "8 GB" in traps or "datato" in traps or "obsoleta" in traps or cpu_info["win11Supported"] == 0

    if is_severe:
        verdetto = "sconsigliato" if (prezzo >= 430 or cpu_info["win11Supported"] == 0 or "N4500" in raw_cpu) else "accettabile_base"
    elif "rebrand" in traps.lower() or ram_gb <= 8:
        verdetto = "accettabile_base"
    else:
        # Se l'hardware e valido ma il prezzo rilevato supera del 25% la stima congrua
        if prezzo > 0 and valore_stimato > 0 and prezzo > (valore_stimato * 1.25):
            verdetto = "conveniente_offerta"
        else:
            verdetto = "buon_acquisto"

    ram_tipo = "LPDDR5" if "7520" in raw_cpu or "130" in raw_cpu else ("DDR5" if "core 5" in raw_cpu.lower() or "240h" in raw_cpu.lower() else "DDR4")
    ram_canale = "single" if ram_gb <= 8 else "dual"
    storage_tipo = "NVMe" if storage_gb >= 256 else "eMMC"

    titolo_recensione = f"{brand} {modello} ({cpu_info['canonicalName']} + {gpu_info['canonicalName']})"

    # COSTRUZIONE SOMMARIO INTRO:
    if verdetto == "sconsigliato":
        sommario_intro = (
            f"Configurazione che evidenzia criticita tecniche rilevanti: il modello {brand} {modello} viene proposto con "
            f"soli {ram_gb} GB di memoria RAM e processore {cpu_info['canonicalName']} ({cpu_info['realArchitecture']}). "
            f"La ridotta dotazione di memoria e l'architettura dei componenti rappresentano un collo di bottiglia concreto "
            f"per l'uso prolungato e il multitasking, rendendo la macchina suscettibile a rallentamenti precoci."
        )
    elif verdetto == "conveniente_offerta":
        sommario_intro = (
            f"Configurazione valida dal punto di vista hardware ma fortemente condizionata dal prezzo di vendita: {brand} {modello} "
            f"integra il processore {cpu_info['canonicalName']} con {ram_gb} GB di memoria RAM. L'acquisto risulta consigliato esclusivamente "
            f"in presenza di un'offerta che si collochi entro la soglia di convenienza stimata dalla redazione; a quotazioni superiori "
            f"il rapporto qualita/prezzo decade drasticamente a favore di alternative di fascia piu elevata."
        )
    elif verdetto == "accettabile_base":
        sommario_intro = (
            f"Dispositivo indicato prevalentemente per esigenze elementari di videoscrittura e navigazione web: {brand} {modello} "
            f"si basa sul processore {cpu_info['canonicalName']} affiancato da {ram_gb} GB di RAM. Risulta idoneo per carichi leggeri, "
            f"ma evidenzia limitazioni tangibili in caso di sessioni intensive con numerose applicazioni contemporanee."
        )
    else:
        sommario_intro = (
            f"Configurazione equilibrata e moderna: {brand} {modello} combina il processore {cpu_info['canonicalName']} "
            f"con {ram_gb} GB di RAM e memoria a stato solido da {storage_gb} GB, offrendo un comportamento fluido e reattivo."
        )

    # Segnalazione assenza caricabatterie
    has_no_charger = "caricabatterie" in traps.lower() or "alimentatore" in traps.lower() or "senza caricatore" in candidato.get("Titolo_Amazon", "").lower()
    if has_no_charger:
        sommario_intro += " Si segnala inoltre un importante compromesso sulla dotazione di vendita: il dispositivo viene fornito privo di caricabatterie in confezione, rendendo necessario l'acquisto separato di un alimentatore compatibile per l'utilizzo."

    # SEMAFORI E NOTE EDITORIALI (senza prezzi, senza emoji)
    if gpu_info["type"] == "dedicated" and gpu_info["vramGb"] >= 6:
        semaforo_gaming = "idoneo"
        note_gaming = f"Scheda grafica dedicata {gpu_info['canonicalName']} idonea alla risoluzione 1080p con framerate stabile nei titoli moderni."
    elif gpu_info["type"] == "dedicated" and gpu_info["vramGb"] >= 4:
        semaforo_gaming = "limitato"
        note_gaming = f"GPU {gpu_info['canonicalName']} con 4 GB di VRAM: adeguata per titoli eSports e dettagli medi, limitata sui Tripla A recenti."
    else:
        semaforo_gaming = "limitato" if ("680m" in raw_gpu.lower() or "780m" in raw_gpu.lower()) else "non_adatto"
        note_gaming = f"Grafica integrata {gpu_info['canonicalName']}: concepita per streaming video e grafica 2D, non adatta al gaming 3D contemporaneo."

    if ram_gb >= 16 and cpu_info["win11Supported"] == 1:
        semaforo_lavoro = "idoneo"
        note_lavoro = f"Dotazione di {ram_gb} GB di RAM adatta per multitasking avanzato, suite per ufficio complessa e fotoritocco."
    else:
        semaforo_lavoro = "limitato" if ram_gb == 8 else "non_adatto"
        note_lavoro = f"Collo di bottiglia legato agli {ram_gb} GB di RAM: saturazione rapida della memoria con piu schede del browser e applicativi attivi."

    if cpu_info["win11Supported"] == 1:
        semaforo_ufficio = "idoneo"
        note_ufficio = "Ottimo per navigazione web, gestione documenti Word ed Excel e streaming ad alta definizione."
    else:
        semaforo_ufficio = "limitato"
        note_ufficio = "Attenzione: processore non certificato ufficialmente per Windows 11. Aggiornamenti di sistema non garantiti a lungo termine."

    # PUNTI DI FORZA E CRITICITA (senza prezzi statici, senza emoji)
    punti_forza = []
    if storage_gb >= 512: punti_forza.append(f"Unita di archiviazione SSD NVMe capiente e scattante da {storage_gb} GB")
    if cpu_info["win11Supported"] == 1: punti_forza.append("Supporto ufficiale e nativo per Windows 11")
    if ram_gb >= 16: punti_forza.append(f"Dotazione di {ram_gb} GB di RAM adeguata al software contemporaneo")
    if not punti_forza: punti_forza.append("Dimensioni compatte e consumi energetici ridotti durante l'uso di base")

    criticita = []
    if ram_gb <= 8:
        criticita.append(f"Presenza di soli {ram_gb} GB di RAM: quantitativo insufficiente per assicurare longevita e multitasking fluido")
    if cpu_info.get("antiTrapWarning"):
        # Rimuove emoji se presenti nel db legacy
        clean_warn = re.sub(r'[^\w\s\.,;:()\/\-]', '', cpu_info["antiTrapWarning"]).strip()
        criticita.append(clean_warn)
    elif cpu_info.get("isRebadge"):
        criticita.append(f"Processore basato su architettura di generazioni precedenti ({cpu_info['realArchitecture']}) rimarchiato con nomenclatura recente")
    if cpu_info["win11Supported"] == 0:
        criticita.append("Incompatibilita ufficiale con i requisiti minimi di Windows 11")
    if has_no_charger:
        criticita.append("Assenza dell'alimentatore in confezione: il caricabatterie non e fornito in dotazione e deve essere acquistato separatamente per poter ricaricare il portatile")

    if campione and ram_gb < campione["ram_gb"]:
        criticita.append(f"Rapporto qualita prezzo sfavorevole rispetto alle alternative di mercato con 16 GB di RAM e processori piu moderni")

    # DATI ALTERNATIVA CONSIGLIATA
    alt_asin = campione["asin_campione"] if campione else ""
    alt_motivo = (
        f"A parita di fascia di mercato offre {campione['ram_gb']} GB di memoria RAM e un processore di architettura piu recente, "
        f"garantendo longevita e assenza di strozzature durante l'uso quotidiano."
    ) if campione else ""
    alt_ambito = "Studio, lavoro d'ufficio e produttivita quotidiana"

    return {
        "asin": asin,
        "brand": brand,
        "modello": modello,
        "categoria": categoria,
        "cpu_modello": cpu_info["canonicalName"],
        "cpu_gen": cpu_info["realArchitecture"],
        "cpu_win11_support": cpu_info["win11Supported"],
        "gpu_modello": gpu_info["canonicalName"],
        "gpu_tipo": gpu_info["type"],
        "gpu_vram_gb": gpu_info["vramGb"],
        "ram_gb": ram_gb,
        "ram_tipo": ram_tipo,
        "ram_canale": ram_canale,
        "storage_gb": storage_gb,
        "storage_tipo": storage_tipo,
        "verdetto": verdetto,
        "titolo_recensione": titolo_recensione,
        "sommario_intro": sommario_intro,
        "semaforo_gaming": semaforo_gaming,
        "note_gaming": note_gaming,
        "semaforo_lavoro": semaforo_lavoro,
        "note_lavoro": note_lavoro,
        "semaforo_ufficio": semaforo_ufficio,
        "note_ufficio": note_ufficio,
        "punti_forza": " | ".join(punti_forza),
        "criticita": " | ".join(criticita),
        "prezzo_indicativo": prezzo,
        "amazon_url": amazon_url,
        "alternativa_asin": alt_asin,
        "alternativa_motivo": alt_motivo,
        "alternativa_ambito": alt_ambito,
        "valore_stimato_eur": valore_stimato
    }

def generate_scheda_campione(campione):
    """
    Genera la scheda tecnica e di recensione a catalogo per un PC Campione Best Buy,
    cosicche sia presente nel database e possa essere visualizzato come recensione approvata.
    """
    val_cong = campione["valore_stimato_congruo"]
    prezzo_camp = campione["prezzo_indicativo"]
    verdetto_camp = "conveniente_offerta" if (prezzo_camp > 0 and val_cong > 0 and prezzo_camp > val_cong * 1.25) else "buon_acquisto"

    return {
        "asin": campione["asin_campione"],
        "brand": campione["brand"],
        "modello": campione["modello"],
        "categoria": campione["categoria"],
        "cpu_modello": campione["cpu"],
        "cpu_gen": campione["cpu_gen"],
        "cpu_win11_support": campione["cpu_win11_support"],
        "gpu_modello": campione["gpu"],
        "gpu_tipo": campione["gpu_tipo"],
        "gpu_vram_gb": campione["gpu_vram_gb"],
        "ram_gb": campione["ram_gb"],
        "ram_tipo": campione["ram_tipo"],
        "ram_canale": campione["ram_canale"],
        "storage_gb": campione["storage_gb"],
        "storage_tipo": campione["storage_tipo"],
        "verdetto": verdetto_camp,
        "titolo_recensione": campione["titolo_recensione"] or f"{campione['brand']} {campione['modello']} ({campione['cpu']})",
        "sommario_intro": campione["sommario_intro"],
        "semaforo_gaming": "limitato" if campione["categoria"] != "desktop_gaming" else "idoneo",
        "note_gaming": "Adatto per eSports leggeri e compiti multimediali." if campione["categoria"] != "desktop_gaming" else "Scheda video dedicata adatta a 1080p nativo.",
        "semaforo_lavoro": "idoneo",
        "note_lavoro": f"Dotazione di {campione['ram_gb']} GB di RAM ideale per multitasking intenso e produttivita avanzata senza rallentamenti.",
        "semaforo_ufficio": "idoneo",
        "note_ufficio": "Eccellente reattivita per suite Office, navigazione web con numerose schede e fruizione multimediale.",
        "punti_forza": campione["punti_forza"],
        "criticita": campione["criticita"],
        "prezzo_indicativo": campione["prezzo_indicativo"],
        "amazon_url": campione["amazon_url"],
        "alternativa_asin": "",
        "alternativa_motivo": "",
        "alternativa_ambito": "",
        "valore_stimato_eur": val_cong
    }

def main():
    parser = argparse.ArgumentParser(description="Genera CSV import per PCChiaro")
    parser.add_argument("--all", action="store_true", help="Elabora tutti i candidati")
    args = parser.parse_args()

    print("\n" + "="*60)
    print("AVVIO GENERATORE CSV IMPORT (PCCHIARO - FASE 2)")
    print("="*60)

    if not os.path.exists(INPUT_CANDIDATI_PATH):
        print(f"File candidati non trovato: {INPUT_CANDIDATI_PATH}")
        sys.exit(1)

    cpus_db = load_json(CPUS_JSON_PATH)
    gpus_db = load_json(GPUS_JSON_PATH)
    campioni = load_campioni()
    print(f"Caricati: {len(cpus_db)} CPU, {len(gpus_db)} GPU, {len(campioni)} Campioni verificati.")

    candidati = []
    with open(INPUT_CANDIDATI_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for r in reader:
            da_generare = r.get("Da_Generare", "").strip().upper()
            if args.all or da_generare in ["SI", "1", "TRUE"]:
                candidati.append(r)

    if not candidati:
        print("Nessun candidato selezionato per l'importazione.")
        sys.exit(0)

    print(f"Elaborazione di {len(candidati)} PC candidati...\n")

    schede_generate = []
    campioni_da_inserire = {}

    for c in candidati:
        prezzo = float(c.get("Prezzo", 0))
        cat = c.get("Categoria", "laptop")
        campione = find_best_campione(cat, prezzo, campioni)

        scheda = generate_scheda_candidato(c, campione, cpus_db, gpus_db)
        schede_generate.append(scheda)

        if campione:
            campioni_da_inserire[campione["asin_campione"]] = campione

        print(f"Scheda: {scheda['titolo_recensione']}")
        print(f"  Verdetto: {scheda['verdetto'].upper()} | Prezzo DB: {scheda['prezzo_indicativo']} EUR")
        if campione:
            print(f"  Campione collegato: {campione['brand']} {campione['modello']} (ASIN: {campione['asin_campione']})")
        print()

    # Genera e aggiunge anche le schede dei Campioni abbinati affinche esistano a catalogo
    print(f"Inclusione a catalogo dei {len(campioni_da_inserire)} PC Campioni di riferimento...")
    for asin_c, camp in campioni_da_inserire.items():
        # Verifica se non e gia tra le schede generate
        if not any(s["asin"] == asin_c for s in schede_generate):
            scheda_c = generate_scheda_campione(camp)
            schede_generate.append(scheda_c)
            print(f"  Aggiunto Campione a catalogo: {scheda_c['titolo_recensione']} (ASIN: {asin_c})")

    # Scrivi CSV Finale
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_CSV_PATH, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADER, delimiter=";")
        writer.writeheader()
        for s in schede_generate:
            writer.writerow(s)

    print("\n" + "="*60)
    print("GENERAZIONE COMPLETATA CON SUCCESSO!")
    print(f"Totale schede pronte per il catalogo: {len(schede_generate)}")
    print(f"File CSV pronto: {OUTPUT_CSV_PATH}")
    print("\nComando di importazione:")
    print('  npx.cmd tsx scripts/manage-csv.ts import "pc_finder/output_sito/import_schede_sito.csv" --publish')
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
