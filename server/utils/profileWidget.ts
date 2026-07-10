import { getCachedSolarProfile } from "./solarProfile";
import { getTargetSolarAccountId } from "./boardAdmin";
import {
  envelopeString,
  envelopeStringDict,
  ensureAppWidgetInstalled,
  extractProfileMediaIds,
  findManifest,
  isWidgetItem,
  loadAppBoardContext,
  normalizeMediaRef,
  pushAppBoardPayload,
  resolveMediaOrDefault,
} from "./boardWidgetCore";

export const PROFILE_FIELD_IMAGE = "image";
export const PROFILE_FIELD_BACKGROUND = "background";
export const PROFILE_FIELD_DATA = "data";

const MAX_PAIRS = 6;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 200;

export interface ProfilePayloadEnvelope {
  image: { value: string; label: string };
  background: { value: string; label: string };
  data: { value: Record<string, string>; label: string };
}

export interface ProfileWidgetState {
  app_id: string;
  widget_key: string;
  installed: boolean;
  board_item_id: string | null;
  data: Record<string, string>;
  image: string;
  background: string;
  image_file_id: string | null;
  background_file_id: string | null;
  payload: ProfilePayloadEnvelope | Record<string, unknown> | null;
  profile_picture_id: string | null;
  profile_background_id: string | null;
  can_push: boolean;
  missing: string[];
}

export interface ProfileWidgetUpdateInput {
  data: unknown;
  image?: string | null;
  background?: string | null;
  installIfMissing?: boolean;
}

export function resolveProfileManifest(manifests: Parameters<typeof findManifest>[0]) {
  return findManifest(manifests, {
    envKey: process.env.PROFILE_WIDGET_KEY?.trim(),
    keyPattern: /^profile$|profile[_-]/i,
    requiredFields: [PROFILE_FIELD_IMAGE, PROFILE_FIELD_BACKGROUND, PROFILE_FIELD_DATA],
  });
}

export function buildProfilePayload(input: {
  image: string;
  background: string;
  data: Record<string, string>;
}): ProfilePayloadEnvelope {
  return {
    image: { value: input.image, label: "图片" },
    background: { value: input.background, label: "背景" },
    data: { value: input.data, label: "数据" },
  };
}

/** Accept object map or list of {key,value} pairs; max 6 non-empty keys. */
export function normalizeDataDict(raw: unknown): Record<string, string> {
  const pairs: Array<{ key: string; value: string }> = [];

  if (raw == null) {
    // empty
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const key = String(rec.key ?? rec.k ?? "").trim();
      const value = rec.value ?? rec.v;
      if (!key) continue;
      pairs.push({ key, value: value == null ? "" : String(value).trim() });
    }
  } else if (typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const k = String(key).trim();
      if (!k) continue;
      pairs.push({ key: k, value: value == null ? "" : String(value).trim() });
    }
  } else {
    throw createError({ statusCode: 400, message: "data must be an object or key-value list" });
  }

  if (pairs.length > MAX_PAIRS) {
    throw createError({ statusCode: 400, message: `At most ${MAX_PAIRS} custom fields allowed` });
  }

  const data: Record<string, string> = {};
  for (const { key, value } of pairs) {
    if (key.length > MAX_KEY_LENGTH) {
      throw createError({ statusCode: 400, message: `Key too long (max ${MAX_KEY_LENGTH})` });
    }
    if (value.length > MAX_VALUE_LENGTH) {
      throw createError({ statusCode: 400, message: `Value too long (max ${MAX_VALUE_LENGTH})` });
    }
    if (key in data) {
      throw createError({ statusCode: 400, message: `Duplicate key: ${key}` });
    }
    data[key] = value;
  }

  return data;
}

export async function getProfileWidgetStateForUser(
  userId: string,
  apiBaseUrl: string,
  options?: { forceProfile?: boolean },
): Promise<ProfileWidgetState> {
  const { appId, manifests, appItems } = await loadAppBoardContext(userId, apiBaseUrl);
  const profileManifest = resolveProfileManifest(manifests);
  if (!profileManifest) {
    throw createError({
      statusCode: 404,
      message: "No profile board widget defined for this app",
    });
  }

  const item = appItems.find((x) => isWidgetItem(x, profileManifest.key)) ?? null;
  const profile = await getCachedSolarProfile(userId, options?.forceProfile ?? false);
  const { pictureId, backgroundId } = extractProfileMediaIds(profile);
  const payload = (item?.payload || null) as Record<string, unknown> | null;
  const storedImage = envelopeString(payload, PROFILE_FIELD_IMAGE);
  const storedBackground = envelopeString(payload, PROFILE_FIELD_BACKGROUND);

  const missing: string[] = [];
  if (!storedImage && !pictureId) missing.push("image");
  if (!storedBackground && !backgroundId) missing.push("background");

  return {
    app_id: appId,
    widget_key: profileManifest.key,
    installed: !!item,
    board_item_id: item?.id ?? null,
    data: envelopeStringDict(payload, PROFILE_FIELD_DATA),
    image: storedImage || pictureId || "",
    background: storedBackground || backgroundId || "",
    image_file_id: storedImage || null,
    background_file_id: storedBackground || null,
    payload,
    profile_picture_id: pictureId,
    profile_background_id: backgroundId,
    can_push: !!(storedImage || pictureId) && !!(storedBackground || backgroundId),
    missing,
  };
}

export async function updateProfileWidgetForUser(
  userId: string,
  apiBaseUrl: string,
  input: ProfileWidgetUpdateInput,
): Promise<ProfileWidgetState> {
  const data = normalizeDataDict(input.data);
  const imageOverride = normalizeMediaRef(input.image, "image");
  const backgroundOverride = normalizeMediaRef(input.background, "background");

  const profile = await getCachedSolarProfile(userId, true);
  const { pictureId, backgroundId } = extractProfileMediaIds(profile);
  const image = resolveMediaOrDefault(imageOverride, pictureId, "头像 image");
  const background = resolveMediaOrDefault(backgroundOverride, backgroundId, "背景 background");

  const { appId, manifests, token, board, appItems } = await loadAppBoardContext(userId, apiBaseUrl);
  const profileManifest = resolveProfileManifest(manifests);
  if (!profileManifest) {
    throw createError({
      statusCode: 404,
      message: "No profile board widget defined for this app",
    });
  }

  let item = appItems.find((x) => isWidgetItem(x, profileManifest.key)) ?? null;

  if (!item) {
    if (input.installIfMissing === false) {
      throw createError({
        statusCode: 404,
        message: "Profile widget is not installed on the board",
      });
    }
    const installed = await ensureAppWidgetInstalled({
      apiBaseUrl,
      userToken: token,
      appId,
      widgetKey: profileManifest.key,
      board,
    });
    item = installed.item;
  }

  const accountId = await getTargetSolarAccountId(userId);
  const payload = buildProfilePayload({ image, background, data });

  await pushAppBoardPayload({
    apiBaseUrl,
    appId,
    accountId,
    widgetKey: profileManifest.key,
    boardItemId: item.id,
    payload: payload as unknown as Record<string, unknown>,
  });

  return getProfileWidgetStateForUser(userId, apiBaseUrl, { forceProfile: false });
}
