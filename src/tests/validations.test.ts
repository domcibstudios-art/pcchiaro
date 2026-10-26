import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { pcSchema, reviewSchema, validateForPublication } from "../lib/validations";

describe("Validazioni Dati con Zod", () => {
  test("Validazione PC con dati conformi", () => {
    const validPc = {
      id: "pc-test-ok",
      brand: "Megaport",
      modelName: "Gaming PC",
      exactConfig: "i7-4770, 16GB, GTX 1650",
      category: "desktop_gaming",
      cpuModel: "Intel Core i7-4770",
      gpuModel: "GTX 1650",
      gpuType: "dedicated",
      ramGb: 16,
      unverifiedSpecs: ["Alimentatore sconosciuto"],
      editorialStatus: "draft",
    };

    const parsed = pcSchema.safeParse(validPc);
    assert.ok(parsed.success, "Il PC valido deve passare la validazione");
  });

  test("Rifiuto PC con RAM non valida o campi obbligatori mancanti", () => {
    const invalidPc = {
      id: "pc-test-fail",
      brand: "",
      modelName: "Gaming PC",
      category: "desktop_gaming",
      cpuModel: "Intel Core i7-4770",
      gpuModel: "GTX 1650",
      gpuType: "dedicated",
      ramGb: -8, // RAM negativa
    };

    const parsed = pcSchema.safeParse(invalidPc);
    assert.equal(parsed.success, false);
  });

  test("Regola di pubblicazione: rifiuto pubblicazione con campi editoriali insufficienti", () => {
    const draftReview = {
      id: "rev-draft",
      pcId: "pc-1",
      slug: "recensione-bozza",
      title: "Rec", // Troppo breve
      verdict: "sconsigliato" as const,
      summaryIntro: "Breve", // Troppo breve (<20 char)
      strengths: [],
      weaknesses: [],
      evidenceLevel: "specifiche_dichiarate" as const,
      ratingGaming: "non_adatto" as const,
      ratingWork: "non_adatto" as const,
      ratingOffice: "limitato" as const,
      status: "published" as const, // Tenta pubblicazione
    };

    const pubCheck = validateForPublication(draftReview);
    assert.equal(pubCheck.isValid, false);
    assert.ok(pubCheck.errors.length >= 3);
  });

  test("Accettazione pubblicazione quando tutti i campi editoriali obbligatori sono presenti", () => {
    const validReview = {
      id: "rev-published",
      pcId: "pc-1",
      slug: "recensione-completa",
      title: "Recensione Completa PC Megaport",
      verdict: "sconsigliato" as const,
      summaryIntro: "Questa è una sintesi dettagliata e completa che supera la lunghezza minima obbligatoria di venti caratteri.",
      strengths: ["Case con illuminazione RGB accattivante"],
      weaknesses: ["Processore vecchio di oltre 10 anni"],
      evidenceLevel: "verifica_indipendente" as const,
      ratingGaming: "non_adatto" as const,
      ratingWork: "non_adatto" as const,
      ratingOffice: "limitato" as const,
      status: "published" as const,
    };

    const pubCheck = validateForPublication(validReview);
    assert.equal(pubCheck.isValid, true);
    assert.equal(pubCheck.errors.length, 0);
  });
});
