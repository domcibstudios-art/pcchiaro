import test from "node:test";
import assert from "node:assert/strict";
import {
  extractAsinFromAmazonUrl,
  cleanAmazonUrl,
  buildAffiliateUrl,
} from "../lib/affiliate";
import { setAmazonAffiliateTag, getAmazonAffiliateTag } from "../lib/settings";

test("Modulo Centralizzato Affiliazione Amazon", async (t) => {
  await t.test("extractAsinFromAmazonUrl estrae correttamente l'ASIN da vari formati di link", () => {
    assert.equal(
      extractAsinFromAmazonUrl("https://www.amazon.it/dp/B0GQZDM5WK"),
      "B0GQZDM5WK"
    );
    assert.equal(
      extractAsinFromAmazonUrl(
        "https://www.amazon.it/HP-16-by0001slx-integrata-Antiriflesso-Portatile/dp/B0GQZDM5WK/ref=sr_1_1?crid=3UR1GREE2E2GB"
      ),
      "B0GQZDM5WK"
    );
    assert.equal(
      extractAsinFromAmazonUrl("https://www.amazon.it/gp/product/B07S7C3S9F"),
      "B07S7C3S9F"
    );
    assert.equal(extractAsinFromAmazonUrl("https://google.com"), null);
  });

  await t.test("cleanAmazonUrl ripulisce l'URL eliminando tracking invasivo (crid, dib, ref)", () => {
    const dirtyUrl =
      "https://www.amazon.it/HP-16-by0001slx-integrata-Antiriflesso-Portatile/dp/B0GQZDM5WK/ref=sr_1_1?crid=3UR1GREE2E2GB&dib=eyJ2IjoiMSJ9&keywords=laptop";
    assert.equal(cleanAmazonUrl(dirtyUrl), "https://www.amazon.it/dp/B0GQZDM5WK");

    // Da ASIN diretto
    assert.equal(cleanAmazonUrl("B0GQZDM5WK"), "https://www.amazon.it/dp/B0GQZDM5WK");
  });

  await t.test("buildAffiliateUrl senza tag configurato genera link pulito ad Amazon (account in attesa)", () => {
    const clean = buildAffiliateUrl("https://www.amazon.it/dp/B0GQZDM5WK", "");
    assert.equal(clean, "https://www.amazon.it/dp/B0GQZDM5WK");
  });

  await t.test("buildAffiliateUrl con tag inietta ?tag= e rimpiazza eventuali vecchi tag", () => {
    // 1. Iniezione tag
    const tagged = buildAffiliateUrl("https://www.amazon.it/dp/B0GQZDM5WK", "pcchiaro-21");
    assert.equal(tagged, "https://www.amazon.it/dp/B0GQZDM5WK?tag=pcchiaro-21");

    // 2. Rimpiazzo vecchio tag obsoleto
    const oldTaggedUrl = "https://www.amazon.it/dp/B0GQZDM5WK?tag=vecchiotag-21";
    const newTagged = buildAffiliateUrl(oldTaggedUrl, "nuovotag-21");
    assert.equal(newTagged, "https://www.amazon.it/dp/B0GQZDM5WK?tag=nuovotag-21");
  });

  await t.test("Salvataggio dinamico del tag nel DB tramite settings", () => {
    setAmazonAffiliateTag("testtag-21");
    assert.equal(getAmazonAffiliateTag(), "testtag-21");

    // Verifica che buildAffiliateUrl legga il valore salvato nel database
    const url = buildAffiliateUrl("https://www.amazon.it/dp/B0GQZDM5WK");
    assert.equal(url, "https://www.amazon.it/dp/B0GQZDM5WK?tag=testtag-21");

    // Reset per pulizia
    setAmazonAffiliateTag("");
  });
});
