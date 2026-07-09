import { getCachedSolarProfile } from "./solarProfile";
import {
  type BoardItem,
  type BoardWidgetManifest,
  fetchAppBoardManifests,
  fetchUserBoard,
  filterBoardItemsForApp,
  getAppBoardSecret,
  getBoardItemWidgetKey,
  getTargetSolarAccountId,
  getTargetUserBoardAccess,
  isCustomAppBoardItem,
  privateBoardPayloadUrl,
  replaceUserBoard,
} from "./boardAdmin";

export const MOOD_FIELD_IMAGE = "image";
export const MOOD_FIELD_BACKGROUND = "background";
export const MOOD_FIELD_MOOD = "mood";

export interface MoodPayloadEnvelope {
  image: { value: string; label: string };
  background: { value: string; label: string };
  mood: { value: string; label: string };
}

export interface MoodWidgetState {
  app_id: string;
  widget_key: string;
  installed: boolean;
  board_item_id: string | null;
  mood: string;
  image_file_id: string | null;
  background_file_id: string | null;
  payload: MoodPayloadEnvelope | Record<string, unknown> | null;
  profile_picture_id: string | null;
  profile_background_id: string | null;
  can_push: boolean;
  missing: string[];
}

function asRecord(value: unknown): Record<string, any> | null {
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

function envelopeValue(payload: Record<string, unknown> | null | undefined, key: string): string {
  if (!payload) return "";
  const field = payload[key];
  if (field && typeof field === "object" && "value" in field) {
    const v = (field as { value: unknown }).value;
    if (v == null) return "";
    return typeof v === "string" ? v : String(v);
  }
  if (typeof field === "string") return field;
  return "";
}

/** Prefer env, then key containing "mood", then image+background+mood fields, else first. */
export function resolveMoodManifest(manifests: BoardWidgetManifest[]): BoardWidgetManifest | null {
  if (!manifests.length) return null;

  const envKey = process.env.MOOD_WIDGET_KEY?.trim();
  if (envKey) {
    const byEnv = manifests.find((m) => m.key === envKey);
    if (byEnv) return byEnv;
  }

  const byName = manifests.find((m) => /mood/i.test(m.key));
  if (byName) return byName;

  const byFields = manifests.find((m) => {
    const names = new Set((m.field_types || []).map((f) => f.name));
    return names.has(MOOD_FIELD_IMAGE) && names.has(MOOD_FIELD_BACKGROUND) && names.has(MOOD_FIELD_MOOD);
  });
  if (byFields) return byFields;

  return manifests[0] ?? null;
}

export function buildMoodPayload(input: {
  pictureId: string;
  backgroundId: string;
  mood: string;
}): MoodPayloadEnvelope {
  return {
    image: { value: input.pictureId, label: "Image" },
    background: { value: input.backgroundId, label: "Background" },
    mood: { value: input.mood, label: "Mood" },
  };
}

export function isMoodWidgetItem(item: BoardItem, moodKey: string): boolean {
  if (!isCustomAppBoardItem(item)) return false;
  const key = getBoardItemWidgetKey(item);
  return !!key && key.toLowerCase() === moodKey.toLowerCase();
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
    console.error("[mood.push] Private payload API error:", {
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

/**
 * Ensure the mood widget is on the user's board (empty payload for custom_app).
 * Returns the board item after install/locate.
 */
export async function ensureMoodWidgetInstalled(params: {
  apiBaseUrl: string;
  userToken: string;
  appId: string;
  widgetKey: string;
  board: BoardItem[];
}): Promise<{ item: BoardItem; board: BoardItem[] }> {
  const existing = params.board.find((item) => isMoodWidgetItem(item, params.widgetKey));
  if (existing) return { item: existing, board: params.board };

  // Passport SnAccountBoardItemKind.CustomApp = 1 (numeric JSON without string enum converter)
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
  const item = updated.find((x) => isMoodWidgetItem(x, params.widgetKey));
  if (!item) {
    throw createError({
      statusCode: 500,
      message: "Mood widget was not present after board update",
    });
  }
  return { item, board: updated };
}

export async function getMoodStateForUser(
  userId: string,
  apiBaseUrl: string,
  options?: { forceProfile?: boolean },
): Promise<MoodWidgetState> {
  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const moodManifest = resolveMoodManifest(manifests);
  if (!moodManifest) {
    throw createError({
      statusCode: 404,
      message: "No mood board widget defined for this app",
    });
  }

  const token = await getTargetUserBoardAccess(userId);
  const board = await fetchUserBoard(apiBaseUrl, token);
  const appItems = filterBoardItemsForApp(board, appId, manifests);
  const item = appItems.find((x) => isMoodWidgetItem(x, moodManifest.key)) ?? null;

  const profile = await getCachedSolarProfile(userId, options?.forceProfile ?? false);
  const { pictureId, backgroundId } = extractProfileMediaIds(profile);
  const payload = (item?.payload || null) as Record<string, unknown> | null;

  const missing: string[] = [];
  if (!pictureId) missing.push("profile_picture");
  if (!backgroundId) missing.push("profile_background");

  return {
    app_id: appId,
    widget_key: moodManifest.key,
    installed: !!item,
    board_item_id: item?.id ?? null,
    mood: envelopeValue(payload, MOOD_FIELD_MOOD),
    image_file_id: envelopeValue(payload, MOOD_FIELD_IMAGE) || null,
    background_file_id: envelopeValue(payload, MOOD_FIELD_BACKGROUND) || null,
    payload,
    profile_picture_id: pictureId,
    profile_background_id: backgroundId,
    can_push: !!pictureId && !!backgroundId,
    missing,
  };
}

export async function updateMoodForUser(
  userId: string,
  apiBaseUrl: string,
  moodText: string,
  options?: { installIfMissing?: boolean },
): Promise<MoodWidgetState> {
  const mood = moodText.trim();
  if (!mood) {
    throw createError({ statusCode: 400, message: "Mood text is required" });
  }
  if (mood.length > 280) {
    throw createError({ statusCode: 400, message: "Mood text is too long (max 280)" });
  }

  // Fresh profile so picture/background ids are current
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

  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const moodManifest = resolveMoodManifest(manifests);
  if (!moodManifest) {
    throw createError({ statusCode: 404, message: "No mood board widget defined for this app" });
  }

  const token = await getTargetUserBoardAccess(userId);
  let board = await fetchUserBoard(apiBaseUrl, token);
  let item = filterBoardItemsForApp(board, appId, manifests)
    .find((x) => isMoodWidgetItem(x, moodManifest.key)) ?? null;

  if (!item) {
    if (options?.installIfMissing === false) {
      throw createError({ statusCode: 404, message: "Mood widget is not installed on the board" });
    }
    const installed = await ensureMoodWidgetInstalled({
      apiBaseUrl,
      userToken: token,
      appId,
      widgetKey: moodManifest.key,
      board,
    });
    item = installed.item;
    board = installed.board;
  }

  const accountId = await getTargetSolarAccountId(userId);
  const payload = buildMoodPayload({
    pictureId,
    backgroundId,
    mood,
  });

  await pushAppBoardPayload({
    apiBaseUrl,
    appId,
    accountId,
    widgetKey: moodManifest.key,
    boardItemId: item.id,
    payload: payload as unknown as Record<string, unknown>,
  });

  return getMoodStateForUser(userId, apiBaseUrl, { forceProfile: false });
}
