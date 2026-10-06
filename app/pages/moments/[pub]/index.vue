<template>
  <main ref="root" class="page-shell moments-page relative min-w-0 pb-8">
    <!--
      The cover is the deck's first stop, so paging down from it lands on the
      first moment instead of skipping past it. It keeps its cover height: the
      screen belongs to the moments themselves.
    -->
    <CoverHero
      :image="publisherBackgroundUrl"
      :blurhash="publisherBackgroundBlurhash"
      class="cover-bleed cover-under-app-bar mb-6"
      data-slide
    >
      <div
        class="flex min-h-[46dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[54dvh] sm:pb-28 sm:pt-14"
      >
        <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
          动态
        </h1>
        <p class="mt-2 text-sm text-base-content/75">
            抱怨，碎碎念，和广告 (指更新日志)
        </p>

        <ShellBreadcrumb class="self-start mt-4" :path="`/moments/${activePub}`" />
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
        :data-slide="stackedSidebar ? '' : null"
        @change="setPublisher"
      />

      <div class="min-w-0">
        <ol v-if="dayGroups.length" class="moments-timeline">
          <li
            v-for="group in dayGroups"
            :key="group.key"
            class="timeline-group"
          >
            <ol class="timeline-list">
              <li
                v-for="(moment, index) in group.moments"
                :key="moment.post.id"
                class="timeline-entry"
                data-slide
              >
                <!--
                  The day heading opens the first moment's screen rather than
                  standing between screens, so the label is on hand whenever
                  that moment is, and every moment keeps a screen of its own.
                -->
                <!--
                  The day badge is an indicator, not a node: it sits centred in
                  the row, and the spine runs past it on the right.
                -->
                <div v-if="index === 0" class="timeline-row timeline-row-day">
                  <div class="timeline-day-pill">
                    <time class="timeline-day-label" :datetime="group.key">
                      {{ group.label }}
                    </time>
                    <span class="timeline-weekday">{{ group.weekday }}</span>
                    <span class="timeline-day-count">{{ group.count }}</span>
                  </div>

                  <div class="timeline-rail" aria-hidden="true" />
                </div>

                <div class="timeline-row timeline-row-moment">
                  <div class="timeline-moment">
                    <MomentCard
                      :post="moment.post"
                      :images="moment.images"
                      :ratio="mediaRatio(moment)"
                      :time="moment.time"
                      :published-at="moment.publishedAt"
                      :transition-name="`moment-img-${moment.post.id}`"
                      :rendered-body="renderedBody(moment.post.id)"
                    />
                  </div>

                  <div class="timeline-rail" aria-hidden="true">
                    <span class="timeline-dot" />
                  </div>
                </div>
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
import { renderMarkdown, withSoftBreaks } from "~/utils/markdown";

const root = ref<HTMLElement | null>(null);

useSlidePager(root);

/*
  Below `lg` the sidebar is stacked over the timeline rather than pinned beside
  it, so it becomes a stop of its own — otherwise paging off the cover would
  scroll straight past the publisher card and never rest on it. Beside the
  timeline it must not be a stop: it is sticky, so it would read as the current
  slide at every position.
*/
const stackedSidebar = ref(false);
let stackedMedia: MediaQueryList | null = null;

function syncStackedSidebar(event?: MediaQueryListEvent) {
  stackedSidebar.value = event ? event.matches : stackedMedia?.matches ?? false;
}

onMounted(() => {
  stackedMedia = window.matchMedia("(width < 64rem)");
  syncStackedSidebar();
  stackedMedia.addEventListener("change", syncStackedSidebar);
});

onBeforeUnmount(() =>
  stackedMedia?.removeEventListener("change", syncStackedSidebar),
);

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

const publisherBackgroundBlurhash = computed(
  () => publishersData.value?.[activePub.value]?.background?.blurhash || null,
);

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
  /*
    Measured from the top of a moment's row down to the middle of its own top
    line: the card's air above it (1.25rem), its body padding and half an
    avatar. `--node-top` and the card's `margin-top` have to move together.
  */
  --node-top: 2.75rem;
  --dot-size: 0.625rem;
  --rail-line: color-mix(in srgb, var(--color-base-300) 78%, transparent);

  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 640px) {
  .moments-timeline {
    --rail-width: 2.5rem;
    --node-top: 3rem;
  }
}

.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
  One moment owns one screen — a definite height, not a minimum: the card below
  then caps itself against it and scrolls inside, so a long moment can neither
  grow the row nor push the next one off the rhythm.
*/
.timeline-entry {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--app-bar-height));
}

/*
  The row is a symmetric frame — rail column, content, rail column — so the card
  and the day badge are centred in it, with the spine down the right edge, clear
  of the sidebar's own divider on the left.

  It is only a frame: `align-items: start` keeps a short moment from stretching
  into a full-height slab, and the rail is put back to `stretch` so the spine
  still runs the whole row, gap below a short card included.
*/
.timeline-row {
  display: grid;
  grid-template-columns:
    var(--rail-width)
    minmax(0, 1fr)
    var(--rail-width);
  align-items: start;
}

/* Content column; the first column is the balancing gutter. */
.timeline-day-pill,
.timeline-moment {
  grid-column: 2;
}

/*
  Capped to the row: a moment longer than its screen scrolls inside this box
  instead of growing the row, so the timeline keeps one screen per moment.
  `useSlidePager` hands the wheel to this box while it still has room, then goes
  back to paging.
*/
.timeline-moment {
  max-height: 100%;
  overflow-y: auto;
}

/* The moment fills whatever its day heading left of the screen, and no more. */
.timeline-row-moment {
  flex: 1;
  min-height: 0;
}

/* Air over the card, matched by `--node-top` so the dot lands on the timestamp. */
.timeline-row-moment .timeline-card {
  margin-top: 1.25rem;
}

/* Paging aligns a moment under the app bar instead of behind it. */
:global(html:has(.moments-page)) {
  scroll-padding-top: var(--app-bar-height);
}

.timeline-rail {
  position: relative;
  /* Right edge of the frame, whatever the content beside it. */
  grid-column: 3;
  /* The row aligns items to the start; the line still spans all of it. */
  align-self: stretch;
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

/* The spine runs from the top of the timeline down to the final moment node. */
.timeline-group:last-child
  .timeline-entry:last-child
  .timeline-row-moment
  .timeline-rail::before {
  bottom: calc(100% - var(--node-top));
}

.timeline-dot {
  position: relative;
  z-index: 1;
  border-radius: 9999px;
  background: var(--color-base-100);
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

.timeline-entry:hover .timeline-dot {
  border-color: var(--color-primary);
  background: var(--color-primary);
  transform: scale(1.15);
}

/* ── Day badge ────────────────────────────────────────────────────── */

/*
  Pill, centred in the content column: an indicator of where the day turns over
  rather than a node of the spine. The spine keeps to its own column on the
  right, so nothing here touches it.
*/
.timeline-day-pill {
  justify-self: center;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-block: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--color-base-300) 70%, transparent);
  background: color-mix(
    in srgb,
    var(--color-base-200) 60%,
    var(--color-base-100)
  );
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

.timeline-day-count {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.6875rem;
  color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  font-variant-numeric: tabular-nums;
}

/* ── Moment card ──────────────────────────────────────────────────── */

/* The card itself is rendered by `MomentCard`; only the timeline-owned
   spacing and the empty state stay here. */
.timeline-entry:last-child .timeline-card {
  margin-bottom: 0;
}

.timeline-empty {
  padding: 4rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .timeline-dot {
    transition: none;
  }

  .timeline-entry:hover .timeline-dot {
    transform: none;
  }
}
</style>
