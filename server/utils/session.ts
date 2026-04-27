import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";
import { getCookie, setCookie, deleteCookie } from "h3";
import type { SessionData } from "../../app/types/auth";

const SESSION_COOKIE = "goatshed_session";
const STATE_COOKIE = "goatshed_oauth_state";
const REDIRECT_COOKIE = "goatshed_oauth_redirect";
const PKCE_COOKIE = "goatshed_oauth_pkce";

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function getSecret(event: H3Event): string {
  const config = useRuntimeConfig(event);
  return config.authSessionSecret;
}

export function createSessionToken(event: H3Event, session: SessionData): string {
  const secret = getSecret(event);
  const payload = toBase64Url(JSON.stringify(session));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function parseSessionToken(event: H3Event, token: string): SessionData | null {
  const secret = getSecret(event);
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);

  if (expectedBytes.length !== signatureBytes.length) return null;
  if (!timingSafeEqual(expectedBytes, signatureBytes)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as SessionData;
    if (!parsed?.user?.id || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(event: H3Event, session: SessionData) {
  const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  setCookie(event, SESSION_COOKIE, createSessionToken(event, session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export function readSession(event: H3Event): SessionData | null {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;
  return parseSessionToken(event, token);
}

export function createOAuthState(): string {
  return randomBytes(18).toString("base64url");
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function setOAuthStateCookie(event: H3Event, state: string) {
  setCookie(event, STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export function readOAuthStateCookie(event: H3Event): string | null {
  return getCookie(event, STATE_COOKIE) ?? null;
}

export function clearOAuthStateCookie(event: H3Event) {
  deleteCookie(event, STATE_COOKIE, { path: "/" });
}

export function setOAuthRedirectCookie(event: H3Event, path: string) {
  setCookie(event, REDIRECT_COOKIE, path, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export function readOAuthRedirectCookie(event: H3Event): string | null {
  return getCookie(event, REDIRECT_COOKIE) ?? null;
}

export function clearOAuthRedirectCookie(event: H3Event) {
  deleteCookie(event, REDIRECT_COOKIE, { path: "/" });
}

export function setOAuthPkceCookie(event: H3Event, verifier: string) {
  setCookie(event, PKCE_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export function readOAuthPkceCookie(event: H3Event): string | null {
  return getCookie(event, PKCE_COOKIE) ?? null;
}

export function clearOAuthPkceCookie(event: H3Event) {
  deleteCookie(event, PKCE_COOKIE, { path: "/" });
}
