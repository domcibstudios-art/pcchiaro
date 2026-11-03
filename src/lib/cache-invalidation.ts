import { revalidatePath } from "next/cache";

export interface InvalidationParams {
  slug?: string;
  paths?: string[];
  tags?: string[];
}

export interface InvalidationEvent {
  timestamp: number;
  slug?: string;
  paths: string[];
  tags: string[];
  cachesPurged: boolean;
  workerCachePurged: boolean;
  errors: string[];
}

// Registro in memoria per audit e verifica automatica nei test
const invalidationLog: InvalidationEvent[] = [];

export function getCacheInvalidationLog(): InvalidationEvent[] {
  return [...invalidationLog];
}

export function clearCacheInvalidationLog(): void {
  invalidationLog.length = 0;
}

/**
 * Risolve l'origine corretta per le richieste di purge della Cache API,
 * evitando discrepanze tra localhost, workers.dev e domini personalizzati.
 */
async function resolveRequestOrigin(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("host") || h.get("x-forwarded-host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // Esecuzione fuori da contesto richiesta Next (es. test unitari)
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pcchiaro.domcibstudios.workers.dev";
}

/**
 * Invalida la cache pubblica (Workers Cache, Edge Cache e Next.js ISR)
 * in modo mirato e coordinato quando un'operazione amministrativa aggiorna i dati.
 */
export async function invalidatePublicCache(params: InvalidationParams = {}): Promise<InvalidationEvent> {
  const errors: string[] = [];
  const pathsToRevalidate = new Set<string>(params.paths || []);
  
  // Tag di invalidazione predefiniti perfettamente allineati con next.config.ts:
  // - "/" emette: public-page, homepage, reviews
  // - "/sitemap.xml" emette: public-page, sitemap
  // - "/recensioni/:slug*" emette: public-page, reviews, review-detail
  const tagsToPurge = new Set<string>(params.tags || [
    "public-page",
    "reviews",
    "homepage",
    "sitemap",
  ]);

  // Homepage e Sitemap dipendono sempre dalle modifiche editoriali (recensioni, prezzi, stato)
  pathsToRevalidate.add("/");
  pathsToRevalidate.add("/sitemap.xml");

  if (params.slug) {
    pathsToRevalidate.add(`/recensioni/${params.slug}`);
    tagsToPurge.add("review-detail");
    tagsToPurge.add(`review-${params.slug}`);
  }

  const pathsArray = Array.from(pathsToRevalidate);
  const tagsArray = Array.from(tagsToPurge);

  // 1. Next.js on-demand ISR revalidation per percorsi concreti e pattern
  for (const path of pathsArray) {
    try {
      revalidatePath(path);
      revalidatePath(path, "page");
    } catch (err: unknown) {
      // Ignorato se eseguito in test isolato o script senza contesto Next
    }
  }
  if (params.slug) {
    try {
      revalidatePath("/recensioni/[slug]", "page");
    } catch {
      // Ignorato fuori contesto
    }
  }

  // 2. Cloudflare Cache API (caches.default): pulizia best-effort locale al singolo PoP/data center.
  // NOTA BENE: caches.default.delete() NON è un purge globale; elimina la voce esclusivamente
  // nella cache del data center in cui viene eseguita la richiesta corrente.
  let cachesPurged = false;
  try {
    const defaultCache = (globalThis as any).caches?.default;
    if (defaultCache && typeof defaultCache.delete === "function") {
      const origin = await resolveRequestOrigin();
      for (const p of pathsArray) {
        const fullUrl = new URL(p, origin).toString();
        await defaultCache.delete(new Request(fullUrl));
      }
      cachesPurged = true;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Errore Cache API delete (PoP locale): ${msg}`);
  }

  // 3. Cloudflare Workers Cache: purge globale per tag (meccanismo previsto per Workers Cache).
  // Eseguito tramite ExecutionContext (ctx.cache.purge) reso disponibile da OpenNext via AsyncLocalStorage
  // durante l'esecuzione della Server Action, oppure tramite il modulo 'cloudflare:workers'.
  let workerCachePurged = false;
  try {
    // A) Tramite ExecutionContext di OpenNext (ctx.cache)
    const { getCloudflareContext } = await import("@opennextjs/cloudflare").catch(() => ({} as any));
    if (typeof getCloudflareContext === "function") {
      const cfCtx = await getCloudflareContext({ async: true }).catch(() => null);
      if (cfCtx?.ctx?.cache && typeof cfCtx.ctx.cache.purge === "function") {
        await cfCtx.ctx.cache.purge({ tags: tagsArray });
        workerCachePurged = true;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Errore OpenNext ctx.cache.purge: ${msg}`);
  }

  if (!workerCachePurged) {
    try {
      // B) Tramite modulo cloudflare:workers nativo
      const cfModule = "cloudflare:workers";
      const cf = await import(/* webpackIgnore: true */ cfModule).catch(() => null);
      if (cf?.cache && typeof cf.cache.purge === "function") {
        await cf.cache.purge({ tags: tagsArray });
        workerCachePurged = true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Errore cloudflare:workers cache.purge: ${msg}`);
    }
  }

  const event: InvalidationEvent = {
    timestamp: Date.now(),
    slug: params.slug,
    paths: pathsArray,
    tags: tagsArray,
    cachesPurged,
    workerCachePurged,
    errors,
  };

  invalidationLog.push(event);
  return event;
}
