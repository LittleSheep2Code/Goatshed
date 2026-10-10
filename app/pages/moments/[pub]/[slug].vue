<template>
  <main class="moment-view" data-pagefind-body>
    <div v-if="pending" class="flex h-dvh items-center justify-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error" class="flex h-dvh items-center justify-center px-4">
      <div class="alert alert-error max-w-md">
        <span>{{ error.message }}</span>
      </div>
    </div>

    <template v-else-if="post">
      <!-- Floats over whichever edge the media took: the top one on small screens. -->
      <header class="moment-header">
        <button type="button" class="moment-back" @click="goBack">
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          动态
        </button>
      </header>

      <div class="moment-layout">
        <div class="moment-media">
          <div v-if="postImages.length === 1" class="moment-media-inner">
            <UnLazyImage
              :src="postImages[0].src"
              :alt="postImages[0].alt"
              :blurhash="postImages[0].blurhash"
              :width="postImages[0].width"
              :height="postImages[0].height"
              :placeholder-ratio="postImages[0].ratio"
              class="moment-img"
              :style="{ viewTransitionName: `moment-img-${post.id}` }"
            />
          </div>
          <div
            v-else-if="postImages.length > 1"
            ref="swipeTarget"
            class="carousel-group moment-media-inner"
          >
            <div class="carousel-container h-full overflow-hidden">
              <div
                class="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
                :style="{ transform: `translateX(-${carouselIndex * 100}%)` }"
              >
                <div
                  v-for="(img, idx) in postImages"
                  :key="idx"
                  class="flex h-full w-full flex-shrink-0 items-center justify-center"
                >
                  <UnLazyImage
                    :src="img.src"
                    :alt="img.alt"
                    :blurhash="img.blurhash"
                    :width="img.width"
                    :height="img.height"
                    :placeholder-ratio="img.ratio"
                    class="moment-img"
                    :style="
                      idx === 0
                        ? { viewTransitionName: `moment-img-${post.id}` }
                        : undefined
                    "
                  />
                </div>
              </div>
            </div>
            <button
              v-show="carouselIndex > 0"
              type="button"
              class="carousel-arrow carousel-arrow-left"
              aria-label="上一张"
              @click="carouselIndex--"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              v-show="carouselIndex < postImages.length - 1"
              type="button"
              class="carousel-arrow carousel-arrow-right"
              aria-label="下一张"
              @click="carouselIndex++"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
            <div class="carousel-progress">
              <div class="carousel-progress-track">
                <div
                  class="carousel-progress-bar"
                  :style="{
                    width: `${((carouselIndex + 1) / postImages.length) * 100}%`,
                  }"
                />
              </div>
            </div>
          </div>
          <div
            v-else
            class="moment-media-inner flex items-center justify-center bg-base-200/30"
          >
            <ImageOff class="h-16 w-16 text-base-content/20" />
          </div>
        </div>

        <span class="moment-seam" aria-hidden="true" />

        <div class="moment-detail">
          <div class="moment-detail-inner">
            <div class="moment-byline">
              <span class="inline-flex min-w-0 items-center gap-1.5">
                <img
                  v-if="publisherPictureUrl"
                  :src="publisherPictureUrl"
                  :alt="post.publisher.name"
                  class="h-5 w-5 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
                <span class="moment-author">{{
                  post.publisher.nick || post.publisher.name
                }}</span>
              </span>
              <span class="moment-dot" aria-hidden="true">·</span>
              <time
                class="moment-num"
                :datetime="post.publishedAt || post.createdAt"
              >
                {{ publishedAt }}
              </time>
              <template v-if="post.viewsUnique">
                <span class="moment-dot" aria-hidden="true">·</span>
                <span class="moment-num">{{ post.viewsUnique }} 次阅读</span>
              </template>
            </div>

            <h1 v-if="post.title" class="moment-title">
              {{ post.title }}
            </h1>

            <article
              v-if="renderedDescription"
              class="prose-goatshed moment-description"
              v-html="renderedDescription"
            />
            <article
              id="article"
              class="prose-goatshed max-w-none"
              v-html="renderedContent"
            />

            <div
              v-if="post.tags?.length || post.id"
              class="moment-meta mt-6 flex flex-col gap-3"
            >
              <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in post.tags"
                  :key="tag.id"
                  class="moment-tag badge badge-ghost badge-sm"
                >
                  #{{ tag.slug }}
                </span>
              </div>

              <div v-if="post.id" class="flex items-center gap-3">
                <a
                  :href="`https://solian.app/posts/${post.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="moment-source-link"
                >
                  <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                  在 Solar Network 查看
                </a>
              </div>
            </div>

            <div
              class="post-divider relative my-8 flex items-center justify-center gap-4"
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

            <div v-if="post?.id" class="mt-4">
              <ReactionBar :post-id="post.id" />
            </div>
            <CommentSection v-if="post?.id" :post-id="post.id" />
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { renderMarkdown, withSoftBreaks } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
} from "lucide-vue-next";

definePageMeta({ layout: "blank" });

const route = useRoute();
const config = useRuntimeConfig();

function goBack() {
  navigateTo(`/moments/${activePub.value}`);
}

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

const {
  data: post,
  pending,
  error,
} = await useAsyncData(`moment-${postApiId.value}`, () =>
  $fetch<Post>(`/api/posts/${postApiId.value}`),
);

defineOgImage("MomentOgImage", {
  pub: computed(() => activePub.value),
  slug: computed(() => postSlug.value || ""),
});

watchEffect(() => {
  if (post.value?.type === 1) {
    const identifier = getPostIdentifier(post.value);
    navigateTo(`/posts/${identifier}`, { replace: true });
  }
});

const renderedContent = ref("");
const renderedDescription = ref("");
const carouselIndex = ref(0);
const swipeTarget = ref<HTMLElement | null>(null);

useSwipe(swipeTarget, {
  onSwipeLeft: () => {
    if (carouselIndex.value < postImages.value.length - 1) carouselIndex.value++;
  },
  onSwipeRight: () => {
    if (carouselIndex.value > 0) carouselIndex.value--;
  },
});

watch(
  () => post.value,
  async (p) => {
    if (p) {
      renderedContent.value = p.content
        ? await renderMarkdown(withSoftBreaks(p.content))
        : "";
      renderedDescription.value = p.description
        ? await renderMarkdown(withSoftBreaks(p.description))
        : "";
    } else {
      renderedContent.value = "";
      renderedDescription.value = "";
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

const postIdentifier = computed(() =>
  post.value ? getPostIdentifier(post.value) : "",
);

const postImages = computed(() => {
  if (!post.value) return [];

  const images: {
    src: string;
    alt: string;
    blurhash?: string;
    width?: number;
    height?: number;
    ratio?: number;
  }[] = [];

  function push(file: NonNullable<Post["picture"]>, alt: string) {
    images.push({
      src:
        file.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(file.id)}`,
      alt,
      blurhash: file.blurhash || undefined,
      width: file.width || undefined,
      height: file.height || undefined,
      ratio: file.width && file.height ? file.width / file.height : undefined,
    });
  }

  if (post.value.picture?.id) {
    push(post.value.picture, post.value.title || "动态图片");
  }

  if (post.value.attachments?.length) {
    for (const att of post.value.attachments) {
      if (att.id && att.mimeType?.startsWith("image/")) {
        push(att, att.name || post.value.title || "动态图片");
      }
    }
  }

  if (images.length === 0 && post.value.background?.id) {
    push(post.value.background, post.value.title || "动态图片");
  }

  return images;
});

const publisherPictureUrl = computed(() => {
  const pic = post.value?.publisher?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

const postOgImage = computed(() => {
  if (!post.value) return "https://littlesheep.me/og-image.png";

  const pic = post.value.picture;
  if (pic?.id) {
    return (
      pic.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
    );
  }
  const bg = post.value.background;
  if (bg?.id) {
    return (
      bg.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`
    );
  }
  const attach = post.value.attachments?.[0];
  if (attach?.id) {
    return (
      attach.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(attach.id)}`
    );
  }
  return "https://littlesheep.me/og-image.png";
});

useHead(() => ({
  title: post.value?.title || "动态",
  meta: [
    {
      name: "description",
      content: post.value?.description || "在 Goatshed 查看这条动态。",
    },
    { property: "og:title", content: post.value?.title || "动态" },
    {
      property: "og:description",
      content: post.value?.description || "在 Goatshed 查看这条动态。",
    },
    { property: "og:type", content: "article" },
    {
      property: "og:url",
      content: `https://littlesheep.me/moments/${postIdentifier.value}`,
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
    { name: "twitter:title", content: post.value?.title || "动态" },
    {
      name: "twitter:description",
      content: post.value?.description || "在 Goatshed 查看这条动态。",
    },
    { name: "twitter:image", content: postOgImage.value },
  ],
  link: [
    {
      rel: "canonical",
      href: `https://littlesheep.me/moments/${postIdentifier.value}`,
    },
  ],
}));
</script>

<style scoped>
.moment-view {
  position: relative;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/*
  Media over copy on small screens, side by side from `lg`. The seam is a flex
  item rather than a border, so it keeps the fading hairline the rest of the
  site's columns are separated by at either orientation.
*/
.moment-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.moment-header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  padding: 0.75rem 1rem;
}

/* A pill rather than a bare ghost button: it has to stay legible on the photo. */
.moment-back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding-inline: 0.75rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--color-base-300) 55%, transparent);
  background-color: color-mix(in srgb, var(--color-base-100) 78%, transparent);
  backdrop-filter: blur(10px);
  font-size: 0.75rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-base-content) 80%, transparent);
  cursor: pointer;
  transition:
    color 200ms ease,
    border-color 200ms ease,
    background-color 200ms ease;
}

.moment-back:hover {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  background-color: color-mix(in srgb, var(--color-base-100) 92%, transparent);
}

.moment-back:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.moment-media {
  position: relative;
  flex: 1 1 60%;
  min-height: 0;
  background: var(--color-base-200);
  overflow: auto;
  overscroll-behavior: contain;
}

.moment-media-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.moment-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.moment-seam {
  flex: 0 0 1px;
  background-image: linear-gradient(
    to right,
    transparent 0%,
    color-mix(in srgb, var(--color-base-300) 80%, transparent) 14%,
    color-mix(in srgb, var(--color-base-300) 80%, transparent) 86%,
    transparent 100%
  );
}

.moment-detail {
  flex: 1 1 40%;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.moment-detail-inner {
  padding: 1.5rem 1rem 2rem;
}

@media (min-width: 640px) {
  .moment-detail-inner {
    padding: 1.75rem 1.5rem 2.5rem;
  }
}

/* ── Copy ─────────────────────────────────────────────────────────── */

.moment-byline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-base-content) 62%, transparent);
}

.moment-author {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-base-content) 85%, transparent);
}

.moment-dot {
  opacity: 0.45;
}

.moment-num {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}

.moment-title {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.moment-description {
  max-width: none;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  line-height: 1.65;
  color: color-mix(in srgb, var(--color-base-content) 80%, transparent);
}

.moment-tag {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  letter-spacing: 0.01em;
}

.moment-source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-primary) 80%, transparent);
}

.moment-source-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

/* ── Carousel ─────────────────────────────────────────────────────── */

.carousel-group {
  position: relative;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: oklch(0.2 0 0 / 0.55);
  color: oklch(1 0 0 / 0.9);
  backdrop-filter: blur(4px);
  opacity: 0;
  transform: translateY(-50%) scale(0.85);
  transition:
    opacity 200ms ease,
    transform 200ms ease;
  pointer-events: none;
  cursor: pointer;
  border: none;
}

.carousel-group:hover .carousel-arrow {
  opacity: 1;
  transform: translateY(-50%) scale(1);
  pointer-events: auto;
}

.carousel-arrow:active {
  transform: translateY(-50%) scale(0.92);
}

.carousel-arrow-left {
  left: 0.75rem;
}

.carousel-arrow-right {
  right: 0.75rem;
}

.carousel-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0.5rem 1rem;
}

.carousel-progress-track {
  height: 3px;
  border-radius: 9999px;
  background: oklch(1 0 0 / 0.25);
  overflow: hidden;
}

.carousel-progress-bar {
  height: 100%;
  border-radius: 9999px;
  background: oklch(1 0 0 / 0.85);
  transition: width 300ms ease-out;
}

/* ── End marker ───────────────────────────────────────────────────── */

.post-divider {
  max-width: 32rem;
  margin-inline: auto;
}

@media (min-width: 1024px) {
  .moment-layout {
    flex-direction: row;
  }

  .moment-media {
    flex: 1 1 55%;
  }

  /* Fixed basis, so the seam and the media share whatever the cap leaves over. */
  .moment-detail {
    flex: 0 0 min(45%, 32rem);
  }

  .moment-detail-inner {
    padding: 2.25rem 2rem 3rem;
  }

  .moment-seam {
    background-image: linear-gradient(
      to bottom,
      transparent 0%,
      color-mix(in srgb, var(--color-base-300) 80%, transparent) 10%,
      color-mix(in srgb, var(--color-base-300) 80%, transparent) 90%,
      transparent 100%
    );
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-back,
  .carousel-arrow,
  .carousel-progress-bar {
    transition: none;
  }
}
</style>
