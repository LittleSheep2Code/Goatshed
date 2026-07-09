import { getUserSolarToken, getSolarAccountId } from "./solarAccount";

export interface BoardItem {
  id: string;
  order: number;
  /** Passport may send string ("custom_app") or numeric enum (CustomApp = 1). */
  kind: string | number;
  widget_key?: string | null;
  custom_app_id?: string | null;
  custom_app_widget_key?: string | null;
  is_enabled?: boolean;
  payload?: Record<string, unknown> | null;
  // tolerate accidental camelCase from proxies
  customAppId?: string | null;
  customAppWidgetKey?: string | null;
  widgetKey?: string | null;
}

export interface BoardWidgetFieldType {
  name: string;
  type: string;
  label: string;
  format?: string;
  required?: boolean;
}

/** Widget definition from Develop private GET .../board/widgets */
export interface BoardWidgetManifest {
  key: string;
  is_enabled?: boolean;
  renderer_type?: string;
  payload_type?: string;
  field_types?: BoardWidgetFieldType[];
  required_fields?: string[];
  max_payload_bytes?: number;
  allow_multiple?: boolean;
}

/** Target user's Solian token for Passport self-board APIs. */
export async function getTargetUserBoardAccess(targetUserId: string) {
  const token = await getUserSolarToken(targetUserId);
  if (!token) {
    throw createError({
      statusCode: 404,
      statusMessage: "No linked Solian account or token expired",
    });
  }
  return token;
}

export function selfBoardUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/passport/accounts/me/board`;
}

/** Goatshed app secret for Develop private board APIs. */
export function getAppBoardSecret(): { appId: string; secret: string } {
  const appId = process.env.DONATION_API_KEY_CLIENT_ID;
  const secret = process.env.DONATION_API_KEY_SECRET;
  if (!appId || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage: "DONATION_API_KEY_CLIENT_ID/SECRET not configured",
    });
  }
  return { appId, secret };
}

function privateAppBoardBase(apiBaseUrl: string, appId: string): string {
  return `${apiBaseUrl}/develop/private/apps/${encodeURIComponent(appId)}/board`;
}

export function privateBoardWidgetsUrl(apiBaseUrl: string, appId: string): string {
  return `${privateAppBoardBase(apiBaseUrl, appId)}/widgets`;
}

export function privateBoardPayloadUrl(apiBaseUrl: string, appId: string): string {
  return `${privateAppBoardBase(apiBaseUrl, appId)}/payload`;
}

function appSecretHeaders(secret: string): HeadersInit {
  return {
    authorization: `Bearer ${secret}`,
    "x-app-secret": secret,
  };
}

/**
 * List this app's board widget manifests (definitions only — not user instances).
 * GET /develop/private/apps/{app_id}/board/widgets
 */
export async function fetchAppBoardManifests(
  apiBaseUrl: string,
): Promise<{ appId: string; manifests: BoardWidgetManifest[] }> {
  const { appId, secret } = getAppBoardSecret();
  const url = privateBoardWidgetsUrl(apiBaseUrl, appId);
  const response = await fetch(url, { headers: appSecretHeaders(secret) });

  if (!response.ok) {
    const text = await response.text();
    console.error("[board.manifests] Private API error:", { url, status: response.status, body: text });
    throw createError({
      statusCode: response.status,
      message: text || `Failed to fetch app board widgets (${response.status})`,
    });
  }

  const data = await response.json();
  return {
    appId,
    manifests: Array.isArray(data) ? (data as BoardWidgetManifest[]) : [],
  };
}

export async function fetchUserBoard(
  apiBaseUrl: string,
  userToken: string,
): Promise<BoardItem[]> {
  const url = selfBoardUrl(apiBaseUrl);
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || "Failed to fetch board",
    });
  }
  return (await response.json()) as BoardItem[];
}

/**
 * Passport `SnAccountBoardItemKind`: Prebuilt = 0, CustomApp = 1.
 * JSON may be a number (default System.Text.Json) or a string depending on converters.
 */
export function isCustomAppBoardItem(item: BoardItem): boolean {
  const kind = item.kind;
  if (typeof kind === "number") return kind === 1;
  if (typeof kind !== "string") return false;
  const normalized = kind.trim().toLowerCase().replace(/[\s-]/g, "_");
  return normalized === "custom_app" || normalized === "customapp" || normalized === "1";
}

export function getBoardItemAppId(item: BoardItem): string | null {
  const raw = item.custom_app_id ?? item.customAppId;
  return raw ? String(raw) : null;
}

export function getBoardItemWidgetKey(item: BoardItem): string | null {
  const raw = item.custom_app_widget_key ?? item.customAppWidgetKey ?? item.widget_key ?? item.widgetKey;
  return raw ? String(raw) : null;
}

/**
 * Keep only board items that belong to this custom app.
 * Prefer matching custom_app_id; fall back to widget keys from this app's manifests.
 */
export function filterBoardItemsForApp(
  board: BoardItem[],
  appId: string,
  manifests: BoardWidgetManifest[],
): BoardItem[] {
  const appIdNorm = appId.trim().toLowerCase();
  const manifestKeys = new Set(
    manifests.map((m) => m.key).filter(Boolean).map((k) => k.toLowerCase()),
  );

  return board.filter((item) => {
    if (!isCustomAppBoardItem(item)) return false;

    const itemAppId = getBoardItemAppId(item);
    if (itemAppId && itemAppId.toLowerCase() === appIdNorm) return true;

    const widgetKey = (getBoardItemWidgetKey(item) || "").toLowerCase();
    return !!widgetKey && manifestKeys.has(widgetKey);
  });
}

export async function replaceUserBoard(
  apiBaseUrl: string,
  userToken: string,
  board: BoardItem[],
): Promise<BoardItem[]> {
  const url = selfBoardUrl(apiBaseUrl);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(board),
  });
  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || "Failed to update board",
    });
  }
  return (await response.json()) as BoardItem[];
}

export async function getTargetSolarAccountId(targetUserId: string): Promise<string> {
  const solarAccountId = await getSolarAccountId(targetUserId);
  if (!solarAccountId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Target user has no linked Solian account",
    });
  }
  return solarAccountId;
}
