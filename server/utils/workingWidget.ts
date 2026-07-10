import { getCachedSolarProfile } from "./solarProfile";
import { getTargetSolarAccountId } from "./boardAdmin";
import {
  envelopeString,
  envelopeStringArray,
  ensureAppWidgetInstalled,
  extractProfileMediaIds,
  findManifest,
  isWidgetItem,
  loadAppBoardContext,
  normalizeMediaRef,
  pushAppBoardPayload,
  resolveMediaOrDefault,
} from "./boardWidgetCore";

export const WORKING_FIELD_IMAGE = "image";
export const WORKING_FIELD_BACKGROUND = "background";
export const WORKING_FIELD_TASKS = "tasks";

const MAX_TASKS = 30;
const MAX_TASK_LENGTH = 200;

export interface WorkingPayloadEnvelope {
  image: { value: string; label: string };
  background: { value: string; label: string };
  tasks: { value: string[]; label: string };
}

export interface WorkingWidgetState {
  app_id: string;
  widget_key: string;
  installed: boolean;
  board_item_id: string | null;
  tasks: string[];
  image: string;
  background: string;
  image_file_id: string | null;
  background_file_id: string | null;
  payload: WorkingPayloadEnvelope | Record<string, unknown> | null;
  profile_picture_id: string | null;
  profile_background_id: string | null;
  can_push: boolean;
  missing: string[];
}

export interface WorkingUpdateInput {
  tasks: unknown;
  image?: string | null;
  background?: string | null;
  installIfMissing?: boolean;
}

export function resolveWorkingManifest(manifests: Parameters<typeof findManifest>[0]) {
  return (
    findManifest(manifests, {
      envKey: process.env.WORKING_WIDGET_KEY?.trim(),
      keyPattern: /working|tasks/i,
      requiredFields: [WORKING_FIELD_IMAGE, WORKING_FIELD_BACKGROUND, WORKING_FIELD_TASKS],
    })
    || findManifest(manifests, {
      envKey: process.env.WORKING_WIDGET_KEY?.trim(),
      keyPattern: /working|tasks/i,
      requiredFields: [WORKING_FIELD_IMAGE, WORKING_FIELD_TASKS],
    })
  );
}

export function buildWorkingPayload(input: {
  image: string;
  background: string;
  tasks: string[];
}): WorkingPayloadEnvelope {
  return {
    image: { value: input.image, label: "图片" },
    background: { value: input.background, label: "背景" },
    tasks: { value: input.tasks, label: "任务" },
  };
}

export function normalizeTasks(raw: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    list = raw.split("\n");
  } else if (raw == null) {
    list = [];
  } else {
    throw createError({ statusCode: 400, message: "tasks must be a string array" });
  }

  const tasks = list
    .map((t) => (t == null ? "" : String(t).trim()))
    .filter((t) => t.length > 0);

  if (tasks.length > MAX_TASKS) {
    throw createError({ statusCode: 400, message: `Too many tasks (max ${MAX_TASKS})` });
  }
  for (const t of tasks) {
    if (t.length > MAX_TASK_LENGTH) {
      throw createError({
        statusCode: 400,
        message: `Task too long (max ${MAX_TASK_LENGTH} characters)`,
      });
    }
  }
  return tasks;
}

export async function getWorkingStateForUser(
  userId: string,
  apiBaseUrl: string,
  options?: { forceProfile?: boolean },
): Promise<WorkingWidgetState> {
  const { appId, manifests, appItems } = await loadAppBoardContext(userId, apiBaseUrl);
  const workingManifest = resolveWorkingManifest(manifests);
  if (!workingManifest) {
    throw createError({
      statusCode: 404,
      message: "No working board widget defined for this app",
    });
  }

  const item = appItems.find((x) => isWidgetItem(x, workingManifest.key)) ?? null;
  const profile = await getCachedSolarProfile(userId, options?.forceProfile ?? false);
  const { pictureId, backgroundId } = extractProfileMediaIds(profile);
  const payload = (item?.payload || null) as Record<string, unknown> | null;
  const storedImage = envelopeString(payload, WORKING_FIELD_IMAGE);
  const storedBackground = envelopeString(payload, WORKING_FIELD_BACKGROUND);

  const missing: string[] = [];
  if (!storedImage && !pictureId) missing.push("image");
  if (!storedBackground && !backgroundId) missing.push("background");

  return {
    app_id: appId,
    widget_key: workingManifest.key,
    installed: !!item,
    board_item_id: item?.id ?? null,
    tasks: envelopeStringArray(payload, WORKING_FIELD_TASKS),
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

export async function updateWorkingForUser(
  userId: string,
  apiBaseUrl: string,
  input: WorkingUpdateInput,
): Promise<WorkingWidgetState> {
  const tasks = normalizeTasks(input.tasks);
  const imageOverride = normalizeMediaRef(input.image, "image");
  const backgroundOverride = normalizeMediaRef(input.background, "background");

  const profile = await getCachedSolarProfile(userId, true);
  const { pictureId, backgroundId } = extractProfileMediaIds(profile);
  const image = resolveMediaOrDefault(imageOverride, pictureId, "头像 image");
  const background = resolveMediaOrDefault(backgroundOverride, backgroundId, "背景 background");

  const { appId, manifests, token, board, appItems } = await loadAppBoardContext(userId, apiBaseUrl);
  const workingManifest = resolveWorkingManifest(manifests);
  if (!workingManifest) {
    throw createError({
      statusCode: 404,
      message: "No working board widget defined for this app",
    });
  }

  let item = appItems.find((x) => isWidgetItem(x, workingManifest.key)) ?? null;

  if (!item) {
    if (input.installIfMissing === false) {
      throw createError({
        statusCode: 404,
        message: "Working widget is not installed on the board",
      });
    }
    const installed = await ensureAppWidgetInstalled({
      apiBaseUrl,
      userToken: token,
      appId,
      widgetKey: workingManifest.key,
      board,
    });
    item = installed.item;
  }

  const accountId = await getTargetSolarAccountId(userId);
  const payload = buildWorkingPayload({ image, background, tasks });

  await pushAppBoardPayload({
    apiBaseUrl,
    appId,
    accountId,
    widgetKey: workingManifest.key,
    boardItemId: item.id,
    payload: payload as unknown as Record<string, unknown>,
  });

  return getWorkingStateForUser(userId, apiBaseUrl, { forceProfile: false });
}
