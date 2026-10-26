import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SessionPayload,
} from "../lib/auth";

describe("Modulo Autenticazione e Sicurezza", () => {
  test("Verifica credenziali predefinite di sviluppo (admin / admin12345)", async () => {
    const devHash =
      "706a99f77762972ef0993de8ccf2b783:df532feffe509a6d0ef8f0c253abbdd8d22b653dbdf11b9f2bdcea6b2f7664d9674b5ec00e395f24cc07c3ddcffc1a17bb6d74b93367cd72e5f25c68f1cabea6";
    const matches = await verifyPassword("admin12345", devHash);
    assert.equal(matches, true, "admin12345 deve corrispondere al dev hash");
  });

  test("Hashing e verifica password con Scrypt", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await hashPassword(password);

    assert.ok(hash.includes(":"), "L'hash deve contenere il salt separato da due punti");

    const isMatch = await verifyPassword(password, hash);
    assert.equal(isMatch, true, "La password corretta deve corrispondere");

    const isWrongMatch = await verifyPassword("WrongPassword", hash);
    assert.equal(isWrongMatch, false, "Una password errata deve essere respinta");
  });

  test("Generazione e verifica token di sessione firmato con HMAC", () => {
    const secret = "a_very_secure_secret_key_with_at_least_32_characters";
    const payload: SessionPayload = {
      username: "admin",
      role: "admin",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600 * 1000, // 1 ora
    };

    const token = createSessionToken(payload, secret);
    assert.ok(token.includes("."), "Il token deve contenere payload e firma separati da punto");

    const verified = verifySessionToken(token, secret);
    assert.ok(verified, "Il token valido deve essere verificato");
    assert.equal(verified?.username, "admin");
    assert.equal(verified?.role, "admin");
  });

  test("Rifiuto token manomesso o firmato con segreto errato", () => {
    const secret = "correct_secret_key_32_chars_long_12345";
    const wrongSecret = "wrong_secret_key_32_chars_long_54321";
    const payload: SessionPayload = {
      username: "admin",
      role: "admin",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600 * 1000,
    };

    const token = createSessionToken(payload, secret);

    // Verifica con segreto errato
    const invalidWithWrongSecret = verifySessionToken(token, wrongSecret);
    assert.equal(invalidWithWrongSecret, null, "Il token verificato con segreto errato deve fallire");

    // Manomissione del payload
    const parts = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, username: "hacker" })
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${parts[1]}`;

    const invalidTampered = verifySessionToken(tamperedToken, secret);
    assert.equal(invalidTampered, null, "Il token manomesso deve essere respinto");
  });

  test("Rifiuto token scaduto", () => {
    const secret = "correct_secret_key_32_chars_long_12345";
    const expiredPayload: SessionPayload = {
      username: "admin",
      role: "admin",
      issuedAt: Date.now() - 7200 * 1000,
      expiresAt: Date.now() - 3600 * 1000, // Scaduto un'ora fa
    };

    const expiredToken = createSessionToken(expiredPayload, secret);
    const result = verifySessionToken(expiredToken, secret);
    assert.equal(result, null, "Il token scaduto deve essere respinto");
  });
});
