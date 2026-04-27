import type { H3Event } from "h3";

function isDebugEnabled(event: H3Event): boolean {
  const value =
    process.env.NUXT_OAUTH_DEBUG ||
    process.env.OAUTH_DEBUG ||
    process.env.DEBUG_OAUTH ||
    "";
  return value === "1" || value.toLowerCase() === "true";
}

export function oauthLog(event: H3Event, message: string, meta?: Record<string, unknown>) {
  if (!isDebugEnabled(event)) return;
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[oauth] ${message}${payload}`);
}

export function redact(value: string | null | undefined, keep = 6): string {
  if (!value) return "";
  if (value.length <= keep) return value;
  return `${value.slice(0, keep)}...`;
}
