/** Minimal shape of a Solar Network drive file needed to address its bytes. */
export interface DriveFileLike {
  id?: string | null;
  url?: string | null;
}

/** The drive endpoint whose responses can be asked for a resized derivative. */
const DRIVE_FILE_MARKER = "/drive/files/";

/**
 * Asks a drive file URL for a resized derivative.
 *
 * Drive files resolve to the original upload — a home-page card cover can be a
 * 1.2 MB 1920px JPEG — so anything drawn smaller than full bleed should name the
 * width it needs. Solar renders and caches the derivative, and `?width=` is what
 * selects it. URLs that do not address the drive endpoint are returned untouched,
 * so an API-provided external URL never gets a meaningless query string.
 */
export function withDriveWidth(url: string, width: number): string {
  if (!url.includes(DRIVE_FILE_MARKER)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}`;
}

/**
 * Display URL for a drive file: the API-provided URL when present, otherwise the canonical
 * `/drive/files/{id}` endpoint. Returns null when there is no file to point at.
 *
 * Pass `width` for anything drawn at a known size; omit it where the full-size
 * original is the point (a lightbox slide, an `og:image`).
 */
export function driveFileUrl(
  file: DriveFileLike | null | undefined,
  apiBaseUrl: string,
  width?: number,
): string | null {
  if (!file?.id) return null;

  const url =
    file.url || `${apiBaseUrl}${DRIVE_FILE_MARKER}${encodeURIComponent(file.id)}`;
  return width ? withDriveWidth(url, width) : url;
}

/*
  Widths the site asks for, named by the surface they serve rather than by pixel
  count, so a component and the sizing intent stay legible together. Card covers
  are the common case and cover their 16:9 box at 2x on a typical laptop.
*/
export const DRIVE_WIDTH = {
  /** 16 px–24 px avatars: post cards, author lines, switchers. */
  avatar: 64,
  /** 32 px avatars: publisher sidebars and island headers. */
  avatarLarge: 128,
  /** Large avatars and profile art drawn around 96 px. */
  profile: 192,
  /** Prev/next card covers and attachment thumbnails. */
  thumbnail: 400,
  /** Post and collection covers drawn as inline card artwork. */
  cover: 800,
  /** Full-bleed hero backdrops. */
  hero: 1600,
} as const;
