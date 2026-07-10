import { getCachedSolarProfile } from "./solarProfile";
import {
  type BoardWidgetManifest,
  fetchAppBoardManifests,
  fetchUserBoard,
  filterBoardItemsForApp,
  getTargetSolarAccountId,
  getTargetUserBoardAccess,
} from "./boardAdmin";
import {
  ensureAppWidgetInstalled,
  envelopeString,
  extractProfileMediaIds,
  isWidgetItem,
  normalizeMediaRef,
  pushAppBoardPayload,
  resolveMediaOrDefault,
} from "./boardWidgetCore";

export const MOOD_FIELD_IMAGE = "image";
export const MOOD_FIELD_MOOD = "mood";

export interface MoodPayloadEnvelope {
  image: { value: string; label: string };
  mood: { value: string; label: string };
}

export interface MoodWidgetState {
  app_id: string;
  widget_key: string;
  installed: boolean;
  board_item_id: string | null;
  mood: string;
  /** Currently stored image (URL or file id). */
  image: string;
  image_file_id: string | null;
  payload: MoodPayloadEnvelope | Record<string, unknown> | null;
  /** Solarpass default picture file id (if any). */
  profile_picture_id: string | null;
  can_push: boolean;
  missing: string[];
}

export interface MoodUpdateInput {
  mood: string;
  /** Optional override: URL or file id. Empty/omit → profile picture. */
  image?: string | null;
  installIfMissing?: boolean;
}

/** Prefer env, then key containing "mood", then image+mood fields. */
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
    return names.has(MOOD_FIELD_IMAGE) && names.has(MOOD_FIELD_MOOD) && !names.has("tasks");
  });
  if (byFields) return byFields;

  return null;
}

export function buildMoodPayload(input: {
  image: string;
  mood: string;
}): MoodPayloadEnvelope {
  return {
    image: { value: input.image, label: "图片" },
    mood: { value: input.mood, label: "心情" },
  };
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
  const item = appItems.find((x) => isWidgetItem(x, moodManifest.key)) ?? null;

  const profile = await getCachedSolarProfile(userId, options?.forceProfile ?? false);
  const { pictureId } = extractProfileMediaIds(profile);
  const payload = (item?.payload || null) as Record<string, unknown> | null;
  const storedImage = envelopeString(payload, MOOD_FIELD_IMAGE);

  const missing: string[] = [];
  if (!storedImage && !pictureId) missing.push("image");

  return {
    app_id: appId,
    widget_key: moodManifest.key,
    installed: !!item,
    board_item_id: item?.id ?? null,
    mood: envelopeString(payload, MOOD_FIELD_MOOD),
    image: storedImage || pictureId || "",
    image_file_id: storedImage || null,
    payload,
    profile_picture_id: pictureId,
    can_push: !!(storedImage || pictureId),
    missing,
  };
}

export async function updateMoodForUser(
  userId: string,
  apiBaseUrl: string,
  input: MoodUpdateInput,
): Promise<MoodWidgetState> {
  const mood = (input.mood || "").trim();
  if (!mood) {
    throw createError({ statusCode: 400, message: "Mood text is required" });
  }
  if (mood.length > 280) {
    throw createError({ statusCode: 400, message: "Mood text is too long (max 280)" });
  }

  const imageOverride = normalizeMediaRef(input.image, "image");
  const profile = await getCachedSolarProfile(userId, true);
  const { pictureId } = extractProfileMediaIds(profile);
  const image = resolveMediaOrDefault(imageOverride, pictureId, "头像 image");

  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const moodManifest = resolveMoodManifest(manifests);
  if (!moodManifest) {
    throw createError({ statusCode: 404, message: "No mood board widget defined for this app" });
  }

  const token = await getTargetUserBoardAccess(userId);
  const board = await fetchUserBoard(apiBaseUrl, token);
  let item = filterBoardItemsForApp(board, appId, manifests)
    .find((x) => isWidgetItem(x, moodManifest.key)) ?? null;

  if (!item) {
    if (input.installIfMissing === false) {
      throw createError({ statusCode: 404, message: "Mood widget is not installed on the board" });
    }
    const installed = await ensureAppWidgetInstalled({
      apiBaseUrl,
      userToken: token,
      appId,
      widgetKey: moodManifest.key,
      board,
    });
    item = installed.item;
  }

  const accountId = await getTargetSolarAccountId(userId);
  const payload = buildMoodPayload({ image, mood });

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
