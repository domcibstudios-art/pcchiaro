PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_smiling_pepper_potts.sql','2026-10-29 13:34:45');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0001_wide_starjammers.sql','2026-10-29 13:34:45');
CREATE TABLE `curated_alternatives` (
	`id` text PRIMARY KEY NOT NULL,
	`source_review_id` text NOT NULL,
	`target_pc_id` text NOT NULL,
	`intended_use` text NOT NULL,
	`editorial_reasoning` text NOT NULL,
	`pros_vs_source` text,
	`cons_vs_source` text,
	`price_difference_eur` real,
	`display_order` integer DEFAULT 1 NOT NULL,
	`is_approved` integer DEFAULT 0 NOT NULL,
	`last_verified_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`source_review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_pc_id`) REFERENCES `pcs`(`id`) ON UPDATE no action ON DELETE restrict
);
INSERT INTO "curated_alternatives" ("id","source_review_id","target_pc_id","intended_use","editorial_reasoning","pros_vs_source","cons_vs_source","price_difference_eur","display_order","is_approved","last_verified_at","created_at") VALUES('f371ab3e-b4c4-4b8d-993a-a1e3a85c2bc2','b0efd90b-b34f-4623-8254-a84b91499466','4060b3ed-3f76-4dda-9d89-fb38145cd04e','Studio, lavoro d''ufficio e produttivita quotidiana','A parita di fascia di mercato offre 16 GB di memoria RAM e un processore di architettura piu recente, garantendo longevita e assenza di strozzature durante l''uso quotidiano.',NULL,NULL,NULL,1,1,1793202416031,1793200903624);
INSERT INTO "curated_alternatives" ("id","source_review_id","target_pc_id","intended_use","editorial_reasoning","pros_vs_source","cons_vs_source","price_difference_eur","display_order","is_approved","last_verified_at","created_at") VALUES('aa562d51-489e-49b7-9890-16f52ffec43e','eab3b237-76eb-4b31-aae9-6163b29b8a43','400255f8-3daa-4b18-8475-d4fde5a5bba4','Studio, lavoro d''ufficio e produttivita quotidiana','A parita di fascia di mercato offre 16 GB di memoria RAM e un processore di architettura piu recente, garantendo longevita e assenza di strozzature durante l''uso quotidiano.',NULL,NULL,NULL,1,1,1793202416031,1793200903624);
CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`ip_address` text NOT NULL,
	`attempted_at` integer NOT NULL,
	`success` integer NOT NULL
);
INSERT INTO "login_attempts" ("id","ip_address","attempted_at","success") VALUES('b4541f2b-d329-47e1-ae2d-5673dafb1252','93.40.184.53',1793281254881,1);
CREATE TABLE `pcs` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`model_name` text NOT NULL,
	`exact_config` text NOT NULL,
	`category` text NOT NULL,
	`image_url` text,
	`image_alt` text,
	`cpu_model` text NOT NULL,
	`cpu_gen` text,
	`cpu_cores_threads` text,
	`cpu_win11_support` integer,
	`gpu_model` text NOT NULL,
	`gpu_vram_gb` integer,
	`gpu_type` text NOT NULL,
	`gpu_dlss_fsr` text,
	`ram_gb` integer NOT NULL,
	`ram_type` text,
	`ram_channel` text,
	`ram_speed_mhz` integer,
	`storage_type` text,
	`storage_capacity_gb` integer,
	`storage_details` text,
	`motherboard_chipset` text,
	`motherboard_details` text,
	`psu_wattage` integer,
	`psu_rating` text,
	`psu_details` text,
	`cooling_details` text,
	`os_installed` text,
	`os_official_support` integer,
	`unverified_specs` text,
	`editorial_status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
INSERT INTO "pcs" ("id","brand","model_name","exact_config","category","image_url","image_alt","cpu_model","cpu_gen","cpu_cores_threads","cpu_win11_support","gpu_model","gpu_vram_gb","gpu_type","gpu_dlss_fsr","ram_gb","ram_type","ram_channel","ram_speed_mhz","storage_type","storage_capacity_gb","storage_details","motherboard_chipset","motherboard_details","psu_wattage","psu_rating","psu_details","cooling_details","os_installed","os_official_support","unverified_specs","editorial_status","created_at","updated_at") VALUES('bce71a5a-1657-4ceb-a860-7ac754aa6694','Lenovo','IdeaPad Slim 3 (82XQ00EBUS)','AMD Ryzen 5 7520U / AMD Radeon 610M / 8GB / 256GB','laptop',NULL,NULL,'AMD Ryzen 5 7520U','Zen 2 (Mendocino)',NULL,1,'AMD Radeon 610M',0,'integrated',NULL,8,'LPDDR5','single',NULL,'NVMe',256,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11',1,NULL,'published',1793200903624,1793202416031);
INSERT INTO "pcs" ("id","brand","model_name","exact_config","category","image_url","image_alt","cpu_model","cpu_gen","cpu_cores_threads","cpu_win11_support","gpu_model","gpu_vram_gb","gpu_type","gpu_dlss_fsr","ram_gb","ram_type","ram_channel","ram_speed_mhz","storage_type","storage_capacity_gb","storage_details","motherboard_chipset","motherboard_details","psu_wattage","psu_rating","psu_details","cooling_details","os_installed","os_official_support","unverified_specs","editorial_status","created_at","updated_at") VALUES('5f959680-f21d-4521-bbae-3e589e13a33c','Acer','Aspire Lite 15 (AL15-31P)','Intel Celeron N4500 / Intel UHD Graphics / 8GB / 128GB','laptop',NULL,NULL,'Intel Celeron N4500','Architettura Standard',NULL,1,'Intel UHD Graphics',0,'integrated',NULL,8,'DDR4','single',NULL,'eMMC',128,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11',1,NULL,'published',1793200903624,1793202416031);
INSERT INTO "pcs" ("id","brand","model_name","exact_config","category","image_url","image_alt","cpu_model","cpu_gen","cpu_cores_threads","cpu_win11_support","gpu_model","gpu_vram_gb","gpu_type","gpu_dlss_fsr","ram_gb","ram_type","ram_channel","ram_speed_mhz","storage_type","storage_capacity_gb","storage_details","motherboard_chipset","motherboard_details","psu_wattage","psu_rating","psu_details","cooling_details","os_installed","os_official_support","unverified_specs","editorial_status","created_at","updated_at") VALUES('4060b3ed-3f76-4dda-9d89-fb38145cd04e','ASUS','Vivobook 15 F1504MA-BQ111W','Intel Core 5 120U / Intel Graphics / 16GB / 512GB','laptop',NULL,NULL,'Intel Core 5 120U','Raptor Lake Refresh (2024)',NULL,1,'Intel Graphics',0,'integrated',NULL,16,'DDR5','dual',NULL,'NVMe',512,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11',1,NULL,'published',1793200903624,1793202416031);
INSERT INTO "pcs" ("id","brand","model_name","exact_config","category","image_url","image_alt","cpu_model","cpu_gen","cpu_cores_threads","cpu_win11_support","gpu_model","gpu_vram_gb","gpu_type","gpu_dlss_fsr","ram_gb","ram_type","ram_channel","ram_speed_mhz","storage_type","storage_capacity_gb","storage_details","motherboard_chipset","motherboard_details","psu_wattage","psu_rating","psu_details","cooling_details","os_installed","os_official_support","unverified_specs","editorial_status","created_at","updated_at") VALUES('400255f8-3daa-4b18-8475-d4fde5a5bba4','Lenovo','IdeaPad Slim 3 15','AMD Ryzen 5 7520U / AMD Radeon 610M / 16GB / 512GB','laptop',NULL,NULL,'AMD Ryzen 5 7520U','Zen 2 (Mendocino)',NULL,1,'AMD Radeon 610M',0,'integrated',NULL,16,'LPDDR5','dual',NULL,'NVMe',512,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11',1,NULL,'published',1793200903624,1793202416031);
CREATE TABLE `price_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`pc_id` text NOT NULL,
	`retailer` text NOT NULL,
	`affiliate_url` text NOT NULL,
	`clean_url` text,
	`asin` text,
	`price_amount_eur` real,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`data_source` text DEFAULT 'manual_check' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`last_verified_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pc_id`) REFERENCES `pcs`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "price_offers" ("id","pc_id","retailer","affiliate_url","clean_url","asin","price_amount_eur","currency","data_source","is_valid","notes","last_verified_at","created_at") VALUES('62f6fcf3-3e5e-4ca9-9808-6fa9d4db6191','bce71a5a-1657-4ceb-a860-7ac754aa6694','Amazon.it','https://www.amazon.it/dp/B0F6NQFBWN?tag=pcchiaro-21',NULL,'B0F6NQFBWN',563.73,'EUR','csv_import',1,NULL,1793202416031,1793200903624);
INSERT INTO "price_offers" ("id","pc_id","retailer","affiliate_url","clean_url","asin","price_amount_eur","currency","data_source","is_valid","notes","last_verified_at","created_at") VALUES('4024bebb-78c2-4b69-a496-dc4a005677e1','5f959680-f21d-4521-bbae-3e589e13a33c','Amazon.it','https://www.amazon.it/dp/B0GJ66DYPS?tag=pcchiaro-21',NULL,'B0GJ66DYPS',334.84,'EUR','csv_import',1,NULL,1793202416031,1793200903624);
INSERT INTO "price_offers" ("id","pc_id","retailer","affiliate_url","clean_url","asin","price_amount_eur","currency","data_source","is_valid","notes","last_verified_at","created_at") VALUES('34256b3a-37f6-435f-bb09-abe1923a1a85','4060b3ed-3f76-4dda-9d89-fb38145cd04e','Amazon.it','https://www.amazon.it/dp/B0H261K2KN?tag=pcchiaro-21',NULL,'B0H261K2KN',967,'EUR','csv_import',1,NULL,1793202416031,1793200903624);
INSERT INTO "price_offers" ("id","pc_id","retailer","affiliate_url","clean_url","asin","price_amount_eur","currency","data_source","is_valid","notes","last_verified_at","created_at") VALUES('39a25416-7052-43d2-8be8-da8e655af764','400255f8-3daa-4b18-8475-d4fde5a5bba4','Amazon.it','https://www.amazon.it/dp/B0CYM8L6B7?tag=pcchiaro-21',NULL,'B0CYM8L6B7',419,'EUR','csv_import',1,NULL,1793202416031,1793200903624);
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`pc_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`meta_title` text,
	`meta_description` text,
	`verdict` text NOT NULL,
	`summary_intro` text NOT NULL,
	`why_positive_reviews` text,
	`strengths` text NOT NULL,
	`weaknesses` text NOT NULL,
	`evidence_level` text NOT NULL,
	`rating_gaming` text NOT NULL,
	`notes_gaming` text,
	`rating_work` text NOT NULL,
	`notes_work` text,
	`rating_office` text NOT NULL,
	`notes_office` text,
	`amazon_listing_price_eur` real,
	`estimated_fair_value_eur` real,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`pc_id`) REFERENCES `pcs`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "reviews" ("id","pc_id","slug","title","meta_title","meta_description","verdict","summary_intro","why_positive_reviews","strengths","weaknesses","evidence_level","rating_gaming","notes_gaming","rating_work","notes_work","rating_office","notes_office","amazon_listing_price_eur","estimated_fair_value_eur","status","published_at","updated_at") VALUES('b0efd90b-b34f-4623-8254-a84b91499466','bce71a5a-1657-4ceb-a860-7ac754aa6694','lenovo-ideapad-slim-3-82xq00ebus-amd-ryzen-5-7520u-amd-radeo-b0f6nqfbwn','Lenovo IdeaPad Slim 3 (82XQ00EBUS) (AMD Ryzen 5 7520U + AMD Radeon 610M)','Lenovo IdeaPad Slim 3 (82XQ00EBUS) (AMD Ryzen 5 7520U): Recensione & Test | PCChiaro','Recensione di Lenovo IdeaPad Slim 3 (82XQ00EBUS) (AMD Ryzen 5 7520U, AMD Radeon 610M, 8GB LPDDR5, 256GB NVMe). Verdetto: Sconsigliato (Trappola Hardware)....','sconsigliato','Configurazione che evidenzia criticita tecniche rilevanti: il modello Lenovo IdeaPad Slim 3 (82XQ00EBUS) viene proposto con soli 8 GB di memoria RAM e processore AMD Ryzen 5 7520U (Zen 2 (Mendocino)). La ridotta dotazione di memoria e l''architettura dei componenti rappresentano un collo di bottiglia concreto per l''uso prolungato e il multitasking, rendendo la macchina suscettibile a rallentamenti precoci.',NULL,'["Supporto ufficiale e nativo per Windows 11"]','["Presenza di soli 8 GB di RAM: quantitativo insufficiente per assicurare longevita e multitasking fluido","Trappola della serie 7000: la terza cifra 2 indica architettura Zen 2 del 2019, non Zen 4 Prestazioni grafiche minime (2 CU)."]','specifiche_dichiarate','non_adatto','Grafica integrata AMD Radeon 610M: concepita per streaming video e grafica 2D, non adatta al gaming 3D contemporaneo.','limitato','Collo di bottiglia legato agli 8 GB di RAM: saturazione rapida della memoria con piu schede del browser e applicativi attivi.','idoneo','Ottimo per navigazione web, gestione documenti Word ed Excel e streaming ad alta definizione.',563.73,379,'published',1793281371530,1793281371530);
INSERT INTO "reviews" ("id","pc_id","slug","title","meta_title","meta_description","verdict","summary_intro","why_positive_reviews","strengths","weaknesses","evidence_level","rating_gaming","notes_gaming","rating_work","notes_work","rating_office","notes_office","amazon_listing_price_eur","estimated_fair_value_eur","status","published_at","updated_at") VALUES('eab3b237-76eb-4b31-aae9-6163b29b8a43','5f959680-f21d-4521-bbae-3e589e13a33c','acer-aspire-lite-15-al15-31p-intel-celeron-n4500-intel-uhd-g-b0gj66dyps','Acer Aspire Lite 15 (AL15-31P) (Intel Celeron N4500 + Intel UHD Graphics)','Acer Aspire Lite 15 (AL15-31P) (Intel Celeron N4500): Recensione & Test | PCChiaro','Recensione di Acer Aspire Lite 15 (AL15-31P) (Intel Celeron N4500, Intel UHD Graphics, 8GB DDR4, 128GB eMMC). Verdetto: Sconsigliato (Trappola Hardware). L...','sconsigliato','Configurazione che evidenzia criticita tecniche rilevanti: il modello Acer Aspire Lite 15 (AL15-31P) viene proposto con soli 8 GB di memoria RAM e processore Intel Celeron N4500 (Architettura Standard). La ridotta dotazione di memoria e l''architettura dei componenti rappresentano un collo di bottiglia concreto per l''uso prolungato e il multitasking, rendendo la macchina suscettibile a rallentamenti precoci.',NULL,'["Supporto ufficiale e nativo per Windows 11"]','["Presenza di soli 8 GB di RAM: quantitativo insufficiente per assicurare longevita e multitasking fluido","Rapporto qualita prezzo sfavorevole rispetto alle alternative di mercato con 16 GB di RAM e processori piu moderni"]','specifiche_dichiarate','non_adatto','Grafica integrata Intel UHD Graphics: concepita per streaming video e grafica 2D, non adatta al gaming 3D contemporaneo.','limitato','Collo di bottiglia legato agli 8 GB di RAM: saturazione rapida della memoria con piu schede del browser e applicativi attivi.','idoneo','Ottimo per navigazione web, gestione documenti Word ed Excel e streaming ad alta definizione.',334.84,220,'published',NULL,1793202416031);
INSERT INTO "reviews" ("id","pc_id","slug","title","meta_title","meta_description","verdict","summary_intro","why_positive_reviews","strengths","weaknesses","evidence_level","rating_gaming","notes_gaming","rating_work","notes_work","rating_office","notes_office","amazon_listing_price_eur","estimated_fair_value_eur","status","published_at","updated_at") VALUES('b9747b15-40a8-4411-943d-9f0a9d1bdae6','4060b3ed-3f76-4dda-9d89-fb38145cd04e','asus-vivobook-15-f1504ma-intel-core-5-120u-16gb-ddr5-b0h261k2kn','ASUS Vivobook 15 F1504MA (Intel Core 5 120U + 16GB DDR5)','ASUS Vivobook 15 F1504MA-BQ111W (Intel Core 5 120U): Recensione & Test | PCChiaro','Recensione di ASUS Vivobook 15 F1504MA-BQ111W (Intel Core 5 120U, Intel Graphics, 16GB DDR5, 512GB NVMe). Verdetto: Conveniente solo in offerta. Limiti rea...','conveniente_offerta','Notebook valido per produttivita e studio intensivo, caratterizzato da 16 GB di RAM DDR5 moderna e processore Intel a 10 core. La valutazione favorevole e tuttavia strettamente vincolata al prezzo di acquisto: a quotazioni congrue con la soglia di convenienza hardware rappresenta una scelta eccellente, mentre in presenza di rincari dovuti a commercianti terzi sul marketplace il rapporto qualita prezzo decade a favore di alternative di fascia superiore.',NULL,'["Dotazione di 16 GB di RAM moderna ad alta velocita","Processore a 10 core reattivo ed efficiente","Schermo IPS nitido con cerniera a 180 gradi"]','["Assenza del caricabatterie in confezione: alimentatore non fornito in dotazione (da acquistare a parte)","Prezzo attuale elevato su Amazon a causa della vendita tramite commercianti terzi","Grafica integrata non adatta al gaming 3D contemporaneo"]','specifiche_dichiarate','limitato','Adatto per eSports leggeri e compiti multimediali.','idoneo','Dotazione di 16 GB di RAM ideale per multitasking intenso e produttivita avanzata senza rallentamenti.','idoneo','Eccellente reattivita per suite Office, navigazione web con numerose schede e fruizione multimediale.',967,549,'published',NULL,1793202416031);
INSERT INTO "reviews" ("id","pc_id","slug","title","meta_title","meta_description","verdict","summary_intro","why_positive_reviews","strengths","weaknesses","evidence_level","rating_gaming","notes_gaming","rating_work","notes_work","rating_office","notes_office","amazon_listing_price_eur","estimated_fair_value_eur","status","published_at","updated_at") VALUES('fb54d18e-4174-4ffa-8ad2-18a34e690de4','400255f8-3daa-4b18-8475-d4fde5a5bba4','lenovo-ideapad-slim-3-15-ryzen-5-7520u-16gb-ram-b0cym8l6b7','Lenovo IdeaPad Slim 3 15 (Ryzen 5 7520U + 16GB RAM)','Lenovo IdeaPad Slim 3 15 (AMD Ryzen 5 7520U): Recensione & Test | PCChiaro','Recensione di Lenovo IdeaPad Slim 3 15 (AMD Ryzen 5 7520U, AMD Radeon 610M, 16GB LPDDR5, 512GB NVMe). Verdetto: Buon Acquisto. Limiti reali, test e alterna...','buon_acquisto','Portatile ideale per navigazione, studio universitario e lavoro d ufficio leggero. Si distingue dai rivali della stessa fascia economica per la presenza di 16 GB di RAM garantiti e un solido SSD NVMe da 512 GB.',NULL,'["Memoria di sistema da 16 GB che scongiura i tipici rallentamenti di Windows 11","SSD capiente e veloce da 512 GB","Display IPS confortevole per la lettura"]','["Processore basato su architettura Zen 2 con prestazioni grafiche essenziali","Memoria RAM saldata non espandibile"]','specifiche_dichiarate','limitato','Adatto per eSports leggeri e compiti multimediali.','idoneo','Dotazione di 16 GB di RAM ideale per multitasking intenso e produttivita avanzata senza rallentamenti.','idoneo','Eccellente reattivita per suite Office, navigazione web con numerose schede e fruizione multimediale.',419,419,'published',NULL,1793202416031);
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`url` text NOT NULL,
	`source_name` text NOT NULL,
	`source_type` text NOT NULL,
	`consulted_at` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
INSERT INTO "site_settings" ("key","value","updated_at") VALUES('amazon_affiliate_tag','',1793208332125);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',2);
CREATE INDEX `idx_curated_alt_source` ON `curated_alternatives` (`source_review_id`);
CREATE INDEX `idx_curated_alt_target` ON `curated_alternatives` (`target_pc_id`);
CREATE INDEX `idx_curated_alt_approved` ON `curated_alternatives` (`is_approved`);
CREATE INDEX `idx_login_attempts_ip` ON `login_attempts` (`ip_address`);
CREATE INDEX `idx_login_attempts_time` ON `login_attempts` (`attempted_at`);
CREATE INDEX `idx_pcs_brand` ON `pcs` (`brand`);
CREATE INDEX `idx_pcs_category` ON `pcs` (`category`);
CREATE INDEX `idx_pcs_status` ON `pcs` (`editorial_status`);
CREATE INDEX `idx_price_offers_pc_id` ON `price_offers` (`pc_id`);
CREATE INDEX `idx_price_offers_valid` ON `price_offers` (`is_valid`);
CREATE INDEX `idx_price_offers_last_verified` ON `price_offers` (`last_verified_at`);
CREATE UNIQUE INDEX `reviews_slug_unique` ON `reviews` (`slug`);
CREATE INDEX `idx_reviews_slug` ON `reviews` (`slug`);
CREATE INDEX `idx_reviews_verdict` ON `reviews` (`verdict`);
CREATE INDEX `idx_reviews_status` ON `reviews` (`status`);
CREATE INDEX `idx_reviews_pc_id` ON `reviews` (`pc_id`);
CREATE INDEX `idx_sources_review_id` ON `sources` (`review_id`);
