/** Minimal shape of a Solar Network drive file needed to address its bytes. */
export interface DriveFileLike {
  id?: string | null;
  url?: string | null;
}

/**
 * Display URL for a drive file: the API-provided URL when present, otherwise the canonical
 * `/drive/files/{id}` endpoint. Returns null when there is no file to point at.
 */
export function driveFileUrl(
  file: DriveFileLike | null | undefined,
  apiBaseUrl: string,
): string | null {
  if (!file?.id) return null;
  return file.url || `${apiBaseUrl}/drive/files/${encodeURIComponent(file.id)}`;
}
