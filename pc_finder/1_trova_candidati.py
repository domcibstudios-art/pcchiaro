#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
1_trova_candidati.py
Fase 1 del sistema PCChiaro / PC Finder:
- Scansione con Playwright ed estrazione ad alta precisione dei dettagli hardware.
- Brand, SKU e CPU reali (nessun "Generico", nessun "Processore Standard").
- Rilevamento trappole tecniche (RAM limitata, CPU datate/rebrand, GPU vintage, no Win11).
- Nessun prezzo numerico nei testi e nessuna icona/emoji (stile editoriale sobrio e conforme Amazon).
- Gestione archivio SQLite anti-duplicati (database_pc.db).
- Esportazione report intermedi in output_candidati/candidati_settimana.csv.
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
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")
DB_PATH = os.path.join(SCRIPT_DIR, "database_pc.db")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output_candidati")
KEEPA_DIR = os.path.join(SCRIPT_DIR, "input_keepa")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "candidati_settimana.csv")

# ─────────────────────────────────────────────────────────────
# 1. Configurazione e Inizializzazione Database
# ─────────────────────────────────────────────────────────────
def load_config():
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"File di configurazione non trovato: {CONFIG_PATH}")
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS pc_visti (
            asin TEXT PRIMARY KEY,
            brand TEXT,
            modello TEXT,
            categoria TEXT,
            titolo TEXT,
            prezzo REAL,
            ram_gb INTEGER,
            cpu TEXT,
            gpu TEXT,
            storage_gb INTEGER,
            priorita_seo TEXT,
            note_affiliazione TEXT,
            stato TEXT DEFAULT 'NUOVO', -- 'NUOVO', 'CANDIDATO', 'IMPORTATO', 'SCARTATO'
            data_scoperta TEXT,
            data_aggiornamento TEXT,
            url_amazon TEXT
        )
    ''')
    conn.commit()
    return conn

def is_asin_seen(conn, asin):
    c = conn.cursor()
    c.execute("SELECT stato FROM pc_visti WHERE asin = ?", (asin,))
    row = c.fetchone()
    return row is not None

def save_or_update_pc(conn, pc_data):
    c = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute('''
        INSERT INTO pc_visti (
            asin, brand, modello, categoria, titolo, prezzo,
            ram_gb, cpu, gpu, storage_gb, priorita_seo,
            note_affiliazione, stato, data_scoperta, data_aggiornamento, url_amazon
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(asin) DO UPDATE SET
            prezzo = excluded.prezzo,
            priorita_seo = excluded.priorita_seo,
            note_affiliazione = excluded.note_affiliazione,
            data_aggiornamento = excluded.data_aggiornamento
    ''', (
        pc_data.get("asin"),
        pc_data.get("brand"),
        pc_data.get("modello"),
        pc_data.get("categoria"),
        pc_data.get("titolo"),
        pc_data.get("prezzo"),
        pc_data.get("ram_gb"),
        pc_data.get("cpu"),
        pc_data.get("gpu"),
        pc_data.get("storage_gb"),
        pc_data.get("priorita_seo"),
        pc_data.get("note_affiliazione"),
        pc_data.get("stato", "CANDIDATO"),
        now_str,
        now_str,
        pc_data.get("url_amazon")
    ))
    conn.commit()

# ─────────────────────────────────────────────────────────────
# 2. Parsing Euristiche & Riconoscimento Specifiche Hardware
# ─────────────────────────────────────────────────────────────
def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def extract_asin(url_or_str):
    if not url_or_str:
        return ""
    m = re.search(r'(?:/dp/|/gp/product/|asin=|^)([A-Z0-9]{10})(?:[/?&]|$)', url_or_str.strip(), re.IGNORECASE)
    return m.group(1).upper() if m else ""

def detect_brand(text, specs_dict=None):
    if specs_dict:
        b_spec = specs_dict.get("Marca") or specs_dict.get("Produttore") or specs_dict.get("Marchio")
        if b_spec and len(b_spec.strip()) > 1 and b_spec.strip().lower() not in ["computer", "personal computer", "laptop"]:
            val = b_spec.strip()
            return val.upper() if len(val) <= 3 else val.capitalize()

    text_lower = text.lower()
    known_brands = [
        ("omen", "HP"), ("victus", "HP"), ("hyperx", "HP"), ("hp", "HP"),
        ("vivobook", "ASUS"), ("zenbook", "ASUS"), ("rog", "ASUS"), ("tuf", "ASUS"), ("asus", "ASUS"),
        ("ideapad", "Lenovo"), ("thinkpad", "Lenovo"), ("yoga", "Lenovo"), ("loq", "Lenovo"), ("legion", "Lenovo"), ("lenovo", "Lenovo"),
        ("aspire", "Acer"), ("nitro", "Acer"), ("predator", "Acer"), ("acer", "Acer"),
        ("dell", "Dell"), ("inspiron", "Dell"), ("alienware", "Dell"),
        ("msi", "MSI"), ("katana", "MSI"),
        ("beelink", "Beelink"), ("nipogi", "NiPoGi"), ("geekom", "Geekom"), ("minisforum", "Minisforum"),
        ("acemagic", "Acemagic"), ("blackview", "Blackview"),
        ("megaport", "Megaport"), ("ankermann", "Ankermann"), ("breunor", "Breunor"), ("sedatech", "Sedatech")
    ]
    for k, canonical in known_brands:
        pattern = rf'\b{re.escape(k)}\b'
        if re.search(pattern, text_lower):
            return canonical
    return "Marchio Non Specificato"

def detect_category(title, brand):
    title_lower = title.lower()
    if any(k in title_lower for k in ["mini pc", "minipc", "micro pc"]):
        return "mini_pc"
    if any(k in title_lower for k in ["gaming", "gtx", "rtx", "rx 6", "rx 7"]) and any(k in title_lower for k in ["fisso", "desktop", "case", "tower"]):
        return "desktop_gaming"
    if any(k in title_lower for k in ["desktop", "fisso", "tower", "all-in-one", "aio"]):
        return "desktop_office"
    if any(k in title_lower for k in ["portatile", "notebook", "laptop", "ultrabook", "chromebook", "macbook"]):
        return "laptop"
    if brand.lower() in ["beelink", "nipogi", "geekom", "minisforum"]:
        return "mini_pc"
    if brand.lower() in ["megaport", "breunor", "ankermann"]:
        return "desktop_gaming"
    return "laptop"

def clean_model_name(title, brand, specs_dict=None):
    """
    Costruisce un nome modello pulito ed editoriale (Brand + Serie/Modello),
    evitando parole vietate come 'anti-glare', 'quad-core', 'fhd'.
    """
    # 1. Controlla prima le serie celebri nel titolo
    series_map = [
        (r'IdeaPad\s+(?:Slim\s+)?[0-9](?:\s+[0-9]{1,2}(?:\.[0-9])?)?', "IdeaPad Slim 3"),
        (r'Vivobook\s+1[4-6](?:\s+[A-Z0-9]+)?', "Vivobook 15"),
        (r'Aspire\s+(?:Lite\s+)?[0-9]{1,2}', "Aspire Lite 15"),
        (r'OmniBook\s+[0-9](?:\s+[0-9]{1,2})?', "OmniBook 3 16"),
        (r'Victus\s+1[56]', "Victus 15"),
        (r'HyperX\s+OMEN(?:\s+Gaming)?\s+1[56]', "HyperX OMEN 15"),
        (r'Katana\s+1[5-7]', "Katana 15"),
        (r'Mini\s+S12(?:\s+Pro)?', "Mini S12 Pro"),
        (r'SER[5-8](?:\s+Pro)?', "SER5 Pro")
    ]
    detected_series = None
    for pattern, name in series_map:
        m = re.search(pattern, title, re.IGNORECASE)
        if m:
            detected_series = m.group(0).strip()
            break

    # 2. Cerca il codice SKU o modello articolo
    sku = None
    if specs_dict:
        s_model = specs_dict.get("Numero di modello") or specs_dict.get("Nome modello") or specs_dict.get("Codice articolo del produttore")
        if s_model and len(s_model.strip()) >= 3 and s_model.strip().lower() not in ["clamshell", "laptop", "notebook"]:
            sku = s_model.strip()

    if not sku:
        sku_patterns = [
            r'\b([0-9]{2}-[a-zA-Z0-9]{6,10})\b',                  # HP es. 15-ga0002slx, 16-by0001slx, 15-fd1000slx
            r'\b(8[0-3][A-Z0-9]{8})\b',                           # Lenovo es. 82XQ00EBUS, 82VG007PIX
            r'\b([A-Z][0-9]{3}[A-Z]{2}(?:-[A-Z0-9]+)?)\b',       # ASUS es. F1504MA, F1504VA-NJ591W
            r'\b(AL[0-9]{2}-[0-9]{2}[A-Z]?|A[0-9]{3}-[0-9]{2})\b', # Acer Aspire
            r'\b(NX\.[A-Z0-9]+\.[0-9]+)\b'                        # Acer Part number
        ]
        for pat in sku_patterns:
            m = re.search(pat, title, re.IGNORECASE)
            if m:
                found = m.group(1).strip()
                # Verifica che non sia una parola tecnica comune
                if found.lower() not in ["quad-core", "dual-core", "anti-glare", "ddr4-3200", "pcie-4"]:
                    sku = found
                    break

    # Combina serie e SKU in modo elegante
    if detected_series and sku:
        return f"{detected_series} ({sku})"
    elif detected_series:
        return detected_series
    elif sku:
        return sku
    else:
        # Fallback pulito sui primi termini del titolo senza parole spam
        clean_title = re.sub(r'\b(Notebook|PC Portatile|Display|FHD|IPS|RAM|SSD|Windows 11|QWERTY|Italiano|Grigio|Nero|Argento)\b.*', '', title, flags=re.IGNORECASE).strip()
        clean_title = re.sub(r'[\(\)\[\],-]', ' ', clean_title)
        clean_title = " ".join(clean_title.split()[:4])
        return clean_title if len(clean_title) >= 5 else f"Modello {brand}"

def parse_full_hardware(title, specs_dict=None):
    specs_dict = specs_dict or {}
    text_full = f"{title} " + " ".join([f"{k}: {v}" for k, v in specs_dict.items()])
    text_clean = text_full.replace(",", ".")

    # 1. RAM GB
    ram_gb = 8
    # Prova da tabella tecnica
    spec_ram = specs_dict.get("Memoria RAM installata") or specs_dict.get("Capacità della memoria RAM") or specs_dict.get("Dimensioni memoria RAM")
    if spec_ram:
        m = re.search(r'(\d+)', spec_ram)
        if m: ram_gb = int(m.group(1))
    else:
        m = re.search(r'\b([4|8|12|16|24|32|64])\s*(?:gb|giga)\b', text_clean, re.IGNORECASE)
        if m: ram_gb = int(m.group(1))

    # 2. Storage GB
    storage_gb = 512
    spec_storage = specs_dict.get("Capacità di immagazzinamento dati della memoria") or specs_dict.get("Dimensioni disco rigido") or specs_dict.get("Dimensioni dell'Hard-Disk")
    if spec_storage:
        if "tb" in spec_storage.lower():
            m = re.search(r'(\d+)', spec_storage)
            if m: storage_gb = int(m.group(1)) * 1024
        else:
            m = re.search(r'(\d+)', spec_storage)
            if m: storage_gb = int(m.group(1))
    else:
        tb_m = re.search(r'\b([1|2|4])\s*(?:tb|tera)\b', text_clean, re.IGNORECASE)
        if tb_m:
            storage_gb = int(tb_m.group(1)) * 1024
        else:
            ssd_m = re.search(r'\b(128|256|500|512|1000|1024)\s*(?:gb|giga)\b', text_clean, re.IGNORECASE)
            if ssd_m: storage_gb = int(ssd_m.group(1))

    # 3. CPU
    cpu = "Processore Non Specificato"
    spec_cpu = specs_dict.get("Numero di modello CPU") or specs_dict.get("Modello CPU") or specs_dict.get("Tipo di processore") or specs_dict.get("Marchio del processore")
    
    # Lista di pattern gerarchici per individuare con precisione la CPU esatta
    cpu_patterns = [
        r'(AMD\s+Ryzen\s+[3579]\s+[0-9]{4}[A-Z]{0,2})',
        r'(Ryzen\s+[3579]\s+[0-9]{4}[A-Z]{0,2})',
        r'(R[3579]-[0-9]{4}[A-Z]{0,2})',
        r'(AMD\s+Ryzen\s+[3579]\s+1[0-9]{2})',
        r'(Intel\s+Core\s+i[3579]-?[0-9]{4,5}[A-Z]{0,2})',
        r'(Core\s+i[3579]-?[0-9]{4,5}[A-Z]{0,2})',
        r'(i[3579]-?[0-9]{4,5}[A-Z]{0,2})',
        r'(Intel\s+Core\s+[357]\s+[0-9]{3}[A-Z]?)',
        r'(Core\s+[357]-?[0-9]{3}[A-Z]?)',
        r'(Intel\s+Celeron\s+N?[0-9]{4,5}[A-Z]?)',
        r'(Celeron\s+N?[0-9]{4,5}[A-Z]?)',
        r'(Intel\s+N(?:100|200|95|97|305|4020|4500|5100))',
        r'(Pentium\s+[A-Z]?[0-9]{4,5}[A-Z]?)'
    ]
    
    # Cerca prima nella riga specifica
    if spec_cpu and len(spec_cpu) > 3:
        for pat in cpu_patterns:
            m = re.search(pat, spec_cpu, re.IGNORECASE)
            if m:
                cpu = m.group(1).strip()
                break
        if cpu == "Processore Non Specificato":
            cpu = spec_cpu.strip()

    # Se non trovata o generica, cerca nel testo completo
    if cpu in ["Processore Non Specificato", "Intel", "AMD", "Intel Core 5", "Intel Core 7", "Intel Core i5"]:
        for pat in cpu_patterns:
            m = re.search(pat, text_full, re.IGNORECASE)
            if m:
                cpu = m.group(1).strip()
                break

    # 4. GPU
    gpu = "Grafica Integrata"
    spec_gpu = specs_dict.get("Coprocessore grafico") or specs_dict.get("Descrizione scheda grafica")
    gpu_patterns = [
        r'(NVIDIA\s+GeForce\s+RTX\s+[2345]0[5-9]0(?:\s*Ti|\s*Super)?)',
        r'(RTX\s+[2345]0[5-9]0(?:\s*Ti|\s*Super)?)',
        r'(GTX\s+16[56]0(?:\s*Ti|\s*Super)?)',
        r'(GTX\s+[0-9]{3,4})',
        r'(GT\s+710|GT\s+730|GT\s+1030)',
        r'(RX\s+[67][0-9]{3}(?:\s*XT)?)',
        r'(Radeon\s+(?:6[68]0M|7[68]0M|610M|Vega\s*[0-9]+))',
        r'(Intel\s+Iris\s+Xe(?:\s+Graphics)?)',
        r'(Intel\s+UHD\s+Graphics)',
        r'(Intel\s+HD\s+Graphics)'
    ]
    if spec_gpu:
        for pat in gpu_patterns:
            m = re.search(pat, spec_gpu, re.IGNORECASE)
            if m:
                gpu = m.group(1).strip()
                break
    if gpu == "Grafica Integrata":
        for pat in gpu_patterns:
            m = re.search(pat, text_full, re.IGNORECASE)
            if m:
                gpu = m.group(1).strip()
                break

    return {
        "ram_gb": ram_gb,
        "storage_gb": storage_gb,
        "cpu": cpu,
        "gpu": gpu
    }

# ─────────────────────────────────────────────────────────────
# 3. Analisi Trappole Tecniche (Senza Prezzi Statici, Senza Emoji)
# ─────────────────────────────────────────────────────────────
def evaluate_pc_traps(prezzo, ram_gb, cpu, gpu, categoria, config, no_charger=False):
    note = []
    filtri = config.get("filtri_trappole", {})
    soglia_ram = filtri.get("soglia_prezzo_8gb_ram_eur", 420.0)
    cpu_obsolete = filtri.get("cpu_obsolete_o_deboli", [])
    rebrand_zen2 = filtri.get("cpu_rebrand_zen2", [])
    rebrand_zen3plus = filtri.get("cpu_rebrand_zen3plus", [])
    gpu_obsolete = filtri.get("gpu_obsolete_spacciate_gaming", [])

    cpu_lower = cpu.lower()
    gpu_lower = gpu.lower()

    # 1. RAM limitata
    if prezzo > soglia_ram and ram_gb <= 8:
        note.append("Configurazione limitata da soli 8 GB di memoria RAM per questa fascia di mercato: elevato rischio di saturazione della memoria con carichi moderni")

    # 2. CPU deboli o obsolete
    if any(k in cpu_lower for k in cpu_obsolete):
        note.append(f"Processore datato o a basso profilo prestazionale ({cpu}): limitato ad attivita elementari e suscettibile a rallentamenti")

    # 3. Rebrand AMD
    if any(k in cpu_lower for k in rebrand_zen2) or "7520u" in cpu_lower:
        note.append("Processore serie 7000 basato su silicio Zen 2 del 2019: architettura precedente con sole 2 unita di calcolo grafico")
    elif any(k in cpu_lower for k in rebrand_zen3plus) or "130" in cpu_lower:
        note.append("Processore Zen 3+ rimarchiato con nomenclatura recente: architettura del 2022 priva dei miglioramenti IPC di Zen 4 e Zen 5")

    # 4. Falso Gaming
    if categoria == "desktop_gaming":
        if "integrata" in gpu_lower or "uhd" in gpu_lower or "vega" in gpu_lower:
            note.append("Inserzione con etichetta gaming priva di scheda video dedicata: presente solo grafica integrata")
        elif any(k in gpu_lower for k in gpu_obsolete):
            note.append(f"Scheda video obsoleta ({gpu}): architettura datata inadatta a qualsiasi titolo 3D contemporaneo")

    # 5. Controllo alimentatore / caricatore non incluso
    if no_charger:
        note.append("Compromesso critico di dotazione: confezione priva di caricabatterie (alimentatore non fornito, da acquistare separatamente)")

    return note

def calculate_seo_priority(sku, brand, traps_notes, categoria):
    has_sku = sku and sku != "DA_VERIFICARE" and len(sku) >= 4
    has_traps = len(traps_notes) > 0

    if has_sku and has_traps:
        return "ORO", "SI"
    elif has_sku and not has_traps:
        return "ARGENTO", "SI"
    elif not has_sku and has_traps:
        return "ARGENTO", "VALUTA"
    else:
        return "BRONZO", "NO"

# ─────────────────────────────────────────────────────────────
# 4. Estrazione Dettagliata con Playwright
# ─────────────────────────────────────────────────────────────
def inspect_single_product_page(page, url):
    try:
        page.goto(url, timeout=35000)
        page.wait_for_timeout(2000)
    except Exception as e:
        print(f"Errore caricamento pagina {url}: {e}")
        return None

    title_el = page.query_selector("#productTitle")
    title = clean_text(title_el.inner_text()) if title_el else clean_text(page.title())

    # Raccogli tabella tecnica
    specs = {}
    for row in page.query_selector_all("table.prodDetTable tr, #productOverview_feature_div tr"):
        th = row.query_selector("th, td.a-span3")
        td = row.query_selector("td.prodDetAttrValue, td.a-span9")
        if th and td:
            specs[clean_text(th.inner_text())] = clean_text(td.inner_text())

    # Prezzo (gestione corretta formato italiano es. 1.199,99 € o 699,00 €)
    price = 0.0
    price_el = page.query_selector(".a-price .a-offscreen") or page.query_selector(".priceToPay")
    if price_el:
        p_m = re.search(r'(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[\.,]\d{2})', price_el.inner_text())
        if p_m:
            try:
                clean_p = p_m.group(1)
                if "." in clean_p and "," in clean_p:
                    clean_p = clean_p.replace(".", "").replace(",", ".")
                else:
                    clean_p = clean_p.replace(",", ".")
                price = round(float(clean_p), 2)
            except:
                price = 0.0

    brand = detect_brand(title, specs)
    modello = clean_model_name(title, brand, specs)
    categoria = detect_category(title, brand)
    hardware = parse_full_hardware(title, specs)

    body_text = page.inner_text("body").lower()
    no_charger = any(k in body_text for k in ["senza caricatore", "senza alimentatore", "caricatore non incluso", "alimentatore non incluso", "adattatore di alimentazione venduto separatamente"])

    return {
        "brand": brand,
        "modello": modello,
        "categoria": categoria,
        "titolo": title,
        "prezzo": price,
        "ram_gb": hardware["ram_gb"],
        "cpu": hardware["cpu"],
        "gpu": hardware["gpu"],
        "storage_gb": hardware["storage_gb"],
        "no_charger": no_charger,
        "sku": modello
    }

def scan_amazon_with_playwright(urls_to_scan, max_items_per_category=6):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright non disponibile.")
        return []

    candidati = []
    print("Avvio scansione approfondita con Playwright...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="it-IT"
        )
        page = context.new_page()

        for cat_name, cat_url in urls_to_scan.items():
            print(f"Navigazione classifica: {cat_name}")
            try:
                page.goto(cat_url, timeout=35000)
                page.wait_for_timeout(2500)
            except Exception as e:
                print(f"Errore caricamento classifica {cat_url}: {e}")
                continue

            items = page.query_selector_all("div[id*='gridItemRoot'], .p13n-sc-uncompressed-list-item, div[data-asin]")
            asins_to_inspect = []
            
            for it in items:
                links = it.query_selector_all("a[href*='/dp/']")
                for l in links:
                    href = l.get_attribute("href")
                    asin_m = re.search(r'/dp/([A-Z0-9]{10})', href)
                    if asin_m:
                        a = asin_m.group(1)
                        if a not in asins_to_inspect:
                            asins_to_inspect.append(a)
                        break
                if len(asins_to_inspect) >= max_items_per_category:
                    break

            # Ispezione dettagliata di ciascun ASIN per raccogliere specifiche tecniche certificate
            for a in asins_to_inspect:
                prod_url = f"https://www.amazon.it/dp/{a}"
                data = inspect_single_product_page(page, prod_url)
                if not data:
                    continue

                if any(k in data["titolo"].lower() for k in ["macbook", "apple", "ipad", "monitor", "display portatile", "schermo per pc"]):
                    continue

                data["asin"] = a
                data["url_amazon"] = f"https://www.amazon.it/dp/{a}?tag=pcchiaro-21"
                candidati.append(data)

        browser.close()

    return candidati

# ─────────────────────────────────────────────────────────────
# 5. Pipeline Principale di Scansione
# ─────────────────────────────────────────────────────────────
def run_scan(target_asin=None, target_file=None):
    config = load_config()
    conn = init_db()
    candidati_trovati = []

    print("\n" + "="*60)
    print("AVVIO CANDIDATI FINDER (PCCHIARO - FASE 1)")
    print("="*60)

    # 1. Se fornito ASIN mirato
    if target_asin:
        asin_clean = extract_asin(target_asin) or target_asin.strip()
        print(f"Analisi approfondita per ASIN: {asin_clean}")
        url = f"https://www.amazon.it/dp/{asin_clean}"
        
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            item = inspect_single_product_page(page, url)
            if item:
                item["asin"] = asin_clean
                item["url_amazon"] = f"https://www.amazon.it/dp/{asin_clean}?tag=pcchiaro-21"
                candidati_trovati.append(item)
            browser.close()

    # 2. Scansione Automatica Live con Playwright
    else:
        categories = {
            "notebook_bestsellers": config["amazon"]["categories"]["notebook_bestsellers"],
            "desktop_bestsellers": config["amazon"]["categories"]["desktop_bestsellers"]
        }
        candidati_trovati = scan_amazon_with_playwright(categories, max_items_per_category=6)

    # ─────────────────────────────────────────────────────────
    # 6. Valutazione e Salvataggio Candidati
    # ─────────────────────────────────────────────────────────
    elaborati = []
    print("\nANALISI QUALITATIVA E POTENZIALE EDITORIALE:")
    print("-" * 60)

    for item in candidati_trovati:
        traps = evaluate_pc_traps(
            item["prezzo"], item["ram_gb"], item["cpu"], item["gpu"], item["categoria"], config,
            no_charger=item.get("no_charger", False)
        )
        priorita, da_generare = calculate_seo_priority(item["sku"], item["brand"], traps, item["categoria"])
        
        note_affiliazione = " | ".join(traps) if traps else "Configurazione bilanciata per i componenti rilevati."

        pc_final = {
            "Da_Generare": da_generare,
            "Priorita_SEO": priorita,
            "ASIN": item["asin"],
            "Brand": item["brand"],
            "Codice_Modello": item["sku"],
            "Categoria": item["categoria"],
            "Titolo_Amazon": item["titolo"],
            "Prezzo": item["prezzo"],
            "RAM_GB": item["ram_gb"],
            "CPU": item["cpu"],
            "GPU": item["gpu"],
            "Storage_GB": item["storage_gb"],
            "Note_Affiliazione": note_affiliazione,
            "URL_Amazon": item["url_amazon"]
        }
        elaborati.append(pc_final)

        save_or_update_pc(conn, {
            "asin": item["asin"],
            "brand": item["brand"],
            "modello": pc_final["Codice_Modello"],
            "categoria": item["categoria"],
            "titolo": item["titolo"],
            "prezzo": item["prezzo"],
            "ram_gb": item["ram_gb"],
            "cpu": item["cpu"],
            "gpu": item["gpu"],
            "storage_gb": item["storage_gb"],
            "priorita_seo": priorita,
            "note_affiliazione": note_affiliazione,
            "stato": "CANDIDATO",
            "url_amazon": item["url_amazon"]
        })

        print(f"[{priorita}] {item['brand']} - {pc_final['Codice_Modello']}")
        print(f"  CPU: {item['cpu']} | RAM: {item['ram_gb']}GB | GPU: {item['gpu']}")
        print(f"  Note: {note_affiliazione}")
        print(f"  Genera Scheda: {da_generare}\n")

    # ─────────────────────────────────────────────────────────
    # 7. Esportazione CSV Intermedio
    # ─────────────────────────────────────────────────────────
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    fieldnames = [
        "Da_Generare", "Priorita_SEO", "ASIN", "Brand", "Codice_Modello",
        "Categoria", "Titolo_Amazon", "Prezzo", "RAM_GB", "CPU", "GPU",
        "Storage_GB", "Note_Affiliazione", "URL_Amazon"
    ]
    with open(OUTPUT_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        for c in elaborati:
            writer.writerow(c)

    print("=" * 60)
    print(f"Rapporto candidati generato con successo ({len(elaborati)} modelli verificati)")
    print(f"File salvato in: {OUTPUT_FILE}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PCChiaro Trova Candidati & Analisi SEO")
    parser.add_argument("--asin", help="ASIN Amazon singolo da analizzare")
    args = parser.parse_args()

    run_scan(target_asin=args.asin)
