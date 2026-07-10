import { getCachedSolarProfile } from "./solarProfile";
import {
  type BoardItem,
  type BoardWidgetManifest,
  fetchAppBoardManifests,
  fetchUserBoard,
  filterBoardItemsForApp,
  getAppBoardSecret,
  getBoardItemWidgetKey,
  getTargetUserBoardAccess,
  isCustomAppBoardItem,
  privateBoardPayloadUrl,
  replaceUserBoard,
} from "./boardAdmin";

export function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function fileIdFromRef(ref: unknown): string | null {
  const obj = asRecord(ref);
  if (!obj) return null;
  const id = obj.id ?? obj.Id;
  return id != null && String(id).trim() ? String(id) : null;
}

/** Extract Solarpass picture / background cloud file ids from a profile payload. */
export function extractProfileMediaIds(profile: Record<string, any> | null | undefined): {
  pictureId: string | null;
  backgroundId: string | null;
} {
  if (!profile) return { pictureId: null, backgroundId: null };

  const nested = asRecord(profile.profile) || profile;
  const pictureId =
    fileIdFromRef(nested?.picture)
    || fileIdFromRef(nested?.Picture)
    || fileIdFromRef(profile.picture)
    || fileIdFromRef(profile.Picture);

  const backgroundId =
    fileIdFromRef(nested?.background)
    || fileIdFromRef(nested?.Background)
    || fileIdFromRef(profile.background)
    || fileIdFromRef(profile.Background);

  return { pictureId, backgroundId };
}

export function envelopeValue(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): unknown {
  if (!payload) return undefined;
  const field = payload[key];
  if (field && typeof field === "object" && "value" in field) {
    return (field as { value: unknown }).value;
  }
  return field;
}

export function envelopeString(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const v = envelopeValue(payload, key);
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

export function envelopeStringArray(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string[] {
  const v = envelopeValue(payload, key);
  if (!Array.isArray(v)) return [];
  return v.map((x) => (x == null ? "" : String(x))).filter((s) => s.trim().length > 0);
}

export function envelopeStringDict(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): Record<string, string> {
  const v = envelopeValue(payload, key);
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const kk = String(k).trim();
    if (!kk) continue;
    out[kk] = val == null ? "" : String(val);
  }
  return out;
}

const MAX_MEDIA_REF_LENGTH = 2048;

/**
 * Optional media override: URL or Solarpass cloud file id.
 * Empty / null / undefined → no override (use profile default).
 */
export function normalizeMediaRef(raw: unknown, fieldName = "media"): string | null {
  if (raw == null) return null;
  if (typeof raw !== "string") {
    throw createError({ statusCode: 400, message: `${fieldName} must be a string (URL or file id)` });
  }
  const value = raw.trim();
  if (!value) return null;
  if (value.length > MAX_MEDIA_REF_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} is too long (max ${MAX_MEDIA_REF_LENGTH})`,
    });
  }
  return value;
}

/**
 * Prefer user override (URL or file id), else Solarpass profile default.
 */
export function resolveMediaOrDefault(
  override: string | null | undefined,
  profileDefault: string | null | undefined,
  fieldLabel: string,
): string {
  const value = (override?.trim() || profileDefault?.trim() || "");
  if (!value) {
    throw createError({
      statusCode: 400,
      message: `缺少${fieldLabel}：请提供 URL/文件 ID，或先在 Solarpass 设置默认资料`,
    });
  }
  return value;
}

export function isWidgetItem(item: BoardItem, widgetKey: string): boolean {
  if (!isCustomAppBoardItem(item)) return false;
  const key = getBoardItemWidgetKey(item);
  return !!key && key.toLowerCase() === widgetKey.toLowerCase();
}

export async function pushAppBoardPayload(params: {
  apiBaseUrl: string;
  appId: string;
  accountId: string;
  widgetKey: string;
  boardItemId?: string | null;
  payload: Record<string, unknown>;
}): Promise<unknown> {
  const { secret } = getAppBoardSecret();
  const url = privateBoardPayloadUrl(params.apiBaseUrl, params.appId);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
      "x-app-secret": secret,
    },
    body: JSON.stringify({
      account_id: params.accountId,
      widget_key: params.widgetKey,
      board_item_id: params.boardItemId || null,
      payload: params.payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[board.push] Private payload API error:", {
      url,
      status: response.status,
      body: text,
    });
    throw createError({
      statusCode: response.status,
      message: text || `Failed to push board payload (${response.status})`,
    });
  }

  if (response.status === 204) return { success: true };
  return await response.json();
}

export async function ensureAppWidgetInstalled(params: {
  apiBaseUrl: string;
  userToken: string;
  appId: string;
  widgetKey: string;
  board: BoardItem[];
}): Promise<{ item: BoardItem; board: BoardItem[] }> {
  const existing = params.board.find((item) => isWidgetItem(item, params.widgetKey));
  if (existing) return { item: existing, board: params.board };

  // Passport SnAccountBoardItemKind.CustomApp = 1
  const next: BoardItem[] = [
    ...params.board.map((item, i) => ({ ...item, order: i })),
    {
      order: params.board.length,
      kind: 1,
      custom_app_id: params.appId,
      custom_app_widget_key: params.widgetKey,
      is_enabled: true,
      payload: {},
    } as BoardItem,
  ];

  const updated = await replaceUserBoard(params.apiBaseUrl, params.userToken, next);
  const item = updated.find((x) => isWidgetItem(x, params.widgetKey));
  if (!item) {
    throw createError({
      statusCode: 500,
      message: `Widget "${params.widgetKey}" was not present after board update`,
    });
  }
  return { item, board: updated };
}

export async function requireProfileMedia(userId: string) {
  const profile = await getCachedSolarProfile(userId, true);
  const { pictureId, backgroundId } = extractProfileMediaIds(profile);
  if (!pictureId || !backgroundId) {
    throw createError({
      statusCode: 400,
      message: !pictureId && !backgroundId
        ? "请先在 Solarpass 设置头像和背景图"
        : !pictureId
          ? "请先在 Solarpass 设置头像"
          : "请先在 Solarpass 设置背景图",
    });
  }
  return { pictureId, backgroundId, profile };
}

export async function loadAppBoardContext(userId: string, apiBaseUrl: string) {
  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const token = await getTargetUserBoardAccess(userId);
  const board = await fetchUserBoard(apiBaseUrl, token);
  const appItems = filterBoardItemsForApp(board, appId, manifests);
  return { appId, manifests, token, board, appItems };
}

export function findManifest(
  manifests: BoardWidgetManifest[],
  options: {
    envKey?: string;
    keyPattern?: RegExp;
    requiredFields?: string[];
  },
): BoardWidgetManifest | null {
  if (!manifests.length) return null;

  if (options.envKey) {
    const byEnv = manifests.find((m) => m.key === options.envKey);
    if (byEnv) return byEnv;
  }

  if (options.keyPattern) {
    const byName = manifests.find((m) => options.keyPattern!.test(m.key));
    if (byName) return byName;
  }

  if (options.requiredFields?.length) {
    const byFields = manifests.find((m) => {
      const names = new Set((m.field_types || []).map((f) => f.name));
      return options.requiredFields!.every((f) => names.has(f));
    });
    if (byFields) return byFields;
  }

  return null;
}


