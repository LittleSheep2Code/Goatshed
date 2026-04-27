<template>
  <main class="relative h-screen w-full overflow-hidden bg-base-300">
    <div class="absolute inset-0" :class="sceneThemeClass">
      <Transition name="scene-fade" mode="out-in">
        <div
          :key="sceneVisualKey"
          class="absolute inset-0 bg-cover bg-center bg-no-repeat"
          :style="backgroundStyle"
        />
      </Transition>
      <Transition name="scene-fade" mode="out-in">
        <div :key="`mask-${isNightTheme ? 'night' : 'day'}`" class="absolute inset-0" :class="sceneMaskClass" />
      </Transition>
    </div>

    <section class="relative z-10 flex h-screen w-full items-stretch overflow-hidden">
      <div class="relative h-full w-full max-w-xl">
        <div
          class="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-3xl [mask-image:linear-gradient(to_right,black_0%,black_72%,transparent_100%)]"
        />
        <div class="relative flex h-full w-full flex-col px-4 py-4 sm:px-5 sm:py-5">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <NuxtLink to="/" class="btn btn-ghost btn-xs">
              返回
            </NuxtLink>
            <button class="btn btn-ghost btn-xs" type="button" @click="startNewConversation">
              新对话
            </button>
            <button class="btn btn-ghost btn-xs" type="button" @click="openHistoryModal">
              历史
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-base-content/80">
            <span>好感度</span>
            <progress class="progress progress-primary w-24" :value="Math.max(0, Math.min(100, favorability))" max="100" />
            <span class="tabular-nums">{{ Math.round(favorability) }}</span>
          </div>
        </div>

        <section ref="messagesViewportRef" class="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
          <div
            v-for="item in messages"
            :key="item.id"
            class="chat"
            :class="item.role === 'user' ? 'chat-start' : 'chat-end'"
          >
            <div class="chat-header text-xs text-base-content/70 drop-shadow-[0_3px_8px_rgba(0,0,0,0.85)]">
              {{ item.role === "user" ? "你" : "小羊" }}
              <time class="text-xs opacity-60 drop-shadow-[0_3px_8px_rgba(0,0,0,0.85)]">{{ item.createdAt }}</time>
            </div>
            <div class="chat-bubble bg-base-100 text-base-content">
              <p class="whitespace-pre-wrap text-sm leading-6">{{ item.text }}</p>
            </div>
          </div>

          <div
            v-if="conversationEnded"
            class="rounded-lg border border-warning/40 bg-warning px-3 py-2 text-sm text-warning-content"
          >
            这段对话已被小羊结束，请点击「新对话」重新开始。
          </div>

          <div v-if="error" class="rounded-lg border border-error/40 bg-error px-3 py-2 text-sm text-error">
            {{ error }}
          </div>
        </section>

        <Transition name="slide-fade">
          <div v-if="busy" class="mb-2 flex items-center gap-2 text-xs text-base-content/70">
            <span>小羊正在输入</span>
            <span class="typing-indicator" aria-hidden="true">
              <span class="typing-dot" />
              <span class="typing-dot" />
              <span class="typing-dot" />
            </span>
          </div>
        </Transition>

        <div v-if="pendingAttachments.length" class="mb-2 space-y-1">
          <div
            v-for="attachment in pendingAttachments"
            :key="attachment.id"
            class="flex items-center justify-between rounded-md border border-base-content/20 bg-base-100/70 px-2 py-1 text-xs"
          >
            <div class="min-w-0">
              <p class="truncate font-medium">
                {{ attachment.kind === "image" ? "图片" : attachment.kind === "voice" ? "语音" : "文件" }} · {{ attachment.name }}
              </p>
              <p class="truncate text-base-content/60">{{ formatBytes(attachment.size) }}</p>
            </div>
            <button class="btn btn-ghost btn-xs" type="button" :disabled="busy" @click="removeAttachment(attachment.id)">
              移除
            </button>
          </div>
        </div>

        <form @submit.prevent="send">
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            multiple
            :disabled="busy || conversationEnded"
            @change="handleFileInput"
          >

          <div class="mb-2 flex items-center gap-2">
            <button class="btn btn-sm bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30" type="button" :disabled="busy || conversationEnded" @click="openFilePicker">
              上传
            </button>
            <button
              class="btn btn-sm bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
              type="button"
              :disabled="busy || conversationEnded"
              @click="toggleVoiceRecording"
            >
              {{ isRecording ? "停止录音" : "语音" }}
            </button>
            <span v-if="isRecording" class="text-xs text-error">录音中 {{ recordDurationLabel }}</span>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="clone-input"
              v-model="draft"
              class="input input-bordered h-11 flex-1"
              placeholder="输入消息，回车发送"
              :disabled="busy || conversationEnded"
            >
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="busy || conversationEnded || (!draft.trim() && !pendingAttachments.length)"
            >
              发送
            </button>
          </div>
        </form>

        <dialog ref="historyModalRef" class="modal">
          <div class="modal-box p-3 sm:p-4">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="text-base font-bold">历史会话</h3>
              <button
                class="btn btn-ghost btn-xs"
                type="button"
                :disabled="busy || !conversations.length"
                @click="handleClearAllConversations"
              >
                清空全部
              </button>
            </div>
            <section class="max-h-96 space-y-1 overflow-y-auto rounded-lg border border-base-content/15 bg-base-100/50 p-2">
              <div
                v-for="conversation in conversations"
                :key="conversation.threadId"
                class="flex items-start gap-2 rounded-md px-2 py-1.5 transition"
                :class="activeThreadId === conversation.threadId ? 'bg-primary/20 text-primary-content' : 'hover:bg-base-200/70'"
              >
                <button
                  class="min-w-0 flex-1 text-left"
                  type="button"
                  :disabled="busy"
                  @click="handleSelectConversation(conversation.threadId)"
                >
                  <p class="truncate text-xs font-medium">{{ conversation.title }}</p>
                  <p class="truncate text-[11px] text-base-content/70">{{ conversation.lastMessagePreview || "（无预览）" }}</p>
                </button>
                <button
                  class="btn btn-ghost btn-xs"
                  type="button"
                  :disabled="busy"
                  @click.stop="handleDeleteConversation(conversation.threadId)"
                >
                  删除
                </button>
              </div>
              <p v-if="!conversations.length" class="px-1 py-1 text-xs text-base-content/60">暂无历史会话</p>
            </section>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import daytimeIdleImage from "../assets/clone/images/daytime-idle.jpg";
import daytimeReplyingImage from "../assets/clone/images/daytime-replying.jpg";
import daytimeReplyingAngryImage from "../assets/clone/images/daytime-replying-angry.png";
import daytimeReplyingHappyImage from "../assets/clone/images/daytime-replying-happy.png";
import nighttimeIdleImage from "../assets/clone/images/nighttime-idle.jpg";
import nighttimeReplyingImage from "../assets/clone/images/nighttime-replying.jpg";
import nighttimeReplyingAngryImage from "../assets/clone/images/nighttime-replying-angry.jpg";
import nighttimeReplyingHappyImage from "../assets/clone/images/nighttime-replying-happy.jpg";

interface ChatItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

type CloneMood = "neutral" | "happy" | "angry";

interface CloneResponse {
  text: string;
  threadId: string;
  favorability?: number;
  latestImpression?: string | null;
  endConversation?: boolean;
  mood?: CloneMood;
}

interface CloneStreamChunk {
  type: "chunk";
  text: string;
}

interface CloneStreamFinal extends CloneResponse {
  type: "final";
}

interface CloneStreamError {
  type: "error";
  message: string;
}

type CloneStreamEvent = CloneStreamChunk | CloneStreamFinal | CloneStreamError;

interface CloneConversationSummary {
  threadId: string;
  title: string;
  lastMessagePreview: string;
  updatedAt: string;
}

interface CloneHistoryMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

interface CloneHistoryListResponse {
  conversations: CloneConversationSummary[];
}

interface CloneHistoryDetailResponse {
  threadId: string;
  messages: CloneHistoryMessage[];
  favorability?: number;
  latestImpression?: string | null;
  mood?: CloneMood;
}

interface CloneConversationCreateResponse {
  threadId: string;
  favorability?: number;
  latestImpression?: string | null;
  mood?: CloneMood;
}

type UploadKind = "image" | "file" | "voice";

interface PendingAttachment {
  id: string;
  kind: UploadKind;
  name: string;
  size: number;
  mimeType: string;
  dataBase64: string;
}

type CloneInputPart =
  | { type: "image"; mimeType?: string; dataBase64: string }
  | { type: "file"; mimeType: string; filename?: string; dataBase64: string };

function getSceneImage(isNight: boolean, isReplying: boolean, mood: CloneMood): string {
  if (isNight) {
    if (!isReplying) return nighttimeIdleImage;
    if (mood === "happy") return nighttimeReplyingHappyImage;
    if (mood === "angry") return nighttimeReplyingAngryImage;
    return nighttimeReplyingImage;
  }
  if (!isReplying) return daytimeIdleImage;
  if (mood === "happy") return daytimeReplyingHappyImage;
  if (mood === "angry") return daytimeReplyingAngryImage;
  return daytimeReplyingImage;
}

const agentAvatar = "https://api.solian.app/passport/accounts/littlesheep/picture";
const darkThemeNames = new Set([
  "dark",
  "synthwave",
  "halloween",
  "forest",
  "black",
  "luxury",
  "dracula",
  "business",
  "night",
  "coffee",
  "dim",
  "sunset",
]);

definePageMeta({
  middleware: ["auth-check"],
  layout: "blank",
});

const messages = ref<ChatItem[]>([]);
const draft = ref("");
const busy = ref(false);
const error = ref("");
const threadId = ref<string | null>(null);
const conversationEnded = ref(false);
const isReplying = ref(false);
const mood = ref<CloneMood>("neutral");
const themePrefersDark = ref(false);
const favorability = ref(50);
const latestImpression = ref<string | null>(null);
const conversations = ref<CloneConversationSummary[]>([]);
const activeThreadId = ref<string | null>(null);
const historyModalRef = ref<HTMLDialogElement | null>(null);
const messagesViewportRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingAttachments = ref<PendingAttachment[]>([]);
const isRecording = ref(false);
const mediaRecorderRef = ref<MediaRecorder | null>(null);
const recordingChunksRef = ref<Blob[]>([]);
const recordingStartAt = ref<number | null>(null);
const recordingTicker = ref<number | null>(null);
const recordingNow = ref(Date.now());

const isNightTheme = computed(() => themePrefersDark.value);
const recordDurationLabel = computed(() => {
  void recordingNow.value;
  if (!recordingStartAt.value) return "00:00";
  const seconds = Math.max(0, Math.floor((Date.now() - recordingStartAt.value) / 1000));
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
});

const sceneBackgroundImage = computed(() => getSceneImage(isNightTheme.value, isReplying.value, mood.value));

const sceneThemeClass = computed(() => {
  if (isNightTheme.value) {
    return "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950";
  }
  return "bg-gradient-to-b from-sky-300 via-cyan-200 to-blue-100";
});

const sceneVisualKey = computed(() => `${isNightTheme.value ? "night" : "day"}::${isReplying.value ? "replying" : "idle"}::${mood.value}`);

const sceneMaskClass = computed(() => {
  if (isNightTheme.value) {
    return "bg-slate-950/35";
  }
  if (isReplying.value) {
    return "bg-sky-100/35";
  }
  return "bg-white/20";
});

const backgroundStyle = computed(() => {
  const image = sceneBackgroundImage.value;
  if (!image) return {};
  return {
    backgroundImage: `url(${image})`,
  };
});

onMounted(() => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = () => {
    const themeAttr = document.documentElement.getAttribute("data-theme");
    const normalized = themeAttr?.toLowerCase().trim();
    const fromTheme = normalized ? darkThemeNames.has(normalized) : null;
    themePrefersDark.value = fromTheme ?? media.matches;
  };

  applyTheme();

  media.addEventListener("change", applyTheme);
  const observer = new MutationObserver(applyTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  onBeforeUnmount(() => {
    media.removeEventListener("change", applyTheme);
    observer.disconnect();
  });

  void initializeHistory();
});

onBeforeUnmount(() => {
  clearRecordingTicker();
  void stopVoiceRecording();
});

async function startNewConversation() {
  if (busy.value) return;
  error.value = "";
  await stopVoiceRecording();
  messages.value = [];
  threadId.value = null;
  activeThreadId.value = null;
  conversationEnded.value = false;
  isReplying.value = false;
  pendingAttachments.value = [];

  try {
    const response = await fetch("/api/clone/conversation", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error(`新建会话失败 (${response.status})`);
    }

    const data = (await response.json()) as CloneConversationCreateResponse;
    if (data.threadId) {
      threadId.value = data.threadId;
      activeThreadId.value = data.threadId;
    }
    if (typeof data.favorability === "number") {
      favorability.value = Math.round(data.favorability);
    }
    if (typeof data.latestImpression !== "undefined") {
      latestImpression.value = data.latestImpression;
    }
    if (data.mood) {
      mood.value = data.mood;
    }
    await refreshConversations();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "新建会话失败";
  }
}

function formatClock() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function splitAssistantMessages(text: string) {
  const decodedEscapedNewlines = text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
  const normalized = decodedEscapedNewlines.replace(/\r\n/g, "\n").trim();
  if (!normalized) return ["..."];
  const chunks = normalized.split(/\n\s*\n+/).map((item) => item.trim()).filter(Boolean);
  return chunks.length ? chunks : [normalized];
}

async function scrollMessagesToBottom() {
  await nextTick();
  const viewport = messagesViewportRef.value;
  if (!viewport) return;
  viewport.scrollTop = viewport.scrollHeight;
}

async function refreshConversations() {
  const list = await fetch("/api/clone/history", {
    credentials: "same-origin",
  });
  if (!list.ok) {
    throw new Error(`历史会话加载失败 (${list.status})`);
  }
  const data = (await list.json()) as CloneHistoryListResponse;
  conversations.value = Array.isArray(data.conversations) ? data.conversations : [];
}

function formatClockFromIso(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return formatClock();
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function removeAttachment(attachmentId: string) {
  pendingAttachments.value = pendingAttachments.value.filter((item) => item.id !== attachmentId);
}

function clearRecordingTicker() {
  if (recordingTicker.value !== null) {
    window.clearInterval(recordingTicker.value);
    recordingTicker.value = null;
  }
}

async function readFileAsDataUrl(file: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("文件读取失败"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

async function toBase64Payload(file: Blob) {
  const dataUrl = await readFileAsDataUrl(file);
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl;
  return dataUrl.slice(comma + 1);
}

async function appendFileAttachment(file: File) {
  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`文件 ${file.name} 超过 12MB 限制`);
  }

  const mimeType = file.type || "application/octet-stream";
  const kind: UploadKind = mimeType.startsWith("image/") ? "image" : "file";
  const dataBase64 = await toBase64Payload(file);
  pendingAttachments.value.push({
    id: crypto.randomUUID(),
    kind,
    name: file.name || (kind === "image" ? "image" : "file"),
    size: file.size,
    mimeType,
    dataBase64,
  });
}

async function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const files = input?.files;
  if (!files?.length) return;

  try {
    for (const file of Array.from(files)) {
      await appendFileAttachment(file);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "文件上传失败";
  } finally {
    if (input) input.value = "";
  }
}

async function startVoiceRecording() {
  if (isRecording.value) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  recordingChunksRef.value = [];
  mediaRecorderRef.value = recorder;

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordingChunksRef.value.push(event.data);
    }
  };

  recorder.onstop = async () => {
    const chunks = recordingChunksRef.value.slice();
    recordingChunksRef.value = [];
    const mimeType = recorder.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type: mimeType });

    if (blob.size > 0) {
      try {
        const dataBase64 = await toBase64Payload(blob);
        pendingAttachments.value.push({
          id: crypto.randomUUID(),
          kind: "voice",
          name: `voice-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`,
          size: blob.size,
          mimeType,
          dataBase64,
        });
      } catch {
        error.value = "语音处理失败";
      }
    }

    stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.value = null;
  };

  recorder.start();
  isRecording.value = true;
  recordingStartAt.value = Date.now();
  recordingNow.value = Date.now();
  clearRecordingTicker();
  recordingTicker.value = window.setInterval(() => {
    recordingNow.value = Date.now();
  }, 500);
}

async function stopVoiceRecording() {
  if (!isRecording.value) return;
  isRecording.value = false;
  recordingStartAt.value = null;
  clearRecordingTicker();
  const recorder = mediaRecorderRef.value;
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
  }
}

async function toggleVoiceRecording() {
  try {
    error.value = "";
    if (isRecording.value) {
      await stopVoiceRecording();
      return;
    }
    await startVoiceRecording();
  } catch (err) {
    isRecording.value = false;
    recordingStartAt.value = null;
    clearRecordingTicker();
    error.value = err instanceof Error ? err.message : "无法开启录音";
  }
}

function buildInputPartsFromAttachments(items: PendingAttachment[]): CloneInputPart[] {
  return items.map((item) => {
    if (item.kind === "image") {
      return {
        type: "image",
        mimeType: item.mimeType,
        dataBase64: item.dataBase64,
      };
    }

    return {
      type: "file",
      filename: item.name,
      mimeType: item.mimeType || "application/octet-stream",
      dataBase64: item.dataBase64,
    };
  });
}

function buildUserDisplayText(text: string, items: PendingAttachment[]) {
  if (!items.length) return text || "(空消息)";
  const imageCount = items.filter((item) => item.kind === "image").length;
  const voiceCount = items.filter((item) => item.kind === "voice").length;
  const fileCount = items.filter((item) => item.kind === "file").length;
  const tails: string[] = [];
  if (imageCount) tails.push(`图片${imageCount}`);
  if (voiceCount) tails.push(`语音${voiceCount}`);
  if (fileCount) tails.push(`文件${fileCount}`);
  const attachmentLine = `[附件: ${tails.join(" / ")}]`;
  return [text, attachmentLine].filter(Boolean).join("\n");
}

async function loadConversation(targetThreadId: string) {
  if (!targetThreadId || busy.value) return;

  const response = await fetch(`/api/clone/history?threadId=${encodeURIComponent(targetThreadId)}`, {
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(`会话详情加载失败 (${response.status})`);
  }

  const data = (await response.json()) as CloneHistoryDetailResponse;
  threadId.value = data.threadId;
  activeThreadId.value = data.threadId;
  const normalizedMessages: ChatItem[] = [];
  for (const item of data.messages || []) {
    if (item.role === "assistant") {
      const chunks = splitAssistantMessages(item.text || "");
      for (let i = 0; i < chunks.length; i += 1) {
        normalizedMessages.push({
          id: `${item.id}-${i}`,
          role: "assistant",
          text: chunks[i],
          createdAt: formatClockFromIso(item.createdAt),
        });
      }
      continue;
    }

    normalizedMessages.push({
      id: item.id,
      role: item.role,
      text: item.text,
      createdAt: formatClockFromIso(item.createdAt),
    });
  }

  messages.value = normalizedMessages;
  await scrollMessagesToBottom();
  conversationEnded.value = false;
  isReplying.value = normalizedMessages.length > 0;
  if (typeof data.favorability === "number") {
    favorability.value = Math.round(data.favorability);
  }
  if (typeof data.latestImpression !== "undefined") {
    latestImpression.value = data.latestImpression;
  }
  if (data.mood) {
    mood.value = data.mood;
  }
}

function openHistoryModal() {
  historyModalRef.value?.showModal();
}

async function handleSelectConversation(targetThreadId: string) {
  await loadConversation(targetThreadId);
  historyModalRef.value?.close();
}

async function handleDeleteConversation(targetThreadId: string) {
  if (busy.value) return;
  if (!targetThreadId) return;
  if (!window.confirm("确认删除这个会话吗？删除后无法恢复。")) return;

  error.value = "";

  try {
    const response = await fetch("/api/clone/conversation", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ threadId: targetThreadId }),
    });

    if (!response.ok) {
      throw new Error(`删除失败 (${response.status})`);
    }

    const wasActive = activeThreadId.value === targetThreadId;
    await refreshConversations();

    if (!wasActive) {
      return;
    }

    const nextThreadId = conversations.value[0]?.threadId;
    if (nextThreadId) {
      await loadConversation(nextThreadId);
      return;
    }

    messages.value = [];
    threadId.value = null;
    activeThreadId.value = null;
    conversationEnded.value = false;
    isReplying.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "删除会话失败";
  }
}

async function handleClearAllConversations() {
  if (busy.value) return;
  if (!conversations.value.length) return;
  if (!window.confirm("确认清空全部会话吗？该操作不可恢复。")) return;

  error.value = "";

  try {
    const response = await fetch("/api/clone/conversations", {
      method: "DELETE",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`清空失败 (${response.status})`);
    }

    conversations.value = [];
    messages.value = [];
    threadId.value = null;
    activeThreadId.value = null;
    conversationEnded.value = false;
    isReplying.value = false;
    pendingAttachments.value = [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "清空会话失败";
  }
}

async function initializeHistory() {
  try {
    const impressionRes = await fetch("/api/clone/impression", {
      credentials: "same-origin",
    });
    if (impressionRes.ok) {
      const impressionData = await impressionRes.json();
      if (typeof impressionData.favorability === "number") {
        favorability.value = Math.round(impressionData.favorability);
      }
      if (impressionData.latestImpression) {
        latestImpression.value = impressionData.latestImpression;
      }
      if (impressionData.mood) {
        mood.value = impressionData.mood;
      }
    }

    await refreshConversations();
    if (threadId.value) {
      await loadConversation(threadId.value);
      return;
    }

    const latestThreadId = conversations.value[0]?.threadId;
    if (latestThreadId) {
      await loadConversation(latestThreadId);
    }
  } catch {
    // keep page usable even if history fails
  }
}

watch(
  messages,
  () => {
    void scrollMessagesToBottom();
  },
  { deep: true },
);

function extractReplyPreview(raw: string) {
  if (!raw) return "";

  const leadingWhitespaceMatch = raw.match(/^\s*/);
  const offset = leadingWhitespaceMatch?.[0].length || 0;
  const normalized = raw.slice(offset);
  if (!normalized) return "";

  if (!normalized.startsWith("{")) {
    return raw;
  }

  const newlineIndex = normalized.indexOf("\n");
  if (newlineIndex === -1) {
    return "";
  }

  const controlLine = normalized.slice(0, newlineIndex).trim();
  const afterControl = normalized.slice(newlineIndex + 1);

  try {
    JSON.parse(controlLine);
    return afterControl;
  } catch {
    return raw;
  }
}

async function ensureReplyingVisible(startedAt: number) {
  const minimumMs = 500;
  const elapsed = Date.now() - startedAt;
  const remain = minimumMs - elapsed;
  if (remain <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, remain));
}

async function send() {
  const text = draft.value.trim();
  if ((!text && !pendingAttachments.value.length) || busy.value || conversationEnded.value) return;

  if (isRecording.value) {
    await stopVoiceRecording();
  }

  error.value = "";
  busy.value = true;
  const attachments = pendingAttachments.value.slice();
  const parts = buildInputPartsFromAttachments(attachments);
  pendingAttachments.value = [];
  draft.value = "";
  isReplying.value = true;
  const startedAt = Date.now();

  messages.value.push({
    id: crypto.randomUUID(),
    role: "user",
    text: buildUserDisplayText(text, attachments),
    createdAt: formatClock(),
  });
  const streamingAssistantId = crypto.randomUUID();
  messages.value.push({
    id: streamingAssistantId,
    role: "assistant",
    text: "",
    createdAt: formatClock(),
  });

  try {
    const response = await fetch("/api/clone/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        message: text,
        parts: parts.length ? parts : undefined,
        threadId: threadId.value || undefined,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`请求失败 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = "";
    let streamedText = "";
    let finalEvent: CloneStreamFinal | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split("\n");
      streamBuffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let event: CloneStreamEvent;
        try {
          event = JSON.parse(trimmed) as CloneStreamEvent;
        } catch {
          continue;
        }

        if (event.type === "chunk") {
          streamedText += event.text;
          const streamingItem = messages.value.find((item) => item.id === streamingAssistantId);
          if (streamingItem) {
            streamingItem.text = extractReplyPreview(streamedText);
          }
          continue;
        }

        if (event.type === "error") {
          throw new Error(event.message || "流式响应失败");
        }

        if (event.type === "final") {
          finalEvent = event;
        }
      }
    }

    if (!finalEvent) {
      finalEvent = {
        type: "final",
        text: extractReplyPreview(streamedText) || streamedText || "...",
        threadId: threadId.value || `clone-local-${crypto.randomUUID()}`,
      };
    }

    threadId.value = finalEvent.threadId;
    activeThreadId.value = finalEvent.threadId;

    const assistantMessages = splitAssistantMessages(finalEvent.text || streamedText || "...");
    messages.value = messages.value.filter((item) => item.id !== streamingAssistantId);
    for (const textChunk of assistantMessages) {
      messages.value.push({
        id: crypto.randomUUID(),
        role: "assistant",
        text: textChunk,
        createdAt: formatClock(),
      });
    }

    if (typeof finalEvent.favorability === "number") {
      favorability.value = Math.round(finalEvent.favorability);
    }
    if (typeof finalEvent.latestImpression !== "undefined") {
      latestImpression.value = finalEvent.latestImpression;
    }
    if (finalEvent.mood) {
      mood.value = finalEvent.mood;
    }
    await refreshConversations();

    await ensureReplyingVisible(startedAt);

    conversationEnded.value = finalEvent.endConversation ?? false;
  } catch (err) {
    messages.value = messages.value.filter((item) => item.id !== streamingAssistantId);
    pendingAttachments.value = [...attachments, ...pendingAttachments.value];
    if (text) {
      draft.value = text;
    }
    await ensureReplyingVisible(startedAt);
    error.value = err instanceof Error ? err.message : "发送失败，请稍后重试。";
  } finally {
    busy.value = false;
  }
}

useHead({
  title: "数字分身",
  meta: [
    { name: "description", content: "与 littlesheep 的 AI 数字分身聊天互动。" },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "数字分身 - Goatshed" },
    { property: "og:description", content: "与 littlesheep 的 AI 数字分身聊天互动。" },
  ],
});
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.scene-fade-enter-active,
.scene-fade-leave-active {
  transition: opacity 360ms ease, transform 360ms ease;
}

.scene-fade-enter-from,
.scene-fade-leave-to {
  opacity: 0;
  transform: scale(1.01);
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.typing-dot {
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.35;
  animation: typing-pulse 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 120ms;
}

.typing-dot:nth-child(3) {
  animation-delay: 240ms;
}

@keyframes typing-pulse {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  40% {
    transform: translateY(-2px);
    opacity: 0.95;
  }
}
</style>
