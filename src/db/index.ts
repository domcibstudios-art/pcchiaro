import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Assicura che la directory del database esista
const dbPath = process.env.DATABASE_URL || "./data/pcchiaro.db";
const resolvedPath = path.resolve(process.cwd(), dbPath);
const dbDir = path.dirname(resolvedPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Inizializza l'istanza SQLite nativa
export const sqlite = new Database(resolvedPath);

// Abilita le foreign key e il Write-Ahead Logging (WAL) per prestazioni ottimali e integrità
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

// Esporta il client Drizzle tipizzato con il nostro schema
export const db = drizzle(sqlite, { schema });
