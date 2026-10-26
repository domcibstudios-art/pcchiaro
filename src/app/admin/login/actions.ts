"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword, isIpRateLimited, recordLoginAttempt } from "@/lib/auth";
import { setAdminSession, clearAdminSession } from "@/lib/session";

// Hash di default per ambiente di sviluppo locale (password: 'admin12345')
const DEV_DEFAULT_HASH =
  "706a99f77762972ef0993de8ccf2b783:df532feffe509a6d0ef8f0c253abbdd8d22b653dbdf11b9f2bdcea6b2f7664d9674b5ec00e395f24cc07c3ddcffc1a17bb6d74b93367cd72e5f25c68f1cabea6";

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  // 1. Controllo anti brute-force
  if (isIpRateLimited(ipAddress)) {
    return {
      error: "Troppi tentativi falliti da questo indirizzo IP. Riprova tra 15 minuti.",
    };
  }

  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  let expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedHash || expectedHash.startsWith("placeholder_")) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: ADMIN_PASSWORD_HASH non configurato in ambiente di produzione.");
      return { error: "Configurazione di sicurezza incompleta: imposta ADMIN_PASSWORD_HASH nel file delle variabili d'ambiente." };
    }
    expectedHash = DEV_DEFAULT_HASH;
  }

  // 2. Controllo username
  if (!username || username !== expectedUsername) {
    recordLoginAttempt(ipAddress, false);
    return { error: "Credenziali non valide. Riprova." };
  }

  // 3. Controllo password con Scrypt
  const isPasswordValid = await verifyPassword(password || "", expectedHash);

  if (!isPasswordValid) {
    recordLoginAttempt(ipAddress, false);
    return { error: "Credenziali non valide. Riprova." };
  }

  // Successo: registra tentativo e crea cookie protetto HttpOnly
  recordLoginAttempt(ipAddress, true);
  await setAdminSession(username);

  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
