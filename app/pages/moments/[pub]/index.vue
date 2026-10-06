<template>
  <main class="page-shell relative min-w-0 pb-8">
    <CoverHero
      :image="publisherBackgroundUrl"
      class="cover-bleed cover-under-app-bar mb-6"
    >
      <div
        class="page-shell flex min-h-[46dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[54dvh] sm:pb-28 sm:pt-14"
      >
        <ShellBreadcrumb class="self-start" :path="`/moments/${activePub}`" />

        <h1 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          动态
        </h1>
        <p class="mt-2 text-sm text-base-content/75">
          来自所选发布者的短内容更新。
        </p>
      </div>
    </CoverHero>

    <section v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </section>

    <section
      v-else
      class="grid min-w-0 gap-5 lg:grid-cols-[19rem_minmax(0,42rem)]"
    >
      <PublisherSidebar
        :publisher-name="activePub"
        class="min-w-0 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:pt-24 lg:pb-6"
        @change="setPublisher"
      />

      <div class="min-w-0">
        <ol v-if="dayGroups.length" class="moments-timeline">
          <li
            v-for="group in dayGroups"
            :key="group.key"
            class="timeline-group"
          >
            <div class="timeline-date">
              <div class="timeline-rail" aria-hidden="true">
                <span class="timeline-day-dot" />
              </div>
              <div class="timeline-date-body">
                <time class="timeline-day-label" :datetime="group.key">
                  {{ group.label }}
                </time>
                <span class="timeline-weekday">{{ group.weekday }}</span>
                <span class="timeline-day-rule" />
                <span class="timeline-day-count">{{ group.count }}</span>
              </div>
            </div>

            <ol class="timeline-list">
              <li
                v-for="moment in group.moments"
                :key="moment.post.id"
                class="timeline-entry"
              >
                <div class="timeline-rail" aria-hidden="true">
                  <span class="timeline-dot" />
                </div>

                <article class="timeline-card">
                  <MomentMedia
                    v-if="moment.images.length"
                    :images="moment.images"
                    :to="getMomentPostUrl(moment.post)"
                    :ratio="mediaRatio(moment)"
                    :transition-name="`moment-img-${moment.post.id}`"
                  />

                  <NuxtLink
                    :to="getMomentPostUrl(moment.post)"
                    class="timeline-card-link"
                  >
                    <div class="timeline-card-body">
                      <div class="timeline-meta">
                        <time
                          class="timeline-time"
                          :datetime="moment.publishedAt"
                        >
                          {{ moment.time }}
                        </time>
                        <span
                          v-if="moment.post.viewsUnique"
                          class="timeline-views"
                        >
                          {{ moment.post.viewsUnique }} 次阅读
                        </span>
                      </div>

                      <h2
                        v-if="moment.post.title"
                        class="timeline-title"
                      >
                        {{ moment.post.title }}
                      </h2>

                      <article
                        v-if="renderedBody(moment.post.id)"
                        class="prose-goatshed timeline-article line-clamp-4"
                        v-html="renderedBody(moment.post.id)"
                      />
                    </div>
                  </NuxtLink>
                </article>
              </li>
            </ol>
          </li>
        </ol>

        <div v-else class="timeline-empty">
          <p>这里还没有动态。</p>
        </div>

        <div class="flex flex-col items-center gap-3 py-8">
          <button
            v-if="hasMore"
            class="btn btn-outline btn-sm"
            :disabled="loadingMore"
            @click="loadMore"
          >
            <span
              v-if="loadingMore"
              class="loading loading-spinner loading-sm"
            />
            <span v-else>加载更多动态</span>
          </button>
          <p
            v-else-if="moments.length"
            class="font-mono text-xs text-base-content/55"
          >
            没有更多动态了。
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import {
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import type { Post, PostListResponse } from "~/types/post";
import type { Publisher } from "~/types/publisher";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const activePub = computed<PublisherName>(() => {
  const value = route.params.pub;
  return typeof value === "string" && isPublisherName(value)
    ? value
    : "littlesheep";
});

const { data: publishersData } = await useFetch<
  Record<string, Publisher | null>
>("/api/publishers");

const publisherBackgroundUrl = computed(() => {
  const background = publishersData.value?.[activePub.value]?.background;
  if (!background?.id) return null;
  return (
    background.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(background.id)}`
  );
});

const moments = ref<Post[]>([]);
const total = ref(0);
const offset = ref(0);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const renderedMoments = ref<
  Record<string, { description: string; content: string }>
>({});

const hasMore = computed(() => moments.value.length < total.value);

interface TimelineImage {
  src: string;
  alt: string;
  blurhash?: string;
  width?: number;
  height?: number;
}

interface TimelineMoment {
  post: Post;
  time: string;
  publishedAt: string;
  images: TimelineImage[];
}

interface TimelineDay {
  key: string;
  label: string;
  weekday: string;
  count: number;
  moments: TimelineMoment[];
}

function postImages(post: Post): TimelineImage[] {
  const images: TimelineImage[] = [];

  if (post.picture?.id) {
    images.push({
      src:
        post.picture.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.picture.id)}`,
      alt: post.title || "动态图片",
      blurhash: post.picture.blurhash ?? undefined,
      width: post.picture.width ?? undefined,
      height: post.picture.height ?? undefined,
    });
  }

  if (post.attachments?.length) {
    for (const att of post.attachments) {
      if (att.id && att.mimeType?.startsWith("image/")) {
        images.push({
          src:
            att.url ||
            `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(att.id)}`,
          alt: att.name || post.title || "动态图片",
          blurhash: att.blurhash ?? undefined,
          width: att.width ?? undefined,
          height: att.height ?? undefined,
        });
      }
    }
  }

  if (images.length === 0 && post.background?.id) {
    images.push({
      src:
        post.background.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.background.id)}`,
      alt: post.title || "动态图片",
      blurhash: post.background.blurhash ?? undefined,
      width: post.background.width ?? undefined,
      height: post.background.height ?? undefined,
    });
  }

  return images;
}

function dayKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(date: Date) {
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === new Date().getFullYear()
      ? { month: "long", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat("zh-CN", options).format(date);
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date);
}

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const dayGroups = computed<TimelineDay[]>(() => {
  const groups: TimelineDay[] = [];
  const byKey = new Map<string, TimelineDay>();

  for (const post of moments.value) {
    const date = new Date(post.publishedAt || post.createdAt);
    const key = dayKey(date);
    let group = byKey.get(key);

    if (!group) {
      group = {
        key,
        label: dayLabel(date),
        weekday: weekdayLabel(date),
        count: 0,
        moments: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }

    group.moments.push({
      post,
      time: timeLabel(date),
      publishedAt: date.toISOString(),
      images: postImages(post),
    });
    group.count++;
  }

  return groups;
});

function mediaRatio(moment: TimelineMoment) {
  const image = moment.images[0];
  return image?.width && image.height
    ? `${image.width} / ${image.height}`
    : "16 / 9";
}

function renderedBody(postId: string) {
  const entry = renderedMoments.value[postId];
  if (!entry) return "";
  return entry.description || entry.content || "";
}

function queryParams(nextOffset: number) {
  return {
    pub: activePub.value,
    type: 0,
    take: 24,
    offset: nextOffset,
  };
}

async function loadInitial() {
  loading.value = true;
  error.value = null;
  offset.value = 0;
  try {
    const result = await $fetch<PostListResponse>("/api/posts", {
      query: queryParams(0),
    });
    moments.value = result.posts;
    total.value = result.total;
    offset.value = result.posts.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载动态失败";
    moments.value = [];
    total.value = 0;
    offset.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  error.value = null;
  try {
    const result = await $fetch<PostListResponse>("/api/posts", {
      query: queryParams(offset.value),
    });
    moments.value = [...moments.value, ...result.posts];
    total.value = result.total;
    offset.value += result.posts.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载更多动态失败";
  } finally {
    loadingMore.value = false;
  }
}

watch(
  moments,
  async (items) => {
    const next: Record<string, { description: string; content: string }> = {};
    await Promise.all(
      items.map(async (post) => {
        const description = post.description
          ? await renderMarkdown(withSoftBreaks(post.description))
          : "";
        const content = post.content
          ? await renderMarkdown(withSoftBreaks(post.content))
          : "";
        next[post.id] = { description, content };
      }),
    );
    renderedMoments.value = next;
  },
  { immediate: true },
);

function withSoftBreaks(input: string) {
  return input.replace(/\r?\n/g, "  \n");
}

function getMomentPostUrl(post: Post) {
  const identifier = getPostIdentifier(post);
  return `/moments/${identifier}`;
}

async function setPublisher(next: PublisherName) {
  await router.push(`/moments/${next}`);
}

watch(
  activePub,
  async () => {
    await loadInitial();
  },
  { immediate: true },
);

useHead({
  title: "动态",
  meta: [
    { name: "description", content: "浏览 littlesheep 的生活动态和日常碎片。" },
    { property: "og:title", content: "动态 - Goatshed" },
    {
      property: "og:description",
      content: "浏览 littlesheep 的生活动态和日常碎片。",
    },
    { property: "og:type", content: "website" },
  ],
});
</script>

<style scoped>
/* ── Rail ─────────────────────────────────────────────────────────── */

/* Named `moments-timeline`, not `timeline`: daisyUI ships a `.timeline`
   component whose base rule is `display: flex` (horizontal), which would
   turn this vertical list sideways. */
.moments-timeline {
  --rail-width: 1.75rem;
  --node-top: 1.5rem;
  --day-node: 1rem;
  --dot-size: 0.625rem;
  --day-dot-size: 0.75rem;
  --rail-line: color-mix(in srgb, var(--color-base-300) 78%, transparent);

  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 640px) {
  .moments-timeline {
    --rail-width: 2.5rem;
    --node-top: 1.75rem;
  }
}

.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.timeline-date,
.timeline-entry {
  display: grid;
  grid-template-columns: var(--rail-width) minmax(0, 1fr);
}

.timeline-rail {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.timeline-rail::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--rail-line);
}

/* The spine begins at the first day node and ends at the final moment node. */
.timeline-group:first-child .timeline-date .timeline-rail::before {
  top: var(--day-node);
}

.timeline-group:last-child
  .timeline-entry:last-child
  .timeline-rail::before {
  bottom: calc(100% - var(--node-top));
}

.timeline-dot,
.timeline-day-dot {
  position: relative;
  z-index: 1;
  border-radius: 9999px;
  background: var(--color-base-100);
}

.timeline-dot {
  width: var(--dot-size);
  height: var(--dot-size);
  margin-top: calc(var(--node-top) - var(--dot-size) / 2);
  border: 2px solid
    color-mix(in srgb, var(--color-primary) 40%, var(--color-base-300));
  box-shadow: 0 0 0 4px var(--color-base-100);
  transition:
    border-color 200ms ease,
    background-color 200ms ease,
    transform 200ms ease;
}

.timeline-day-dot {
  width: var(--day-dot-size);
  height: var(--day-dot-size);
  margin-top: calc(var(--day-node) - var(--day-dot-size) / 2);
  border: 2px solid var(--color-base-100);
  background: var(--color-primary);
  box-shadow: 0 0 0 4px
    color-mix(in srgb, var(--color-primary) 14%, var(--color-base-100));
}

.timeline-entry:hover .timeline-dot {
  border-color: var(--color-primary);
  background: var(--color-primary);
  transform: scale(1.15);
}

/* ── Day heading ──────────────────────────────────────────────────── */

.timeline-date-body {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding-bottom: 0.5rem;
}

.timeline-day-label {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-base-content);
  font-variant-numeric: tabular-nums;
}

.timeline-weekday {
  font-size: 0.6875rem;
  color: color-mix(in srgb, var(--color-base-content) 45%, transparent);
}

.timeline-day-rule {
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--color-base-300) 55%, transparent);
}

.timeline-day-count {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.6875rem;
  color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  font-variant-numeric: tabular-nums;
}

/* ── Moment card ──────────────────────────────────────────────────── */

.timeline-card {
  display: block;
  overflow: hidden;
  margin-bottom: 0.875rem;
  border-radius: var(--radius-box, 0.9rem);
  border: 1px solid
    color-mix(in srgb, var(--color-base-300) 70%, transparent);
  background: var(--color-base-100);
  transition:
    border-color 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease;
}

.timeline-entry:last-child .timeline-card {
  margin-bottom: 0;
}

.timeline-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px oklch(0 0 0 / 0.06);
}

.timeline-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.timeline-card-body {
  padding: 1rem;
}

@media (min-width: 640px) {
  .timeline-card-body {
    padding: 1.25rem;
  }
}

.timeline-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}

.timeline-time {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}

.timeline-views::before {
  content: "·";
  margin-inline-end: 0.5rem;
  opacity: 0.6;
}

.timeline-title {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
  color: color-mix(in srgb, var(--color-base-content) 92%, transparent);
}

.timeline-article {
  margin-top: 0.375rem;
  color: color-mix(in srgb, var(--color-base-content) 78%, transparent);
}

.timeline-empty {
  padding: 4rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .timeline-card,
  .timeline-dot {
    transition: none;
  }

  .timeline-card:hover,
  .timeline-entry:hover .timeline-dot {
    transform: none;
  }
}
</style>
