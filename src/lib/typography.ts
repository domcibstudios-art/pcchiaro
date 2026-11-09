/**
 * Normalizzazione tipografica italiana per PCChiaro
 * Risolve spazi scorretti prima o dopo gli apostrofi (es. "l 'acquisto", "un 'offerta", "d 'ufficio")
 */
export function fixItalianApostrophes(text: string | null | undefined): string {
  if (!text) return "";
  return text
    // Rimuove spazio dopo elisioni/troncamenti italiani prima dell'apostrofo: "l 'acquisto" -> "l'acquisto"
    .replace(/\b(l|un|d|dell|all|nell|sull|dall|quest|senz|quant|poc|tant|tropp|ch)\s+['’]/gi, "$1'")
    // Rimuove spazio dopo l'apostrofo di elisione: "l' acquisto" -> "l'acquisto"
    .replace(/\b(l|un|d|dell|all|nell|sull|dall|quest|senz|quant|poc|tant|tropp|ch)['’]\s+/gi, "$1'")
    // Rimuove apostrofo isolato tra due spazi
    .replace(/\s+['’]\s+/g, " ");
}
