/**
 * Wire shapes and helpers for the `*.takumi.vue` OG templates.
 *
 * These run inside the Nitro OG renderer, not the app: they must not touch
 * Nuxt app composables, Vue reactivity or the client bundle, and every request
 * hits the public Solar Network API without a session token — so anything
 * private stays private (a locked publisher simply returns a brand-only card).
 */

/** Minimal shape of a Solar Network drive file. */
export interface OgDriveFile {
  id?: string | null;
  url?: string | null;
  mimeType?: string | null;
  mime_type?: string | null;
}

export interface OgPublisher {
  name: string;
  nick?: string | null;
  bio?: string | null;
  picture?: OgDriveFile | null;
  verification?: { title?: string | null } | null;
}

export interface OgPost {
  id: string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  type?: number | null;
  published_at?: string | null;
  picture?: OgDriveFile | null;
  attachments?: OgDriveFile[] | null;
  publisher?: OgPublisher | null;
  tags?: { slug?: string | null }[] | null;
}

/** Site name shown on every card. */
export const OG_SITE_NAME = "Goatshed 山羊寒舍";
export const OG_SITE_URL = "littlesheep.me";
/** Mirrors the site's default meta description, used when a card has no data. */
export const OG_SITE_TAGLINE = "欢迎来到小羊之家 ( *｀ω´)";

/** Brand tokens, mirrored from the DaisyUI theme in `app/assets/css/main.css`. */
export const OG = {
  font: "'Nunito', 'Noto Sans SC', sans-serif",
  base: "#f0f0f0",
  ink: "#353538",
  muted: "#6f6f77",
  primary: "#1158d1",
  accent: "#0f8ad6",
  secondary: "#3e78d8",
} as const;

/**
 * Absolute URL for a drive file. `width`/`height` request a re-encoded variant
 * so the renderer never pulls a multi-megabyte camera original.
 */
export function ogDriveUrl(
  file: OgDriveFile | null | undefined,
  apiBaseUrl: string,
  width?: number,
  height?: number,
): string | null {
  if (!file?.id) return null;
  const base = `${apiBaseUrl}/drive/files/${encodeURIComponent(file.id)}`;
  if (!width && !height) return base;
  const params = new URLSearchParams({ fit: "cover", format: "webp" });
  if (width) params.set("w", String(width));
  if (height) params.set("h", String(height));
  return `${base}?${params}`;
}

/** First image attachment, which is what the cards fall back to for artwork. */
export function ogImageAttachment(post: OgPost | null): OgDriveFile | null {
  const attachment = post?.attachments?.find((file) =>
    (file.mimeType || file.mime_type || "").startsWith("image/"),
  );
  return attachment ?? null;
}

/** Collapses whitespace and strips the markdown scaffolding that would render as noise. */
export function ogPlainText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s*/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncates to a glyph budget, appending an ellipsis when it cut something. */
export function ogTruncate(input: string, max: number): string {
  const text = input.trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Pinned to `zh-CN` so a render never depends on the server's locale. */
export function ogDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(date);
}

/**
 * GET a Solar Network path as JSON, or `null`.
 *
 * A card is never worth a failed render: offline, timed out, private and
 * deleted resources all fall through to the brand-only variant.
 */
export async function ogFetchSolar<T>(
  apiBaseUrl: string,
  path: string,
): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Post or moment, by the same addressing rule the site's own API route uses:
 * a UUID stands alone (`/sphere/posts/{id}`), everything else is namespaced by
 * its publisher (`/sphere/posts/{pub}/{slug}`). Passing a publisher with a UUID
 * is a 404 upstream — which is how moments are addressed, since they have no
 * slug.
 */
export function ogFetchPost(
  apiBaseUrl: string,
  pub: string,
  slug: string,
): Promise<OgPost | null> {
  if (RE_UUID.test(slug)) {
    return ogFetchSolar<OgPost>(apiBaseUrl, `/sphere/posts/${slug}`);
  }
  return ogFetchSolar<OgPost>(
    apiBaseUrl,
    `/sphere/posts/${encodeURIComponent(pub)}/${encodeURIComponent(slug)}`,
  );
}

/**
 * Public API base URL for OG rendering. Read from the shared runtime config
 * when the renderer exposes it, so self-hosted deployments stay correct.
 */
export function ogApiBaseUrl(fallback = "https://api.solian.app"): string {
  try {
    return (useRuntimeConfig().public?.apiBaseUrl as string) || fallback;
  } catch {
    return fallback;
  }
}
