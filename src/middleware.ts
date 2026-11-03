import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "pcchiaro_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_development_secret_at_least_32_chars_long!!";

// Funzione helper per verificare la firma HMAC con Web Crypto (compatibile sia con Edge che con Node)
async function verifyHmacToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [data, signature] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decodifica signature da base64url
    const binarySig = Uint8Array.from(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      binarySig,
      enc.encode(data)
    );

    if (!isValid) return false;

    // Decodifica e verifica scadenza
    const payloadStr = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);

    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercetta esclusivamente le rotte sotto /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isLoginPage = pathname === "/admin/login";

    let isAuthenticated = false;
    if (token) {
      isAuthenticated = await verifyHmacToken(token, SESSION_SECRET);
    }

    // Se l'utente è già loggato e tenta di andare a /admin/login, reindirizza alla dashboard
    if (isLoginPage && isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Se l'utente non è loggato e richiede una pagina protetta (diversa da login), reindirizza a /admin/login
    if (!isLoginPage && !isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      redirectResponse.headers.set("Pragma", "no-cache");
      redirectResponse.headers.set("Vary", "Cookie");
      return redirectResponse;
    }

    const adminResponse = NextResponse.next();
    adminResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    adminResponse.headers.set("Pragma", "no-cache");
    adminResponse.headers.set("Vary", "Cookie");
    return adminResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
