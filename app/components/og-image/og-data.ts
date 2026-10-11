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
}

/**
 * A publisher's post collection, from
 * `/sphere/publishers/{pub}/collections/{slug}`. `name` is optional upstream,
 * so a card falls back to the slug.
 */
export interface OgCollection {
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  background?: OgDriveFile | null;
  icon?: OgDriveFile | null;
  publisher?: OgPublisher | null;
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

/**
 * Card palette, taken from the DaisyUI theme in `app/assets/css/main.css`:
 * paper and ink carry the page, one hairline holds the colophon, and the
 * primary blue appears exactly once — on the publication's address. Each text
 * value clears 4.5:1 on paper at its own size (`graphite` is one step darker
 * than the site's muted grey so 20px captions stay legible).
 */
export const OG = {
  font: "'Nunito', 'Noto Sans SC', sans-serif",
  paper: "#f0f0f0",
  ink: "#353538",
  inkSoft: "#55555c",
  graphite: "#66666e",
  rule: "#d2d2d2",
  blue: "#1158d1",
} as const;

/**
 * One grid for the whole card family: the brand lockup sits at the margin, the
 * copy hangs from a fixed line below it, the colophon is ruled off at the
 * bottom, and the plate — the card's only image — is a fixed square in the
 * top-right corner. Templates must not invent their own numbers.
 */
export const OG_FRAME = {
  margin: 72,
  lockupHeight: 40,
  /** Lockup width for the 3.38:1 brand asset. */
  lockupWidth: 135,
  /** Gap between the lockup and the copy's first line. */
  copyTop: 96,
  /** Square plate, and the gutter between it and the copy column. */
  plate: 344,
  plateGutter: 72,
  /** Publisher portrait, a circle rather than a framed plate. */
  portrait: 288,
  /** Copy column width with and without a plate. */
  copyNarrow: 640,
  copyWide: 860,
} as const;

/**
 * Full-width characters occupy one em; Latin a shade over half, punctuation a
 * third. The Latin factor is deliberately generous — Nunito's advances vary, and
 * a card that mis-fits by one line breaks the grid, so over-estimating width
 * (which picks a smaller size) is the safe direction.
 */
function ogCharEm(char: string): number {
  return /[\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60]/.test(char)
    ? 1
    : /[A-Za-z0-9]/.test(char)
      ? 0.56
      : 0.38;
}

/** Width of a string in ems, so display type can be fitted to a column. */
export function ogTextEm(text: string): number {
  let em = 0;
  for (const char of text) em += ogCharEm(char);
  return em;
}

/*
  0.97 keeps a little slack against the model's own error: a line that wraps one
  character past the estimate would push the copy block into the colophon.
*/
function ogCapacityEm(columnPx: number, fontSize: number, lines: number): number {
  return (columnPx / fontSize) * lines * 0.97;
}

/** Clips a string to an em budget, ending on an ellipsis when it cut something. */
export function ogClip(text: string, capacityEm: number): string {
  const clean = text.trim();
  if (ogTextEm(clean) <= capacityEm) return clean;
  let em = 0;
  let out = "";
  for (const char of clean) {
    const width = ogCharEm(char);
    if (em + width > capacityEm - 1) break;
    em += width;
    out += char;
  }
  return `${out.trimEnd()}…`;
}

/** Copies that are already sized (ledes, bios): clip to the lines they may take. */
export function ogFit(
  text: string,
  columnPx: number,
  options: { fontSize: number; lines?: number },
): string {
  return ogClip(text, ogCapacityEm(columnPx, options.fontSize, options.lines ?? 2));
}

/**
 * Largest display size at which `text` still fills at most `maxLines`, clipping
 * to that size's capacity when even the smallest step overflows. Cards get
 * their headline size from here rather than from hand-tuned per-template rules.
 */
export function ogFitDisplay(
  text: string,
  columnPx: number,
  options: { maxLines?: number; sizes?: number[] } = {},
): { size: number; text: string } {
  const { maxLines = 2, sizes = [56, 46, 38, 32] } = options;
  const clean = text.trim();
  for (const size of sizes) {
    const capacity = ogCapacityEm(columnPx, size, maxLines);
    if (ogTextEm(clean) <= capacity) return { size, text: clean };
  }
  const size = sizes[sizes.length - 1]!;
  return { size, text: ogClip(clean, ogCapacityEm(columnPx, size, maxLines)) };
}

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
 * A collection by its publisher and slug. The upstream endpoint is public, so
 * a card never needs a token; a locked publisher simply comes back `null` and
 * the card degrades to the brand-only variant.
 */
export function ogFetchCollection(
  apiBaseUrl: string,
  pub: string,
  slug: string,
): Promise<OgCollection | null> {
  return ogFetchSolar<OgCollection>(
    apiBaseUrl,
    `/sphere/publishers/${encodeURIComponent(pub)}/collections/${encodeURIComponent(slug)}`,
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
