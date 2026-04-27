interface CloneUserImpressionState {
  userId: string;
  favorability: number;
  impressions: string[];
  updatedAt: string;
}

interface CloneImpressionUpdate {
  userId: string;
  impressionUpdate?: string | null;
  favorabilityDelta?: number | null;
}

const STORAGE_PREFIX = "clone:user-impression:";
const DEFAULT_FAVORABILITY = 50;
const MAX_IMPRESSIONS = 12;

function makeStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeImpressionText(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= 120) return compact;
  return `${compact.slice(0, 117)}...`;
}

function getDefaultState(userId: string): CloneUserImpressionState {
  return {
    userId,
    favorability: DEFAULT_FAVORABILITY,
    impressions: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getCloneImpressionState(userId: string) {
  const storage = useStorage("data");
  const key = makeStorageKey(userId);
  const stored = await storage.getItem<CloneUserImpressionState>(key);

  if (!stored || typeof stored !== "object") {
    const fallback = getDefaultState(userId);
    await storage.setItem(key, fallback);
    return fallback;
  }

  const favorability =
    typeof stored.favorability === "number"
      ? Math.round(stored.favorability)
      : DEFAULT_FAVORABILITY;

  const impressions = Array.isArray(stored.impressions)
    ? stored.impressions
        .map((item) => normalizeImpressionText(typeof item === "string" ? item : ""))
        .filter(Boolean)
        .slice(0, MAX_IMPRESSIONS)
    : [];

  const state: CloneUserImpressionState = {
    userId,
    favorability,
    impressions,
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
  };

  await storage.setItem(key, state);
  return state;
}

export async function updateCloneImpressionState(payload: CloneImpressionUpdate) {
  const storage = useStorage("data");
  const key = makeStorageKey(payload.userId);
  const current = await getCloneImpressionState(payload.userId);

  const delta =
    typeof payload.favorabilityDelta === "number"
      ? clamp(Math.round(payload.favorabilityDelta), -10, 10)
      : 0;

  const normalizedImpression = payload.impressionUpdate ? normalizeImpressionText(payload.impressionUpdate) : "";
  const deduped = normalizedImpression
    ? [
        normalizedImpression,
        ...current.impressions.filter((item) => item.toLowerCase() !== normalizedImpression.toLowerCase()),
      ]
    : current.impressions;

  const next: CloneUserImpressionState = {
    userId: payload.userId,
    favorability: current.favorability + delta,
    impressions: deduped.slice(0, MAX_IMPRESSIONS),
    updatedAt: new Date().toISOString(),
  };

  await storage.setItem(key, next);
  return next;
}

export async function deleteCloneImpressionState(userId: string) {
  const storage = useStorage("data");
  await storage.removeItem(makeStorageKey(userId));
}
