import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

/**
 * Tabella Prodotti PC
 * Rappresenta l'hardware effettivo, con separazione chiara tra specifiche
 * verificate e componenti non dichiarati o ignoti.
 */
export const pcs = sqliteTable(
  "pcs",
  {
    id: text("id").primaryKey(),
    brand: text("brand").notNull(),
    modelName: text("model_name").notNull(),
    exactConfig: text("exact_config").notNull(),
    category: text("category").notNull(), // 'desktop_gaming' | 'desktop_office' | 'mini_pc' | 'laptop'
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),

    // Processore (CPU)
    cpuModel: text("cpu_model").notNull(),
    cpuGen: text("cpu_gen"),
    cpuCoresThreads: text("cpu_cores_threads"),
    cpuWin11Support: integer("cpu_win11_support"), // 1 = sì, 0 = no, null = non verificato

    // Scheda Video (GPU)
    gpuModel: text("gpu_model").notNull(),
    gpuVramGb: integer("gpu_vram_gb"),
    gpuType: text("gpu_type").notNull(), // 'dedicated' | 'integrated' | 'unknown'
    gpuDlssFsr: text("gpu_dlss_fsr"),

    // Memoria RAM
    ramGb: integer("ram_gb").notNull(),
    ramType: text("ram_type"), // 'DDR3' | 'DDR4' | 'DDR5' | 'unknown'
    ramChannel: text("ram_channel"), // 'single' | 'dual' | 'unknown'
    ramSpeedMhz: integer("ram_speed_mhz"),

    // Archiviazione (Storage)
    storageType: text("storage_type"), // 'NVMe' | 'SATA_SSD' | 'HDD' | 'unknown'
    storageCapacityGb: integer("storage_capacity_gb"),
    storageDetails: text("storage_details"),

    // Scheda Madre e Alimentatore (PSU)
    motherboardChipset: text("motherboard_chipset"),
    motherboardDetails: text("motherboard_details"),
    psuWattage: integer("psu_wattage"),
    psuRating: text("psu_rating"), // '80+_bronze' | '80+_gold' | 'non_certificato' | 'unknown'
    psuDetails: text("psu_details"),
    coolingDetails: text("cooling_details"),

    // Sistema Operativo
    osInstalled: text("os_installed"),
    osOfficialSupport: integer("os_official_support"), // 1 = sì, 0 = no, null = non verificato

    // Componenti omessi o non verificabili (memorizzati come array JSON di stringhe)
    unverifiedSpecs: text("unverified_specs"), // es. '["Alimentatore senza certificazione", "RAM frequenza omessa"]'

    // Stato editoriale PC
    editorialStatus: text("editorial_status").notNull().default("draft"), // 'draft' | 'published' | 'archived'

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    brandIdx: index("idx_pcs_brand").on(table.brand),
    categoryIdx: index("idx_pcs_category").on(table.category),
    statusIdx: index("idx_pcs_status").on(table.editorialStatus),
  })
);

/**
 * Tabella Recensioni
 * Collegata 1-a-1 al PC. Contiene l'analisi editoriale, i verdetti,
 * il semaforo standardizzato a 3 ambiti e la data di verifica.
 */
export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    pcId: text("pc_id")
      .notNull()
      .references(() => pcs.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),

    // Verdetto principale standardizzato
    verdict: text("verdict").notNull(), // 'sconsigliato' | 'accettabile_base' | 'conveniente_offerta' | 'buon_acquisto' | 'info_insufficienti'

    // Testi editoriali
    summaryIntro: text("summary_intro").notNull(),
    whyPositiveReviews: text("why_positive_reviews"), // analisi perché ha molte recensioni positive su Amazon
    strengths: text("strengths").notNull(), // JSON array string
    weaknesses: text("weaknesses").notNull(), // JSON array string

    // Livello delle prove
    evidenceLevel: text("evidence_level").notNull(), // 'specifiche_dichiarate' | 'verifica_indipendente' | 'test_diretto'

    // Semaforo standardizzato d'uso
    ratingGaming: text("rating_gaming").notNull(), // 'idoneo' | 'limitato' | 'non_adatto'
    notesGaming: text("notes_gaming"),
    ratingWork: text("rating_work").notNull(), // 'idoneo' | 'limitato' | 'non_adatto'
    notesWork: text("notes_work"),
    ratingOffice: text("rating_office").notNull(), // 'idoneo' | 'limitato' | 'non_adatto'
    notesOffice: text("notes_office"),

    // Valutazione economica
    amazonListingPriceEur: real("amazon_listing_price_eur"),
    estimatedFairValueEur: real("estimated_fair_value_eur"),

    // Stato editoriale della recensione
    status: text("status").notNull().default("draft"), // 'draft' | 'in_review' | 'published' | 'archived'

    publishedAt: integer("published_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: index("idx_reviews_slug").on(table.slug),
    verdictIdx: index("idx_reviews_verdict").on(table.verdict),
    statusIdx: index("idx_reviews_status").on(table.status),
    pcIdIdx: index("idx_reviews_pc_id").on(table.pcId),
  })
);

/**
 * Tabella Alternative Curate Manualmente
 * Collegamenti espliciti approvati dall'amministratore da mostrare
 * nella scheda recensione.
 */
export const curatedAlternatives = sqliteTable(
  "curated_alternatives",
  {
    id: text("id").primaryKey(),
    sourceReviewId: text("source_review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    targetPcId: text("target_pc_id")
      .notNull()
      .references(() => pcs.id, { onDelete: "restrict" }),
    intendedUse: text("intended_use").notNull(), // es. "Gaming 1080p nella stessa fascia di prezzo"
    editorialReasoning: text("editorial_reasoning").notNull(),
    prosVsSource: text("pros_vs_source"),
    consVsSource: text("cons_vs_source"),
    priceDifferenceEur: real("price_difference_eur"),
    displayOrder: integer("display_order").notNull().default(1),

    // Vincolo di sicurezza: deve essere approvato prima di apparire in pubblico
    isApproved: integer("is_approved").notNull().default(0), // 1 = approvato, 0 = in attesa
    lastVerifiedAt: integer("last_verified_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    sourceReviewIdx: index("idx_curated_alt_source").on(table.sourceReviewId),
    targetPcIdx: index("idx_curated_alt_target").on(table.targetPcId),
    approvedIdx: index("idx_curated_alt_approved").on(table.isApproved),
  })
);

/**
 * Tabella Offerte e Link Commerciali
 * Traccia URL affiliati, prezzi e data di ultima verifica manuale.
 */
export const priceOffers = sqliteTable(
  "price_offers",
  {
    id: text("id").primaryKey(),
    pcId: text("pc_id")
      .notNull()
      .references(() => pcs.id, { onDelete: "cascade" }),
    retailer: text("retailer").notNull(), // es. "Amazon.it"
    affiliateUrl: text("affiliate_url").notNull(),
    cleanUrl: text("clean_url"),
    asin: text("asin"),
    priceAmountEur: real("price_amount_eur"),
    currency: text("currency").notNull().default("EUR"),
    dataSource: text("data_source").notNull().default("manual_check"), // 'manual_check' | 'keepa' | 'creators_api'
    isValid: integer("is_valid").notNull().default(1), // 1 = valido, 0 = non disponibile/scaduto
    notes: text("notes"),
    lastVerifiedAt: integer("last_verified_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    pcIdIdx: index("idx_price_offers_pc_id").on(table.pcId),
    validIdx: index("idx_price_offers_valid").on(table.isValid),
    lastVerifiedIdx: index("idx_price_offers_last_verified").on(table.lastVerifiedAt),
  })
);

/**
 * Tabella Fonti
 * Registra le fonti consultate per l'analisi (datasheet, benchmark indipendenti, ecc.).
 */
export const sources = sqliteTable(
  "sources",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sourceName: text("source_name").notNull(),
    sourceType: text("source_type").notNull(), // 'produttore' | 'inserzione_commerciale' | 'benchmark_indipendente' | 'test_diretto' | 'community'
    consultedAt: integer("consulted_at").notNull(),
    notes: text("notes").notNull(), // cosa supporta la fonte
  },
  (table) => ({
    reviewIdIdx: index("idx_sources_review_id").on(table.reviewId),
  })
);

/**
 * Tabella Tentativi di Login
 * Utilizzata per limitare gli attacchi a forza bruta sull'area amministrativa.
 */
export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),
    ipAddress: text("ip_address").notNull(),
    attemptedAt: integer("attempted_at").notNull(),
    success: integer("success").notNull(), // 1 = successo, 0 = fallito
  },
  (table) => ({
    ipIdx: index("idx_login_attempts_ip").on(table.ipAddress),
    attemptedAtIdx: index("idx_login_attempts_time").on(table.attemptedAt),
  })
);

/**
 * Tabella Impostazioni Sito
 * Gestisce flag di configurazione dinamici modificabili dall'admin con un clic
 * (es. conformità normativa prezzi Amazon).
 */
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
