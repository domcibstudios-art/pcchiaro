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
--> statement-breakpoint
CREATE INDEX `idx_curated_alt_source` ON `curated_alternatives` (`source_review_id`);--> statement-breakpoint
CREATE INDEX `idx_curated_alt_target` ON `curated_alternatives` (`target_pc_id`);--> statement-breakpoint
CREATE INDEX `idx_curated_alt_approved` ON `curated_alternatives` (`is_approved`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`ip_address` text NOT NULL,
	`attempted_at` integer NOT NULL,
	`success` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_login_attempts_ip` ON `login_attempts` (`ip_address`);--> statement-breakpoint
CREATE INDEX `idx_login_attempts_time` ON `login_attempts` (`attempted_at`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `idx_pcs_brand` ON `pcs` (`brand`);--> statement-breakpoint
CREATE INDEX `idx_pcs_category` ON `pcs` (`category`);--> statement-breakpoint
CREATE INDEX `idx_pcs_status` ON `pcs` (`editorial_status`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `idx_price_offers_pc_id` ON `price_offers` (`pc_id`);--> statement-breakpoint
CREATE INDEX `idx_price_offers_valid` ON `price_offers` (`is_valid`);--> statement-breakpoint
CREATE INDEX `idx_price_offers_last_verified` ON `price_offers` (`last_verified_at`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_slug_unique` ON `reviews` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_reviews_slug` ON `reviews` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_reviews_verdict` ON `reviews` (`verdict`);--> statement-breakpoint
CREATE INDEX `idx_reviews_status` ON `reviews` (`status`);--> statement-breakpoint
CREATE INDEX `idx_reviews_pc_id` ON `reviews` (`pc_id`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `idx_sources_review_id` ON `sources` (`review_id`);