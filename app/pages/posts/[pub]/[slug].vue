<template>
  <main class="page-shell relative min-w-0 pb-8" data-pagefind-body>
    <CoverHero
      :image="postPictureUrl"
      :fallback-image="publisherBackgroundUrl"
      :blurhash="coverBlurhash"
      class="cover-bleed cover-under-app-bar mb-8"
      :style="{ viewTransitionName: `post-${post?.id}` }"
    >
      <div
        class="flex min-h-[46dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[54dvh] sm:pb-28 sm:pt-14"
      >
        <ShellBreadcrumb
          class="self-start"
          :path="`/posts/${postIdentifier}`"
        />

        <div v-if="post" class="post-hero mt-5 flex min-w-0 flex-col gap-4">
          <!--
            Meta reads as a machine readout: numerals in mono and tabular, the
            same discipline the timeline and the publisher card keep.
          -->
          <div class="post-hero-meta">
            <span class="inline-flex min-w-0 items-center gap-1.5">
              <img
                v-if="publisherPictureUrl"
                :src="publisherPictureUrl"
                :alt="post.publisher.name"
                class="h-5 w-5 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
              <span class="post-hero-author">{{
                post.publisher.nick || post.publisher.name
              }}</span>
            </span>
            <span class="post-hero-dot" aria-hidden="true">·</span>
            <time
              class="post-num"
              :datetime="post.publishedAt || post.createdAt"
            >
              {{ publishedAt }}
            </time>
            <template v-if="post.viewsUnique">
              <span class="post-hero-dot" aria-hidden="true">·</span>
              <span class="post-num">{{ post.viewsUnique }} 次阅读</span>
            </template>
            <template v-if="readingStats">
              <span class="post-hero-dot" aria-hidden="true">·</span>
              <span class="post-num">
                {{ readingStats.characters }} 字 · 约
                {{ readingStats.minutes }} 分钟
              </span>
            </template>
          </div>

          <h1 class="post-hero-title">
            {{ post.title || "无标题文章" }}
          </h1>

          <p v-if="post.description" class="post-hero-lede line-clamp-3">
            {{ post.description }}
          </p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 pt-0.5">
            <span
              v-for="tag in post.tags"
              :key="tag.id"
              class="post-tag badge badge-ghost badge-sm"
            >
              #{{ tag.slug }}
            </span>

            <a
              :href="`https://solian.app/posts/${post.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="post-source-link"
            >
              <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
              在 Solar Network 查看
            </a>
          </div>
        </div>
      </div>
    </CoverHero>

    <div v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <div v-else-if="post" class="post-content-grid">
      <div class="post-main-column">
        <aside
          v-if="tocItems.length && !railVisible"
          class="post-toc-mobile mb-4 xl:hidden"
          data-pagefind-ignore
        >
          <PostToc :items="tocItems" />
        </aside>

        <article
          id="article"
          class="prose-goatshed post-article min-w-0"
          v-html="renderedContent"
        />

        <!--
          Below `xl` the rail is out of the flow, so the copy carries its own
          engagement rather than leaving reactions and replies unreachable.
          `railVisible` keeps only one of the two mounted.
        -->
        <section
          v-if="!railVisible"
          class="post-engagement flex flex-col gap-8 mt-6 xl:hidden"
          data-pagefind-ignore
        >
          <section class="post-rail-section">
            <h2 class="post-rail-heading">互动</h2>
            <ReactionBar :post-id="post.id" />
          </section>

          <section class="post-rail-section">
            <h2 class="post-rail-heading">评论</h2>
            <CommentSection :post-id="post.id" />
          </section>
        </section>
      </div>

      <!--
        Same column as `PublisherSidebar`: no cards, one hairline that fades at
        both ends on the edge facing the copy, sections carried by their labels.
      -->
      <aside v-if="railVisible" class="post-rail hidden xl:grid">
        <span class="post-rail-line" aria-hidden="true" />

        <div class="post-rail-body" data-pagefind-ignore>
          <PostToc v-if="tocItems.length" :items="tocItems" />

          <section class="post-rail-section">
            <h2 class="post-rail-heading">互动</h2>
            <ReactionBar :post-id="post.id" />
          </section>

          <section class="post-rail-section">
            <h2 class="post-rail-heading">评论</h2>
            <CommentSection :post-id="post.id" />
          </section>
        </div>
      </aside>
    </div>

    <div
      class="post-frame relative mb-8 mt-12 flex items-center justify-center gap-4"
      aria-hidden="true"
    >
      <div
        class="relative h-px flex-1 bg-linear-to-r from-transparent via-base-300/40 to-primary/30"
      >
        <div
          class="absolute inset-0 bg-linear-to-r from-transparent via-primary/35 to-primary/35 blur-[2px]"
        />
      </div>
      <div
        class="relative z-10 flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary/50 select-none"
      >
        <span
          class="h-1.5 w-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_var(--color-primary)]"
        />
        结束
      </div>
      <div
        class="relative h-px flex-1 bg-linear-to-l from-transparent via-base-300/40 to-primary/30"
      >
        <div
          class="absolute inset-0 bg-linear-to-l from-transparent via-primary/35 to-primary/35 blur-[2px]"
        />
      </div>
    </div>

    <!--
      The neighbour's own artwork sits in the corner each card points at — the
      previous post's top-left, the next post's top-right — so the direction is
      legible before the label is read.
    -->
    <nav
      class="post-frame post-nav"
      aria-label="文章导航"
      data-pagefind-ignore
    >
      <NuxtLink
        v-if="prevPost"
        :to="`/posts/${prevPostIdentifier}`"
        class="post-nav-link post-nav-prev"
        :class="{ 'post-nav-has-cover': !!prevCover }"
      >
        <div v-if="prevCover" class="post-nav-thumb" aria-hidden="true">
          <img :src="prevCover" alt="" loading="lazy" decoding="async" />
        </div>

        <div class="post-nav-bg" />

        <div class="post-nav-body">
          <span class="post-nav-label">上一篇</span>
          <span class="post-nav-title">
            {{ prevPost.title || "无标题文章" }}
          </span>
          <time
            v-if="prevDate"
            class="post-nav-date post-num"
            :datetime="prevPost.publishedAt || prevPost.createdAt"
          >
            {{ prevDate }}
          </time>
        </div>
      </NuxtLink>

      <NuxtLink
        v-if="nextPost"
        :to="`/posts/${nextPostIdentifier}`"
        class="post-nav-link post-nav-next"
        :class="{ 'post-nav-has-cover': !!nextCover }"
      >
        <div v-if="nextCover" class="post-nav-thumb" aria-hidden="true">
          <img :src="nextCover" alt="" loading="lazy" decoding="async" />
        </div>

        <div class="post-nav-bg" />

        <div class="post-nav-body">
          <span class="post-nav-label">下一篇</span>
          <span class="post-nav-title">
            {{ nextPost.title || "无标题文章" }}
          </span>
          <time
            v-if="nextDate"
            class="post-nav-date post-num"
            :datetime="nextPost.publishedAt || nextPost.createdAt"
          >
            {{ nextDate }}
          </time>
        </div>
      </NuxtLink>
    </nav>
  </main>
</template>

<script setup lang="ts">
import { ExternalLink } from "lucide-vue-next";
import type { MediaFile, Post } from "~/types/post";
import type { Publisher } from "~/types/publisher";
import { renderMarkdown } from "~/utils/markdown";
import { driveFileUrl } from "~/utils/media";
import { getPostIdentifier } from "~/utils/post";
import { extractToc, injectHeadingIds, type TocItem } from "~/utils/toc";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const activePub = computed(() => {
  const pub = route.params.pub;
  return typeof pub === "string" ? pub : "littlesheep";
});

const postSlug = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug.join("/") : slug;
});

const postApiId = computed(() => {
  const pub = activePub.value;
  const slug = postSlug.value;
  return `${pub}/${slug}`;
});

/*
  Only the article itself has to be in hand before the first paint, and it needs
  nothing from the other three, so all four start in the same tick. Awaiting them
  one after another — which is what a bare `await` on each does — holds a blank
  screen for four upstream round trips, and `/prev` + `/next` are the two slowest
  calls on the page.
*/
const { data: prevPost } = useAsyncData(
  `post-${postApiId.value}-prev`,
  () => $fetch<Post | null>(`/api/posts/${postApiId.value}/prev`),
);
const { data: nextPost } = useAsyncData(
  `post-${postApiId.value}-next`,
  () => $fetch<Post | null>(`/api/posts/${postApiId.value}/next`),
);

const [{ data: post, pending, error }, { data: publishersData }] =
  await Promise.all([
    useAsyncData(`post-${postApiId.value}`, () =>
      $fetch<Post>(`/api/posts/${postApiId.value}`),
    ),
    useFetch<Record<string, Publisher | null>>("/api/publishers"),
  ]);

const renderedContent = ref("");
const tocItems = ref<TocItem[]>([]);

/*
  The rail is an `xl` layout; below that the copy carries its own TOC and
  engagement. Defaulting to the rail matches the server render, and the swap
  happens once the viewport is known, so neither side is ever mounted twice.
*/
const railVisible = ref(true);
let railMedia: MediaQueryList | null = null;

function syncRailVisibility(event?: MediaQueryListEvent) {
  railVisible.value = event ? event.matches : railMedia?.matches ?? true;
}

onMounted(() => {
  railMedia = window.matchMedia("(width >= 80rem)");
  syncRailVisibility();
  railMedia.addEventListener("change", syncRailVisibility);
});

onBeforeUnmount(() =>
  railMedia?.removeEventListener("change", syncRailVisibility),
);

watchEffect(() => {
  if (post.value?.type === 0) {
    const identifier = getPostIdentifier(post.value);
    router.replace(`/moments/${identifier}`);
  }
});

watch(
  () => post.value?.content,
  async (content) => {
    if (content) {
      /*
        Article bodies get the embed: a Solar post URL alone in its own
        paragraph renders as the `sk-post` widget rather than a bare link.
      */
      const rendered = await renderMarkdown(content, { embedPosts: true });
      renderedContent.value = injectHeadingIds(rendered);
      tocItems.value = extractToc(renderedContent.value);
    } else {
      renderedContent.value = "";
      tocItems.value = [];
    }
  },
  { immediate: true },
);

// Pinned to `zh-CN`: the default locale differs between the Nitro server and
// the visitor's browser, which would hydrate a different string than it served.
const publishedAt = computed(() => {
  const raw = post.value?.publishedAt || post.value?.createdAt;
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
});

/**
 * Reading load for the header readout. CJK is counted per character, latin per
 * word, and the two speeds are added — markdown scaffolding is dropped first so
 * code fences and link targets do not inflate the count.
 */
const readingStats = computed(() => {
  const source = (post.value?.content || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ");
  if (!source.trim()) return null;

  const cjk = (source.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) || [])
    .length;
  const latin = (
    source
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g, " ")
      .match(/[A-Za-z0-9]+/g) || []
  ).length;
  if (!cjk && !latin) return null;

  return {
    characters: (cjk + latin).toLocaleString("zh-CN"),
    minutes: Math.max(1, Math.round(cjk / 400 + latin / 220)),
  };
});

const postIdentifier = computed(() =>
  post.value ? getPostIdentifier(post.value) : "",
);
const prevPostIdentifier = computed(() =>
  prevPost.value ? getPostIdentifier(prevPost.value) : "",
);
const nextPostIdentifier = computed(() =>
  nextPost.value ? getPostIdentifier(nextPost.value) : "",
);

/** The artwork a post carries, in the order the hero and the nav cards pick it. */
function postArtwork(target: Post | null | undefined): MediaFile | null {
  return (
    target?.picture || target?.attachments?.[0] || target?.background || null
  );
}

/** Cover for the prev / next card, shown in the corner its link points at. */
const prevCover = computed(() =>
  driveFileUrl(postArtwork(prevPost.value), config.public.apiBaseUrl),
);
const nextCover = computed(() =>
  driveFileUrl(postArtwork(nextPost.value), config.public.apiBaseUrl),
);

/**
 * Date-only readout for the nav cards. Pinned to `zh-CN` for the same reason as
 * `publishedAt`: the server's default locale is not the visitor's.
 */
function navDate(target: Post | null | undefined): string {
  const raw = target?.publishedAt || target?.createdAt;
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}

const prevDate = computed(() => navDate(prevPost.value));
const nextDate = computed(() => navDate(nextPost.value));

const postPictureUrl = computed(() =>
  driveFileUrl(postArtwork(post.value), config.public.apiBaseUrl),
);

const publisherBackgroundUrl = computed(() =>
  driveFileUrl(
    publishersData.value?.[activePub.value]?.background ??
      post.value?.publisher?.background,
    config.public.apiBaseUrl,
  ),
);

// Mirrors the artwork the hero picks, so its backdrop matches whatever is on top.
const coverBlurhash = computed(() => {
  if (postPictureUrl.value) {
    const own = postArtwork(post.value)?.blurhash;
    if (own) return own;
  }
  const background =
    publishersData.value?.[activePub.value]?.background ??
    post.value?.publisher?.background;
  return background?.blurhash || null;
});

const publisherPictureUrl = computed(() =>
  driveFileUrl(post.value?.publisher?.picture, config.public.apiBaseUrl),
);

const postOgImage = computed(
  () =>
    driveFileUrl(post.value?.picture, config.public.apiBaseUrl) ||
    driveFileUrl(post.value?.background, config.public.apiBaseUrl) ||
    driveFileUrl(post.value?.attachments?.[0], config.public.apiBaseUrl) ||
    "https://littlesheep.me/og-image.png",
);

useHead(() => ({
  title: post.value?.title || "文章",
  meta: [
    {
      name: "description",
      content: post.value?.description || "在 Goatshed 阅读这篇文章。",
    },
    { property: "og:title", content: post.value?.title || "文章" },
    {
      property: "og:description",
      content: post.value?.description || "在 Goatshed 阅读这篇文章。",
    },
    { property: "og:type", content: "article" },
    {
      property: "og:url",
      content: `https://littlesheep.me/posts/${postIdentifier.value}`,
    },
    { property: "og:image", content: postOgImage.value },
    {
      property: "article:published_time",
      content: post.value?.publishedAt || post.value?.createdAt,
    },
    {
      property: "article:author",
      content:
        post.value?.publisher?.nick ||
        post.value?.publisher?.name ||
        "littlesheep",
    },
    { name: "twitter:title", content: post.value?.title || "文章" },
    {
      name: "twitter:description",
      content: post.value?.description || "在 Goatshed 阅读这篇文章。",
    },
    { name: "twitter:image", content: postOgImage.value },
  ],
  link: [
    {
      rel: "canonical",
      href: `https://littlesheep.me/posts/${postIdentifier.value}`,
    },
  ],
}));
</script>

<style scoped>
/* ── Cover copy ───────────────────────────────────────────────────── */

.post-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-base-content) 62%, transparent);
}

.post-hero-author {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-base-content) 85%, transparent);
}

.post-hero-dot {
  opacity: 0.45;
}

.post-num {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}

.post-hero-title {
  font-size: 1.875rem;
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

@media (min-width: 640px) {
  .post-hero-title {
    font-size: 2.25rem;
  }
}

@media (min-width: 1024px) {
  .post-hero-title {
    font-size: 2.75rem;
  }
}

.post-hero-lede {
  max-width: 42rem;
  font-size: 0.875rem;
  line-height: 1.75;
  color: color-mix(in srgb, var(--color-base-content) 78%, transparent);
}

/* Keeps the daisyUI ghost badge shape, only the tag's own voice changes. */
.post-tag {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  letter-spacing: 0.01em;
}

.post-source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-primary);
}

.post-source-link:hover {
  text-decoration: underline;
}

/* ── Content grid ─────────────────────────────────────────────────── */

/*
  The frame every block below the hero shares: the article's measure, centred —
  and at `xl` the rail's track reserved on the right instead of narrowing the
  block, so a block's right edge lands on the article's rather than under the
  rail. These numbers mirror `.post-content-grid`'s tracks; move them together.
*/
.post-frame {
  max-width: 52rem;
  margin-inline: auto;
}

@media (min-width: 1280px) {
  .post-frame {
    max-width: 76rem;
    padding-inline-end: calc(20rem + 1.5rem);
  }
}

.post-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 52rem;
  margin-inline: auto;
}

@media (min-width: 1280px) {
  .post-content-grid {
    grid-template-columns: minmax(0, 1fr) 20rem;
    max-width: 76rem;
    gap: 1.5rem;
  }
}

.post-main-column {
  min-width: 0;
}

.post-toc-mobile {
  position: relative;
}

.post-toc-mobile :deep(.toc-wrapper) {
  position: relative;
  top: 0;
}

.post-article {
  /* The page shell already carries the mobile gutter. */
  padding: 0;
}

@media (min-width: 640px) {
  .post-article {
    padding: 1.5rem 1.75rem;
  }
}

/* ── Rail ─────────────────────────────────────────────────────────── */

/*
  Mirrors `PublisherSidebar`: the hairline is a column of its own rather than a
  background on the scroller, so it stays the height of the visible rail while
  the rail's contents scroll behind it.
*/
.post-rail {
  position: sticky;
  top: calc(var(--app-bar-height) + 1.5rem);
  align-self: start;
  grid-template-columns: 1px minmax(0, 1fr);
  column-gap: 1.75rem;
}

.post-rail-line {
  background-image: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--color-base-300) 80%, transparent) 12%,
    color-mix(in srgb, var(--color-base-300) 80%, transparent) 88%,
    transparent 100%
  );
}

.post-rail-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
  max-height: calc(100dvh - var(--app-bar-height) - 3rem);
  overflow-y: auto;
}

/*
  `CommentSection` bleeds out of `.page-shell`'s gutter with a negative margin,
  which is right in the copy column but wrong here: the rail has no gutter to
  cancel, so the widgets hang 0.75rem past both edges. `overflow-y` alone still
  computes `overflow-x` to `auto`, so that bleed became the rail's horizontal
  scrollbar.
*/
.post-rail :deep(.comment-section) {
  margin-inline: 0;
}

/* The rail's TOC is a section, not a card: the hairline already frames it. */
.post-rail :deep(.toc-wrapper) {
  position: static;
  top: auto;
  max-height: none;
  overflow-y: visible;
  padding: 0;
  border: 0;
  background-color: transparent;
}

.post-rail :deep(.toc-header) {
  cursor: pointer;
  pointer-events: auto;
  padding: 0;
}

.post-rail :deep(.toc-chevron) {
  display: block;
}

.post-rail :deep(.toc-list) {
  max-height: 500px;
}

.post-rail :deep(.toc-list.toc-collapsed) {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  overflow: hidden;
}

.post-rail-section {
  min-width: 0;
}

.post-rail-heading {
  margin-bottom: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-base-content) 50%, transparent);
}

/* The TOC's own label is styled by `PostToc`; only its scale is pulled in line. */
.post-rail :deep(.toc-header > span) {
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  color: color-mix(in srgb, var(--color-base-content) 50%, transparent);
}

.post-engagement {
  min-width: 0;
}

/* ── End of article ───────────────────────────────────────────────── */

/*
  The pair stacks below `sm` — two half-width columns leave the titles about
  two characters wide — and splits left/right above it, where the corner cover
  also has the direction it implies.
*/
.post-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
  margin-top: 2.5rem;
}

@media (min-width: 640px) {
  .post-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .post-nav-next {
    grid-column-start: 2;
  }
}

.post-nav-link {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--color-base-300) 30%, transparent);
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--color-base-300) 8%, transparent);
  transition: border-color 0.3s ease;
}

.post-nav-link:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

/* With a cover the copy clears the corner the artwork holds. */
.post-nav-prev.post-nav-has-cover {
  padding-inline-start: 7.75rem;
}

.post-nav-next.post-nav-has-cover {
  padding-inline-end: 7.75rem;
}

/*
  Rounded to the card's own corner minus its border, so the artwork continues
  the outline instead of poking through it, and masked on the facing edge: it
  dissolves into the card rather than ending in a seam.
*/
.post-nav-thumb {
  position: absolute;
  inset-block: 0;
  width: 6.5rem;
  overflow: hidden;
  opacity: 0.9;
  transition: opacity 0.35s ease;
}

.post-nav-prev .post-nav-thumb {
  inset-inline-start: 0;
  border-start-start-radius: calc(1rem - 1px);
  border-end-start-radius: calc(1rem - 1px);
  mask-image: linear-gradient(
    to right,
    #000 0%,
    rgb(0 0 0 / 0.78) 45%,
    transparent 100%
  );
}

.post-nav-next .post-nav-thumb {
  inset-inline-end: 0;
  border-start-end-radius: calc(1rem - 1px);
  border-end-end-radius: calc(1rem - 1px);
  mask-image: linear-gradient(
    to left,
    #000 0%,
    rgb(0 0 0 / 0.78) 45%,
    transparent 100%
  );
}

.post-nav-link:hover .post-nav-thumb {
  opacity: 1;
}

.post-nav-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-nav-body {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
}

@media (min-width: 640px) {
  .post-nav-next .post-nav-body {
    align-items: flex-end;
    text-align: end;
  }
}

.post-nav-label {
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-base-content) 45%, transparent);
}

.post-nav-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.375;
  color: color-mix(in srgb, var(--color-base-content) 80%, transparent);
  transition: color 0.2s ease;
}

.post-nav-link:hover .post-nav-title {
  color: var(--color-primary);
}

.post-nav-date {
  font-size: 0.6875rem;
  color: color-mix(in srgb, var(--color-base-content) 45%, transparent);
}

.post-nav-bg {
  position: absolute;
  inset: -1px;
  opacity: 0.4;
  transition: opacity 0.35s ease;
  background:
    radial-gradient(
      ellipse 80% 60% at 20% 80%,
      color-mix(in oklab, var(--color-primary) 12%, transparent) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 60% 70% at 80% 20%,
      color-mix(in oklab, var(--color-primary) 8%, transparent) 0%,
      transparent 60%
    );
  filter: blur(16px);
  pointer-events: none;
  z-index: -1;
  border-radius: inherit;
}

.post-nav-link:hover .post-nav-bg {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .post-nav-link,
  .post-nav-link * {
    transition: none;
  }
}
</style>
