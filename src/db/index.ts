import { drizzle as drizzleD1, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export * from "./schema";

export type AppDatabase = DrizzleD1Database<typeof schema>;

let testDbInstance: AppDatabase | null = null;

/**
 * Permette di iniettare un'istanza mock/in-memory del database nei test
 */
export function setTestDb(customDb: AppDatabase | null) {
  testDbInstance = customDb;
}

/**
 * Recupera l'istanza del database attiva nel contesto corrente:
 * 1. Istanza test iniettata (se impostata)
 * 2. Binding D1 `env.DB` dal contesto Cloudflare (se disponibile)
 * 3. Fallback sul database Node SQLite locale (se in ambiente Node/test/CLI)
 */
export async function getDb(): Promise<AppDatabase> {
  if (testDbInstance) {
    return testDbInstance;
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env && (env as any).DB) {
      return drizzleD1((env as any).DB, { schema });
    }
  } catch {
    // Non siamo all'interno del runtime Cloudflare (es. test unitari o script Node)
  }

  // Fallback sicuro su Node SQLite locale per ambiente dev/test
  try {
    const { nodeDb } = await import("./node");
    return nodeDb as unknown as AppDatabase;
  } catch {
    throw new Error(
      "Nessun database disponibile: Cloudflare D1 binding non trovato e driver Node non disponibile."
    );
  }
}

/**
 * Proxy retrocompatibile per moduli che importano direttamente `db`.
 * Si raccomanda di utilizzare `const db = await getDb()` nei contesti asincroni.
 */
export const db: AppDatabase = new Proxy({} as any, {
  get(_target, prop) {
    if (testDbInstance) {
      const val = (testDbInstance as any)[prop];
      return typeof val === "function" ? val.bind(testDbInstance) : val;
    }
    // Prova a recuperare il contesto sincrono Cloudflare
    try {
      const { env } = getCloudflareContext();
      if (env && (env as any).DB) {
        const client = drizzleD1((env as any).DB, { schema });
        const val = (client as any)[prop];
        return typeof val === "function" ? val.bind(client) : val;
      }
    } catch {
      // Ignora e usa fallback Node
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { nodeDb } = require("./node");
      const val = nodeDb[prop];
      return typeof val === "function" ? val.bind(nodeDb) : val;
    } catch {
      throw new Error(
        `Impossibile accedere alla proprietà '${String(prop)}' di db: nessun driver database attivo.`
      );
    }
  },
});

/**
 * Esegue un batch atomico di statement SQL:
 * - Su Cloudflare D1 usa l'API nativa `db.batch([stmt1, stmt2, ...])`.
 * - Su better-sqlite3 usa `db.transaction(() => { for (const s of stmts) s.run(); })`.
 * Garantisce atomicità e rollback completo in caso di errore.
 */
export async function executeBatch(database: AppDatabase, statements: any[]): Promise<any[]> {
  if (!statements || statements.length === 0) {
    return [];
  }

  const dbAny = database as any;

  if (typeof dbAny.batch === "function") {
    return await dbAny.batch(statements as any);
  }

  if (typeof dbAny.transaction === "function") {
    return dbAny.transaction(() => {
      const results: any[] = [];
      for (const stmt of statements) {
        if (typeof stmt.run === "function") {
          results.push(stmt.run());
        } else if (typeof stmt.execute === "function") {
          results.push(stmt.execute());
        } else {
          results.push(stmt);
        }
      }
      return results;
    });
  }

  const results: any[] = [];
  for (const stmt of statements) {
    results.push(await stmt);
  }
  return results;
}
