import test from "node:test";
import assert from "node:assert/strict";
import { parseCsvLine, parseCsvText } from "../lib/csv-parser";

test("Parser CSV RFC 4180", async (t) => {
  await t.test("Non deve spezzare il testo se contiene punto e virgola tra virgolette", () => {
    const line = 'B0GQZDM5WK;HP;OmniBook 3;"Grafica Radeon 660M; inadatta a 1080p";limitato';
    const parts = parseCsvLine(line, ";");

    assert.equal(parts.length, 5);
    assert.equal(parts[0], "B0GQZDM5WK");
    assert.equal(parts[1], "HP");
    assert.equal(parts[2], "OmniBook 3");
    assert.equal(parts[3], "Grafica Radeon 660M; inadatta a 1080p");
    assert.equal(parts[4], "limitato");
  });

  await t.test("Gestisce virgolette escaped (\"\") all'interno dei campi", () => {
    const line = 'B0GQZDM5WK;"HP OmniBook 3 16"" (Ryzen 5)";599.99';
    const parts = parseCsvLine(line, ";");

    assert.equal(parts.length, 3);
    assert.equal(parts[1], 'HP OmniBook 3 16" (Ryzen 5)');
  });

  await t.test("parseCsvText mappa correttamente intestazioni e righe multiple con CRLF", () => {
    const csvContent =
      'asin;brand;note;prezzo\r\n' +
      'B01;Asus;"Testo; con punto e virgola";499.00\r\n' +
      'B02;Lenovo;"Altro testo, con virgola";399.00';

    const { headers, rows } = parseCsvText(csvContent);

    assert.deepEqual(headers, ["asin", "brand", "note", "prezzo"]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0][2], "Testo; con punto e virgola");
    assert.equal(rows[1][2], "Altro testo, con virgola");
  });
});
