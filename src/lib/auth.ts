import crypto from "crypto";
import { db } from "../db";
import { loginAttempts } from "../db/schema";
import { eq, and, gt, desc } from "drizzle-orm";

/**
 * Funzioni di Hashing e Verifica Password (utilizza Scrypt nativo con salt crittografico)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return resolve(false);

    const [salt, key] = parts;
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const keyBuffer = Buffer.from(key, "hex");
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Generazione e Verifica Token di Sessione con Firma HMAC
 */
export interface SessionPayload {
  username: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
}

export function createSessionToken(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));

    // Verifica scadenza temporale
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Protezione Brute-Force sui tentativi di Login
 * Massimo 5 tentativi falliti negli ultimi 15 minuti per un dato IP
 */
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minuti

export function isIpRateLimited(ipAddress: string): boolean {
  try {
    const cutoff = Date.now() - WINDOW_MS;
    const recentAttempts = db
      .select()
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ipAddress, ipAddress), gt(loginAttempts.attemptedAt, cutoff)))
      .orderBy(desc(loginAttempts.attemptedAt))
      .all();

    const failedCount = recentAttempts.filter((a) => a.success === 0).length;
    return failedCount >= MAX_FAILED_ATTEMPTS;
  } catch (error) {
    console.error("Errore verifica rate limit:", error);
    return false;
  }
}

export function recordLoginAttempt(ipAddress: string, success: boolean): void {
  try {
    db.insert(loginAttempts)
      .values({
        id: crypto.randomUUID(),
        ipAddress,
        attemptedAt: Date.now(),
        success: success ? 1 : 0,
      })
      .run();
  } catch (error) {
    console.error("Errore registrazione tentativo login:", error);
  }
}
