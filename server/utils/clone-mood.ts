type CloneMood = "neutral" | "happy" | "angry";

interface CloneMoodState {
  mood: CloneMood;
  reason: string;
  expiresAt: number;
  updatedAt: string;
}

const STORAGE_KEY = "clone:global-mood";
const DEFAULT_MOOD: CloneMood = "neutral";
const MOOD_DURATION_MS = 30 * 60 * 1000;

function getDefaultState(): CloneMoodState {
  return {
    mood: DEFAULT_MOOD,
    reason: "",
    expiresAt: Date.now() + MOOD_DURATION_MS,
    updatedAt: new Date().toISOString(),
  };
}

export async function getCloneMoodState(): Promise<CloneMoodState> {
  const storage = useStorage("data");
  const stored = await storage.getItem<CloneMoodState>(STORAGE_KEY);

  if (!stored || typeof stored !== "object") {
    const fallback = getDefaultState();
    await storage.setItem(STORAGE_KEY, fallback);
    return fallback;
  }

  const now = Date.now();
  if (typeof stored.expiresAt === "number" && stored.expiresAt < now) {
    const fallback = getDefaultState();
    await storage.setItem(STORAGE_KEY, fallback);
    return fallback;
  }

  const validMoods: CloneMood[] = ["neutral", "happy", "angry"];
  const mood: CloneMood = validMoods.includes(stored.mood as CloneMood)
    ? (stored.mood as CloneMood)
    : DEFAULT_MOOD;

  const state: CloneMoodState = {
    mood,
    reason: typeof stored.reason === "string" ? stored.reason : "",
    expiresAt: typeof stored.expiresAt === "number" ? stored.expiresAt : now + MOOD_DURATION_MS,
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
  };

  return state;
}

export async function updateCloneMoodState(mood: CloneMood, reason?: string): Promise<CloneMoodState> {
  const storage = useStorage("data");
  const validMoods: CloneMood[] = ["neutral", "happy", "angry"];
  const normalizedMood = validMoods.includes(mood) ? mood : DEFAULT_MOOD;

  const state: CloneMoodState = {
    mood: normalizedMood,
    reason: reason || "",
    expiresAt: Date.now() + MOOD_DURATION_MS,
    updatedAt: new Date().toISOString(),
  };

  await storage.setItem(STORAGE_KEY, state);
  return state;
}
