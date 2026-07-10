<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-5xl">
            <div class="mb-6">
                <NuxtLink
                    to="/me"
                    class="mb-3 inline-flex items-center gap-1 text-sm text-base-content/60 hover:text-base-content"
                >
                    <ChevronLeft class="h-4 w-4" />
                    我的账户
                </NuxtLink>
                <h1 class="text-xl font-bold sm:text-2xl">看板组件</h1>
                <p class="mt-1 text-sm text-base-content/60">
                    管理你在 Solarpass 个人主页上的 Goatshed 组件
                </p>
            </div>

            <div v-if="pageLoading" class="flex justify-center py-16">
                <Loader2 class="h-6 w-6 animate-spin text-base-content/40" />
            </div>

            <div
                v-else
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <!-- Mood widget -->
                <section class="flex flex-col rounded-box border border-base-300 bg-base-100 p-5">
                    <div class="mb-3 flex items-start justify-between gap-2">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Smile class="h-5 w-5" />
                            </div>
                            <div class="min-w-0">
                                <h2 class="font-bold">心情</h2>
                                <p class="truncate text-xs text-base-content/50">
                                    {{ moodState?.widget_key || "mood" }}
                                </p>
                            </div>
                        </div>
                        <span
                            class="badge badge-sm shrink-0"
                            :class="moodState?.installed ? 'badge-success badge-outline' : 'badge-ghost'"
                        >
                            {{ moodState?.installed ? "已安装" : "未安装" }}
                        </span>
                    </div>

                    <p class="mb-4 text-sm text-base-content/60">
                        默认用 Solarpass 头像；可填 URL 或文件 ID 覆盖。
                    </p>

                    <div class="mt-auto flex flex-col gap-3">
                        <div v-if="moodError" class="alert alert-warning text-sm">
                            <AlertCircle class="h-4 w-4 shrink-0" />
                            <span>{{ moodError }}</span>
                        </div>

                        <template v-else>
                            <div class="flex items-center gap-3">
                                <div class="avatar">
                                    <div class="h-10 w-10 rounded-full bg-base-200">
                                        <img v-if="avatarUrl" :src="avatarUrl" alt="" />
                                    </div>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs text-base-content/50">当前心情</p>
                                    <p class="truncate text-sm">
                                        {{ moodState?.mood || "还没有设置" }}
                                    </p>
                                </div>
                            </div>

                            <div class="flex flex-col gap-3">
                                <label class="flex w-full flex-col gap-1">
                                    <span class="text-xs text-base-content/70">图片（可选覆盖）</span>
                                    <input
                                        v-model="moodImage"
                                        type="text"
                                        class="input input-bordered input-sm w-full"
                                        :placeholder="moodState?.profile_picture_id || 'URL 或文件 ID'"
                                        :disabled="moodSaving"
                                    />
                                </label>

                                <div class="flex items-center gap-2">
                                    <input
                                        v-model="moodDraft"
                                        type="text"
                                        maxlength="280"
                                        class="input input-bordered input-sm min-w-0 flex-1"
                                        placeholder="今天感觉怎么样？"
                                        :disabled="moodSaving"
                                        @keydown.enter.prevent="saveMood"
                                    />
                                    <button
                                        class="btn btn-primary btn-sm shrink-0"
                                        :disabled="moodSaving || !moodDraft.trim()"
                                        @click="saveMood"
                                    >
                                        <Loader2 v-if="moodSaving" class="h-4 w-4 animate-spin" />
                                        <span v-else>{{ moodState?.installed ? "更新" : "设置" }}</span>
                                    </button>
                                </div>
                            </div>
                            <p v-if="moodSaveError" class="text-xs text-error">{{ moodSaveError }}</p>
                            <p v-else-if="moodSavedAt" class="text-xs text-base-content/40">已保存 · {{ moodSavedAt }}</p>
                        </template>
                    </div>
                </section>

                <!-- Working widget -->
                <section class="flex flex-col rounded-box border border-base-300 bg-base-100 p-5">
                    <div class="mb-3 flex items-start justify-between gap-2">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ListTodo class="h-5 w-5" />
                            </div>
                            <div class="min-w-0">
                                <h2 class="font-bold">在忙</h2>
                                <p class="truncate text-xs text-base-content/50">
                                    {{ workingState?.widget_key || "working" }}
                                </p>
                            </div>
                        </div>
                        <span
                            class="badge badge-sm shrink-0"
                            :class="workingState?.installed ? 'badge-success badge-outline' : 'badge-ghost'"
                        >
                            {{ workingState?.installed ? "已安装" : "未安装" }}
                        </span>
                    </div>

                    <p class="mb-4 text-sm text-base-content/60">
                        默认用 Solarpass 头像/背景；可填 URL 或文件 ID 覆盖。
                    </p>

                    <div class="mt-auto flex flex-col gap-3">
                        <div v-if="workingError" class="alert alert-warning text-sm">
                            <AlertCircle class="h-4 w-4 shrink-0" />
                            <span>{{ workingError }}</span>
                        </div>

                        <template v-else>
                            <div class="flex flex-col gap-3">
                                <label class="flex w-full flex-col gap-1">
                                    <span class="text-xs text-base-content/70">图片（可选覆盖）</span>
                                    <input
                                        v-model="workingImage"
                                        type="text"
                                        class="input input-bordered input-sm w-full"
                                        :placeholder="workingState?.profile_picture_id || 'URL 或文件 ID'"
                                        :disabled="workingSaving"
                                    />
                                </label>
                                <label class="mb-1 flex w-full flex-col gap-1">
                                    <span class="text-xs text-base-content/70">背景（可选覆盖）</span>
                                    <input
                                        v-model="workingBackground"
                                        type="text"
                                        class="input input-bordered input-sm w-full"
                                        :placeholder="workingState?.profile_background_id || 'URL 或文件 ID'"
                                        :disabled="workingSaving"
                                    />
                                </label>
                            </div>

                            <div class="flex flex-col gap-2">
                                <div
                                    v-for="(task, index) in workingTasks"
                                    :key="index"
                                    class="flex items-center gap-2"
                                >
                                    <input
                                        v-model="workingTasks[index]"
                                        type="text"
                                        maxlength="200"
                                        class="input input-bordered input-sm min-w-0 flex-1"
                                        :placeholder="`任务 ${index + 1}`"
                                        :disabled="workingSaving"
                                        @keydown.enter.prevent="addWorkingTask"
                                    />
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm btn-square shrink-0 text-error"
                                        :disabled="workingSaving"
                                        title="移除"
                                        @click="removeWorkingTask(index)"
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    class="btn btn-ghost btn-sm w-full border border-dashed border-base-300"
                                    :disabled="workingSaving || workingTasks.length >= 30"
                                    @click="addWorkingTask"
                                >
                                    <Plus class="h-4 w-4" />
                                    添加任务
                                </button>
                            </div>

                            <button
                                class="btn btn-primary btn-sm w-full"
                                :disabled="workingSaving"
                                @click="saveWorking"
                            >
                                <Loader2 v-if="workingSaving" class="h-4 w-4 animate-spin" />
                                <span v-else>{{ workingState?.installed ? "更新任务" : "安装并保存" }}</span>
                            </button>
                            <p v-if="workingSaveError" class="text-xs text-error">{{ workingSaveError }}</p>
                            <p v-else-if="workingSavedAt" class="text-xs text-base-content/40">已保存 · {{ workingSavedAt }}</p>
                        </template>
                    </div>
                </section>

                <!-- Profile widget -->
                <section class="flex flex-col rounded-box border border-base-300 bg-base-100 p-5">
                    <div class="mb-3 flex items-start justify-between gap-2">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <UserRound class="h-5 w-5" />
                            </div>
                            <div class="min-w-0">
                                <h2 class="font-bold">资料卡</h2>
                                <p class="truncate text-xs text-base-content/50">
                                    {{ profileWidgetState?.widget_key || "profile" }}
                                </p>
                            </div>
                        </div>
                        <span
                            class="badge badge-sm shrink-0"
                            :class="profileWidgetState?.installed ? 'badge-success badge-outline' : 'badge-ghost'"
                        >
                            {{ profileWidgetState?.installed ? "已安装" : "未安装" }}
                        </span>
                    </div>

                    <p class="mb-4 text-sm text-base-content/60">
                        默认用 Solarpass 头像/背景；可覆盖，并添加最多 6 组字段。
                    </p>

                    <div class="mt-auto flex flex-col gap-3">
                        <div v-if="profileWidgetError" class="alert alert-warning text-sm">
                            <AlertCircle class="h-4 w-4 shrink-0" />
                            <span>{{ profileWidgetError }}</span>
                        </div>

                        <template v-else>
                            <div class="flex flex-col gap-3">
                                <label class="flex w-full flex-col gap-1">
                                    <span class="text-xs text-base-content/70">图片（可选覆盖）</span>
                                    <input
                                        v-model="profileImage"
                                        type="text"
                                        class="input input-bordered input-sm w-full"
                                        :placeholder="profileWidgetState?.profile_picture_id || 'URL 或文件 ID'"
                                        :disabled="profileWidgetSaving"
                                    />
                                </label>
                                <label class="mb-1 flex w-full flex-col gap-1">
                                    <span class="text-xs text-base-content/70">背景（可选覆盖）</span>
                                    <input
                                        v-model="profileBackground"
                                        type="text"
                                        class="input input-bordered input-sm w-full"
                                        :placeholder="profileWidgetState?.profile_background_id || 'URL 或文件 ID'"
                                        :disabled="profileWidgetSaving"
                                    />
                                </label>
                            </div>

                            <div class="flex flex-col gap-2">
                                <div
                                    v-for="(pair, index) in profilePairs"
                                    :key="index"
                                    class="flex items-center gap-2"
                                >
                                    <input
                                        v-model="pair.key"
                                        type="text"
                                        maxlength="64"
                                        class="input input-bordered input-sm w-[40%] shrink-0"
                                        placeholder="键"
                                        :disabled="profileWidgetSaving"
                                    />
                                    <input
                                        v-model="pair.value"
                                        type="text"
                                        maxlength="200"
                                        class="input input-bordered input-sm min-w-0 flex-1"
                                        placeholder="值"
                                        :disabled="profileWidgetSaving"
                                    />
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm btn-square shrink-0 text-error"
                                        :disabled="profileWidgetSaving"
                                        title="移除"
                                        @click="removeProfilePair(index)"
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    class="btn btn-ghost btn-sm w-full border border-dashed border-base-300"
                                    :disabled="profileWidgetSaving || profilePairs.length >= 6"
                                    @click="addProfilePair"
                                >
                                    <Plus class="h-4 w-4" />
                                    添加字段
                                </button>
                            </div>

                            <button
                                class="btn btn-primary btn-sm w-full"
                                :disabled="profileWidgetSaving"
                                @click="saveProfileWidget"
                            >
                                <Loader2 v-if="profileWidgetSaving" class="h-4 w-4 animate-spin" />
                                <span v-else>{{ profileWidgetState?.installed ? "更新资料卡" : "安装并保存" }}</span>
                            </button>
                            <p v-if="profileWidgetSaveError" class="text-xs text-error">{{ profileWidgetSaveError }}</p>
                            <p v-else-if="profileWidgetSavedAt" class="text-xs text-base-content/40">
                                已保存 · {{ profileWidgetSavedAt }}
                            </p>
                        </template>
                    </div>
                </section>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import {
    ChevronLeft,
    Smile,
    Loader2,
    AlertCircle,
    ListTodo,
    Plus,
    Trash2,
    UserRound,
} from "lucide-vue-next";

definePageMeta({
    middleware: ["auth"],
});

useHead({ title: "看板组件" });

const config = useRuntimeConfig();
const auth = useAuth();

interface MoodState {
    app_id: string;
    widget_key: string;
    installed: boolean;
    board_item_id: string | null;
    mood: string;
    image: string;
    image_file_id: string | null;
    profile_picture_id: string | null;
    can_push: boolean;
    missing: string[];
}

interface WorkingState {
    app_id: string;
    widget_key: string;
    installed: boolean;
    board_item_id: string | null;
    tasks: string[];
    image: string;
    background: string;
    image_file_id: string | null;
    background_file_id: string | null;
    profile_picture_id: string | null;
    profile_background_id: string | null;
    can_push: boolean;
    missing: string[];
}

interface ProfileWidgetState {
    app_id: string;
    widget_key: string;
    installed: boolean;
    board_item_id: string | null;
    data: Record<string, string>;
    image: string;
    background: string;
    image_file_id: string | null;
    background_file_id: string | null;
    profile_picture_id: string | null;
    profile_background_id: string | null;
    can_push: boolean;
    missing: string[];
}

interface KvPair {
    key: string;
    value: string;
}

const { data: session } = await auth.useSession(useFetch);
const { data: profile } = await useFetch<Record<string, any> | null>(
    "/api/sn/profile",
    {
        default: () => null,
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    },
);

const avatarUrl = computed(() => {
    const name = profile.value?.name || session.value?.user?.name;
    if (!name) return "";
    return `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(name)}/picture`;
});

const pageLoading = ref(true);

// ── Mood ──
const moodState = ref<MoodState | null>(null);
const moodDraft = ref("");
const moodImage = ref("");
const moodSaving = ref(false);
const moodError = ref<string | null>(null);
const moodSaveError = ref<string | null>(null);
const moodSavedAt = ref<string | null>(null);

async function loadMood() {
    moodError.value = null;
    try {
        const data = await $fetch<MoodState>("/api/me/widgets/mood");
        moodState.value = data;
        moodDraft.value = data.mood || "";
        // Show stored value if it differs from profile default; otherwise leave blank (= use default)
        moodImage.value =
            data.image_file_id && data.image_file_id !== data.profile_picture_id
                ? data.image_file_id
                : data.image && data.image !== data.profile_picture_id
                    ? data.image
                    : "";
    } catch (e: any) {
        moodError.value = e.data?.message || e.message || "无法加载心情组件";
        moodState.value = null;
    }
}

async function saveMood() {
    moodSaving.value = true;
    moodSaveError.value = null;
    moodSavedAt.value = null;
    try {
        const data = await $fetch<MoodState>("/api/me/widgets/mood", {
            method: "PUT",
            body: {
                mood: moodDraft.value,
                image: moodImage.value.trim() || undefined,
            },
        });
        moodState.value = data;
        moodDraft.value = data.mood || moodDraft.value;
        moodImage.value =
            data.image_file_id && data.image_file_id !== data.profile_picture_id
                ? data.image_file_id
                : data.image && data.image !== data.profile_picture_id
                    ? data.image
                    : "";
        moodSavedAt.value = new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (e: any) {
        moodSaveError.value = e.data?.message || e.message || "保存失败";
    } finally {
        moodSaving.value = false;
    }
}

// ── Working ──
const workingState = ref<WorkingState | null>(null);
const workingTasks = ref<string[]>([""]);
const workingImage = ref("");
const workingBackground = ref("");
const workingSaving = ref(false);
const workingError = ref<string | null>(null);
const workingSaveError = ref<string | null>(null);
const workingSavedAt = ref<string | null>(null);

function mediaOverrideDisplay(stored: string | null | undefined, profileDefault: string | null | undefined, fallback: string) {
    const s = stored || fallback || "";
    if (!s) return "";
    if (profileDefault && s === profileDefault) return "";
    return s;
}

async function loadWorking() {
    workingError.value = null;
    try {
        const data = await $fetch<WorkingState>("/api/me/widgets/working");
        workingState.value = data;
        workingTasks.value = data.tasks.length > 0 ? [...data.tasks] : [""];
        workingImage.value = mediaOverrideDisplay(data.image_file_id, data.profile_picture_id, data.image);
        workingBackground.value = mediaOverrideDisplay(data.background_file_id, data.profile_background_id, data.background);
    } catch (e: any) {
        workingError.value = e.data?.message || e.message || "无法加载在忙组件";
        workingState.value = null;
    }
}

function addWorkingTask() {
    if (workingTasks.value.length >= 30) return;
    workingTasks.value.push("");
}

function removeWorkingTask(index: number) {
    workingTasks.value.splice(index, 1);
    if (workingTasks.value.length === 0) {
        workingTasks.value.push("");
    }
}

async function saveWorking() {
    workingSaving.value = true;
    workingSaveError.value = null;
    workingSavedAt.value = null;
    try {
        const tasks = workingTasks.value.map((t) => t.trim()).filter(Boolean);
        const data = await $fetch<WorkingState>("/api/me/widgets/working", {
            method: "PUT",
            body: {
                tasks,
                image: workingImage.value.trim() || undefined,
                background: workingBackground.value.trim() || undefined,
            },
        });
        workingState.value = data;
        workingTasks.value = data.tasks.length > 0 ? [...data.tasks] : [""];
        workingImage.value = mediaOverrideDisplay(data.image_file_id, data.profile_picture_id, data.image);
        workingBackground.value = mediaOverrideDisplay(data.background_file_id, data.profile_background_id, data.background);
        workingSavedAt.value = new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (e: any) {
        workingSaveError.value = e.data?.message || e.message || "保存失败";
    } finally {
        workingSaving.value = false;
    }
}

// ── Profile widget ──
const profileWidgetState = ref<ProfileWidgetState | null>(null);
const profilePairs = ref<KvPair[]>([{ key: "", value: "" }]);
const profileImage = ref("");
const profileBackground = ref("");
const profileWidgetSaving = ref(false);
const profileWidgetError = ref<string | null>(null);
const profileWidgetSaveError = ref<string | null>(null);
const profileWidgetSavedAt = ref<string | null>(null);

function dataToPairs(data: Record<string, string>): KvPair[] {
    const entries = Object.entries(data || {});
    if (entries.length === 0) return [{ key: "", value: "" }];
    return entries.map(([key, value]) => ({ key, value }));
}

async function loadProfileWidget() {
    profileWidgetError.value = null;
    try {
        const data = await $fetch<ProfileWidgetState>("/api/me/widgets/profile");
        profileWidgetState.value = data;
        profilePairs.value = dataToPairs(data.data);
        profileImage.value = mediaOverrideDisplay(data.image_file_id, data.profile_picture_id, data.image);
        profileBackground.value = mediaOverrideDisplay(data.background_file_id, data.profile_background_id, data.background);
    } catch (e: any) {
        profileWidgetError.value = e.data?.message || e.message || "无法加载资料卡组件";
        profileWidgetState.value = null;
    }
}

function addProfilePair() {
    if (profilePairs.value.length >= 6) return;
    profilePairs.value.push({ key: "", value: "" });
}

function removeProfilePair(index: number) {
    profilePairs.value.splice(index, 1);
    if (profilePairs.value.length === 0) {
        profilePairs.value.push({ key: "", value: "" });
    }
}

async function saveProfileWidget() {
    profileWidgetSaving.value = true;
    profileWidgetSaveError.value = null;
    profileWidgetSavedAt.value = null;
    try {
        const dataMap: Record<string, string> = {};
        for (const pair of profilePairs.value) {
            const key = pair.key.trim();
            if (!key) continue;
            if (key in dataMap) {
                profileWidgetSaveError.value = `重复的键：${key}`;
                return;
            }
            dataMap[key] = pair.value.trim();
        }

        const data = await $fetch<ProfileWidgetState>("/api/me/widgets/profile", {
            method: "PUT",
            body: {
                data: dataMap,
                image: profileImage.value.trim() || undefined,
                background: profileBackground.value.trim() || undefined,
            },
        });
        profileWidgetState.value = data;
        profilePairs.value = dataToPairs(data.data);
        profileImage.value = mediaOverrideDisplay(data.image_file_id, data.profile_picture_id, data.image);
        profileBackground.value = mediaOverrideDisplay(data.background_file_id, data.profile_background_id, data.background);
        profileWidgetSavedAt.value = new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (e: any) {
        profileWidgetSaveError.value = e.data?.message || e.message || "保存失败";
    } finally {
        profileWidgetSaving.value = false;
    }
}

onMounted(async () => {
    pageLoading.value = true;
    await Promise.all([loadMood(), loadWorking(), loadProfileWidget()]);
    pageLoading.value = false;
});
</script>
