import { getAmazonAffiliateTag } from "./settings";

/**
 * Estrae l'ASIN (Amazon Standard Identification Number) da un URL Amazon
 */
export function extractAsinFromAmazonUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:\/dp\/|\/gp\/product\/|\/asin\/|dp\/)([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Pulisce un URL Amazon rimuovendo tracking invasivo (crid, dib, qid, ref, ecc.)
 * Restituisce una struttura standard pulita: https://www.amazon.it/dp/{ASIN}
 */
export function cleanAmazonUrl(urlOrAsin: string): string {
  if (!urlOrAsin) return "https://www.amazon.it";
  const trimmed = urlOrAsin.trim();

  // Se è già un ASIN di 10 caratteri
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
    return `https://www.amazon.it/dp/${trimmed.toUpperCase()}`;
  }

  const asin = extractAsinFromAmazonUrl(trimmed);
  if (asin) {
    return `https://www.amazon.it/dp/${asin}`;
  }

  // Se non è stato possibile estrarre l'ASIN, rimuove i query params superflui
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return trimmed;
  }
}

/**
 * Costruisce il link di affiliazione centralizzato.
 * 
 * - Se è configurato un tag di affiliazione (da DB o da .env), lo inietta come `?tag={tag}`.
 * - Se non è configurato alcun tag (es. in attesa di approvazione account da Amazon),
 *   restituisce il link pulito senza parametri o tag inventati.
 * - Se l'URL di partenza conteneva già un vecchio tag, lo sostituisce con quello ufficiale centralizzato.
 */
export function buildAffiliateUrl(
  rawUrlOrAsin: string | null | undefined,
  customTag?: string
): string {
  if (!rawUrlOrAsin) return "#";
  const trimmed = rawUrlOrAsin.trim();
  if (trimmed === "#" || !trimmed) return "#";

  const cleanUrl = cleanAmazonUrl(trimmed);
  const tag = customTag !== undefined ? customTag.trim() : getAmazonAffiliateTag().trim();

  if (!tag) {
    // Nessun account/tag ancora configurato: restituisce URL Amazon pulito
    return cleanUrl;
  }

  try {
    const urlObj = new URL(cleanUrl);
    urlObj.searchParams.set("tag", tag);
    return urlObj.toString();
  } catch {
    const separator = cleanUrl.includes("?") ? "&" : "?";
    return `${cleanUrl}${separator}tag=${encodeURIComponent(tag)}`;
  }
}
