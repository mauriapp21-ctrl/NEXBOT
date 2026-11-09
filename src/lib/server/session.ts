import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Login for using the real engine from another address (e.g. the tunnel).
 *
 * Credentials come from .env.local (never committed):
 *   ENGINE_LOGIN_USER, ENGINE_LOGIN_PASSWORD, SESSION_SECRET (optional).
 * Without them remote access to the engine stays disabled (fail closed).
 *
 * The session is a signed, httpOnly, SameSite=Strict cookie that expires in
 * 8 hours. Without SESSION_SECRET a random key is used, so restarting the
 * server signs everyone out.
 */
export const SESSION_COOKIE = "rpa_session";
export const SESSION_TTL_S = 8 * 60 * 60;

const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const USER = process.env.ENGINE_LOGIN_USER ?? "";
const PASSWORD = process.env.ENGINE_LOGIN_PASSWORD ?? "";

export function loginConfigured(): boolean {
  return USER.length > 0 && PASSWORD.length >= 12;
}

const digest = (value: string) => createHash("sha256").update(value).digest();
const sign = (payload: string) => createHmac("sha256", SECRET).update(payload).digest("base64url");

/** Constant-time comparison so response times do not reveal the credentials. */
export function checkCredentials(user: string, password: string): boolean {
  if (!loginConfigured()) return false;
  const userOk = timingSafeEqual(digest(user), digest(USER));
  const passwordOk = timingSafeEqual(digest(password), digest(PASSWORD));
  return userOk && passwordOk;
}

export function createSessionToken(user: string): string {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the user of a valid, unexpired session token, or null. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token || !loginConfigured()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u?: unknown; exp?: unknown };
    if (typeof data.u !== "string" || typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    return data.u === USER ? data.u : null;
  } catch {
    return null;
  }
}

// ---- Brute-force protection: 5 failed attempts lock that address for 15 minutes.
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; until: number }>();

export function clientKey(headers: Headers): string {
  return headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Milliseconds the address must still wait, or 0 when it may try again. */
export function lockedFor(key: string): number {
  const entry = failures.get(key);
  if (!entry || entry.count < MAX_FAILURES) return 0;
  const wait = entry.until - Date.now();
  if (wait <= 0) {
    failures.delete(key);
    return 0;
  }
  return wait;
}

export function registerFailure(key: string): void {
  const entry = failures.get(key) ?? { count: 0, until: 0 };
  entry.count += 1;
  entry.until = Date.now() + LOCK_MS;
  failures.set(key, entry);
  if (failures.size > 10_000) failures.clear(); // memory guard
}

export function clearFailures(key: string): void {
  failures.delete(key);
}

/**
 * Blocks cross-site form posts (CSRF): a browser POST must come from this
 * same site. Requests without Origin (non-browser tools) still need the cookie.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function sessionCookieOptions(request: Request) {
  const secure = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")) === "https";
  return { httpOnly: true, sameSite: "strict" as const, secure, path: "/", maxAge: SESSION_TTL_S };
}
