import test from "node:test";
import assert from "node:assert/strict";
import {
  generateSeoMeta,
  generateReviewFaqs,
  generateStructuredData,
} from "../lib/seo-engine";

test("Modulo Automazione SEO", async (t) => {
  const samplePc = {
    brand: "HP",
    modelName: "OmniBook 3 16-by0001slx",
    cpuModel: "AMD Ryzen 5 130",
    cpuGen: "Zen 3+ (Rembrandt - Rebrand 2024)",
    cpuWin11Support: 1,
    gpuModel: "AMD Radeon 660M",
    gpuType: "integrated",
    ramGb: 8,
    ramType: "LPDDR5",
    ramChannel: "single",
    storageCapacityGb: 512,
    storageType: "NVMe",
    osOfficialSupport: 1,
    imageUrl: null,
  };

  const sampleReview = {
    title: 'HP OmniBook 3 16" (Ryzen 5 130 + Radeon 660M)',
    summaryIntro: "Notebook per produttività e studio con display 16 pollici 2K IPS ma con CPU Zen 3+ del 2022 rimarchiata.",
    verdict: "accettabile_base",
    ratingGaming: "limitato",
    notesGaming: "Grafica integrata Radeon 660M: adatta solo a eSports leggeri.",
    ratingWork: "limitato",
    notesWork: "6 core veloci ma limitato da 8GB di RAM.",
    ratingOffice: "idoneo",
    notesOffice: "Ottimo per Office e studio.",
    strengths: JSON.stringify(["Schermo 2K IPS", "SSD NVMe 512GB"]),
    weaknesses: JSON.stringify(["Rebrand Zen 3+", "Soli 8GB di RAM"]),
  };

  await t.test("generateSeoMeta genera Title e Description persuasivi sotto le soglie Google", () => {
    const meta = generateSeoMeta(sampleReview, samplePc);

    assert.ok(meta.title.includes("HP OmniBook 3 16-by0001slx"));
    assert.ok(meta.title.includes("PCChiaro"));
    assert.ok(meta.title.length <= 75, `Title troppo lungo: ${meta.title.length}`);

    assert.ok(meta.description.includes("HP OmniBook 3 16-by0001slx"));
    assert.ok(meta.description.includes("AMD Ryzen 5 130"));
    assert.ok(meta.description.length <= 165, `Description troppo lunga: ${meta.description.length}`);
  });

  await t.test("generateReviewFaqs genera domande e risposte oggettive basate sull'hardware reale", () => {
    const faqs = generateReviewFaqs(sampleReview, samplePc);

    assert.equal(faqs.length, 4);

    // FAQ 1: Gaming
    assert.ok(faqs[0].question.includes("Gaming 1080p"));
    assert.ok(faqs[0].answer.includes("limitato"));

    // FAQ 2: CPU
    assert.ok(faqs[1].question.includes("AMD Ryzen 5 130"));
    assert.ok(faqs[1].answer.includes("Zen 3+"));

    // FAQ 3: RAM Single Channel alert e limite 8GB
    assert.ok(faqs[2].question.includes("RAM"));
    assert.ok(faqs[2].answer.includes("Single Channel"));
    assert.ok(faqs[2].answer.includes("16 GB"), "La risposta RAM deve citare lo standard minimo moderno di 16 GB");

    // FAQ 4: Verdetto
    assert.ok(faqs[3].question.includes("giudizio finale"));
    assert.ok(faqs[3].answer.includes("ACCETTABILE BASE"));
  });

  await t.test("generateStructuredData produce JSON-LD valido per Review e FAQPage", () => {
    const faqs = generateReviewFaqs(sampleReview, samplePc);
    const { reviewSchema, faqSchema } = generateStructuredData(
      sampleReview,
      samplePc,
      { asin: "B0GQZDM5WK", priceAmountEur: 599.99, affiliateUrl: "https://amazon.it/dp/B0GQZDM5WK" },
      faqs
    );

    assert.equal(reviewSchema["@type"], "Review");
    assert.equal(reviewSchema.itemReviewed["@type"], "Product");
    assert.equal(reviewSchema.itemReviewed.name, "HP OmniBook 3 16-by0001slx");
    assert.equal(reviewSchema.itemReviewed.offers?.price, 599.99);

    assert.ok(faqSchema);
    assert.equal(faqSchema["@type"], "FAQPage");
    assert.equal(faqSchema.mainEntity.length, 4);
    assert.equal(faqSchema.mainEntity[0]["@type"], "Question");
  });
});
