import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken, SessionPayload } from "./auth";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "pcchiaro_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_development_secret_at_least_32_chars_long!!";
const MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || "86400", 10);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Salva la sessione dell'amministratore in un cookie protetto HttpOnly
 */
export async function setAdminSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + MAX_AGE * 1000;

  const payload: SessionPayload = {
    username,
    role: "admin",
    issuedAt,
    expiresAt,
  };

  const token = createSessionToken(payload, SESSION_SECRET);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/**
 * Recupera e verifica la sessione corrente
 */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return verifySessionToken(token, SESSION_SECRET);
}

/**
 * Rimuove il cookie di sessione (Logout)
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Assicura che la richiesta provenga da un amministratore autorizzato.
 * Lancia un errore se non autenticato (da usare nelle Server Actions).
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    throw new Error("Accesso negato: operazione riservata all'amministratore autenticato.");
  }
  return session;
}
