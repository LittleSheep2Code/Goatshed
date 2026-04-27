import { randomUUID } from "node:crypto";

interface CloneHistoryMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

interface CloneConversation {
  threadId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: CloneHistoryMessage[];
}

interface CloneConversationSummary {
  threadId: string;
  title: string;
  lastMessagePreview: string;
  updatedAt: string;
}

const THREAD_PREFIX = "clone:history:thread:";
const INDEX_PREFIX = "clone:history:index:";
const MAX_MESSAGES_PER_THREAD = 200;
const MAX_THREADS_PER_USER = 30;

function threadKey(userId: string, threadId: string) {
  return `${THREAD_PREFIX}${userId}:${threadId}`;
}

function indexKey(userId: string) {
  return `${INDEX_PREFIX}${userId}`;
}

function compactText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function makePreview(text: string) {
  const compact = compactText(text);
  if (compact.length <= 72) return compact;
  return `${compact.slice(0, 69)}...`;
}

function makeTitle(firstUserText: string) {
  const compact = compactText(firstUserText);
  if (!compact) return "新对话";
  if (compact.length <= 24) return compact;
  return `${compact.slice(0, 21)}...`;
}

export async function getCloneConversation(userId: string, threadId: string) {
  const storage = useStorage("data");
  const stored = await storage.getItem<CloneConversation>(threadKey(userId, threadId));
  if (!stored || typeof stored !== "object") return null;

  return {
    threadId,
    userId,
    createdAt: typeof stored.createdAt === "string" ? stored.createdAt : new Date().toISOString(),
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
    messages: Array.isArray(stored.messages)
      ? stored.messages.filter((item) => item && typeof item.text === "string" && typeof item.role === "string")
      : [],
  };
}

async function readConversationIndex(userId: string) {
  const storage = useStorage("data");
  const stored = await storage.getItem<CloneConversationSummary[]>(indexKey(userId));
  if (!Array.isArray(stored)) return [];

  return stored
    .filter((item) => item && typeof item.threadId === "string")
    .map((item) => ({
      threadId: item.threadId,
      title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "新对话",
      lastMessagePreview: typeof item.lastMessagePreview === "string" ? item.lastMessagePreview : "",
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
    }))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

async function writeConversationIndex(userId: string, items: CloneConversationSummary[]) {
  const storage = useStorage("data");
  await storage.setItem(indexKey(userId), items.slice(0, MAX_THREADS_PER_USER));
}

export async function listCloneConversations(userId: string) {
  return readConversationIndex(userId);
}

export async function createCloneConversation(userId: string, threadId?: string) {
  const storage = useStorage("data");
  const now = new Date().toISOString();
  const nextThreadId = (threadId || `clone-${userId}-${randomUUID()}`).trim();

  const conversation: CloneConversation = {
    threadId: nextThreadId,
    userId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  await storage.setItem(threadKey(userId, nextThreadId), conversation);

  const summaries = await readConversationIndex(userId);
  const summary: CloneConversationSummary = {
    threadId: nextThreadId,
    title: "新对话",
    lastMessagePreview: "",
    updatedAt: now,
  };

  const merged = [summary, ...summaries.filter((item) => item.threadId !== nextThreadId)];
  await writeConversationIndex(userId, merged);

  return conversation;
}

export async function appendCloneConversationMessage(payload: {
  userId: string;
  threadId: string;
  message: { role: "user" | "assistant"; text: string };
}) {
  const storage = useStorage("data");
  const existing = await getCloneConversation(payload.userId, payload.threadId);
  const now = new Date().toISOString();
  const nextMessage: CloneHistoryMessage = {
    id: randomUUID(),
    role: payload.message.role,
    text: payload.message.text,
    createdAt: now,
  };

  const conversation: CloneConversation = existing
    ? {
        ...existing,
        updatedAt: now,
        messages: [...existing.messages, nextMessage].slice(-MAX_MESSAGES_PER_THREAD),
      }
    : {
        threadId: payload.threadId,
        userId: payload.userId,
        createdAt: now,
        updatedAt: now,
        messages: [nextMessage],
      };

  await storage.setItem(threadKey(payload.userId, payload.threadId), conversation);

  const summaries = await readConversationIndex(payload.userId);
  const firstUserMessage =
    conversation.messages.find((item) => item.role === "user" && item.text.trim())?.text || "新对话";
  const summary: CloneConversationSummary = {
    threadId: payload.threadId,
    title: makeTitle(firstUserMessage),
    lastMessagePreview: makePreview(payload.message.text),
    updatedAt: now,
  };

  const merged = [summary, ...summaries.filter((item) => item.threadId !== payload.threadId)];
  await writeConversationIndex(payload.userId, merged);

  return conversation;
}

export async function deleteCloneConversation(userId: string, threadId: string) {
  const storage = useStorage("data");
  await storage.removeItem(threadKey(userId, threadId));

  const summaries = await readConversationIndex(userId);
  const next = summaries.filter((item) => item.threadId !== threadId);
  await writeConversationIndex(userId, next);
}

export async function clearCloneConversations(userId: string) {
  const storage = useStorage("data");
  const summaries = await readConversationIndex(userId);

  for (const item of summaries) {
    await storage.removeItem(threadKey(userId, item.threadId));
  }

  await writeConversationIndex(userId, []);
  return summaries.map((item) => item.threadId);
}
