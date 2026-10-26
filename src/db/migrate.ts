import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./index";
import path from "path";

export function runMigrations() {
  console.log("==> Esecuzione migrazioni SQLite in corso...");
  const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");
  
  try {
    migrate(db, { migrationsFolder });
    console.log("==> Migrazioni completate con successo!");
  } catch (error) {
    console.error("==> Errore durante l'esecuzione delle migrazioni:", error);
    throw error;
  }
}

// Se invocato direttamente da CLI
if (require.main === module || process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations();
  sqlite.close();
}
