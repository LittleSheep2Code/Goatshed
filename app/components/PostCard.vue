<template>
  <article
    class="post-tile min-w-0"
    :class="{
      'post-tile-with-cover': !!coverImage,
      'post-tile-reverse': reversed,
    }"
    :style="{ viewTransitionName: `post-${post.id}` }"
    @mousemove="onMove"
  >
    <NuxtLink v-if="coverImage" :to="postUrl" class="post-tile-cover">
      <UnLazyImage
        :src="coverImage.src"
        :alt="coverImage.alt"
        :blurhash="coverImage.blurhash"
        :width="coverImage.width"
        :height="coverImage.height"
        :placeholder-ratio="coverImage.ratio"
      />
    </NuxtLink>

    <div class="post-tile-body relative z-10 flex min-w-0 flex-col gap-3">
      <div class="inline-flex items-center gap-1.5 text-xs text-base-content/70">
        <img
          v-if="publisherPictureUrl"
          :src="publisherPictureUrl"
          :alt="post.publisher.name"
          class="h-4 w-4 rounded-full object-cover"
          loading="lazy"
        />
        <span class="opacity-70">{{
          post.publisher.nick || post.publisher.name
        }}</span>
      </div>

      <NuxtLink :to="postUrl" class="min-w-0 hover:no-underline">
        <h2 class="text-xl font-bold leading-tight">
          {{ post.title || "无标题文章" }}
        </h2>
      </NuxtLink>

      <p class="text-sm text-base-content/80 line-clamp-3 break-words">
        {{ excerpt }}
      </p>

      <div v-if="post.tags.length" class="flex flex-wrap gap-1">
        <span
          v-for="tag in post.tags.slice(0, 4)"
          :key="tag.id"
          class="badge badge-ghost badge-sm"
        >
          #{{ tag.slug }}
        </span>
      </div>

      <div v-if="coverImage" class="hidden lg:block lg:flex-1" aria-hidden="true" />

      <div class="flex flex-col gap-2 text-xs text-base-content/70">
        <ReactionBar :post-id="post.id" :max-visible="3" />
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <span>{{ formattedDate }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ post.viewsUnique }} 次阅读</span>
          </div>
          <NuxtLink :to="postUrl" class="link link-primary shrink-0"
            >阅读全文</NuxtLink
          >
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { getPostIdentifier } from "~/utils/post";

const props = defineProps<{
  post: Post;
  /** Zero-based position within its list; odd positions mirror the wide-screen layout. */
  index?: number;
}>();

const reversed = computed(() => (props.index ?? 0) % 2 === 1);

const config = useRuntimeConfig();

const postIdentifier = computed(() => getPostIdentifier(props.post));

const postUrl = computed(() => {
  const identifier = postIdentifier.value;
  const pub = props.post.publisher?.name || "littlesheep";
  return props.post.type === 0
    ? `/moments/${identifier}`
    : `/posts/${identifier}`;
});

const formattedDate = computed(() => {
  return new Date(
    props.post.publishedAt || props.post.createdAt,
  ).toLocaleString();
});

const excerpt = computed(() => {
  const base = (props.post.description || props.post.content || "暂无简介。")
    .replace(/[#*_`>[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base.length > 220 ? `${base.slice(0, 220)}...` : base;
});

const coverImage = computed(() => {
  const candidate =
    props.post.picture || props.post.attachments?.[0] || props.post.background;
  if (!candidate?.id) return null;
  return {
    src:
      candidate.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(candidate.id)}`,
    alt: props.post.title || "文章配图",
    blurhash: candidate.blurhash || undefined,
    width: candidate.width || undefined,
    height: candidate.height || undefined,
    ratio:
      candidate.width && candidate.height
        ? candidate.width / candidate.height
        : undefined,
  };
});

const publisherPictureUrl = computed(() => {
  const pic = props.post.publisher?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

function onMove(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  element.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  element.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}
</script>

<style scoped>
.post-tile-cover {
  display: block;
  overflow: hidden;
  border-bottom: 1px solid
    color-mix(in oklab, var(--color-base-300) 45%, transparent);
}

.post-tile-cover img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.post-tile-body {
  padding: 1.25rem;
}

@media (min-width: 64rem) {
  .post-tile-body {
    padding: 1.5rem;
  }

  .post-tile-with-cover {
    display: flex;
    align-items: stretch;
  }

  .post-tile-reverse {
    flex-direction: row-reverse;
  }

  .post-tile-with-cover .post-tile-cover {
    position: relative;
    flex: 1 1 50%;
    min-width: 0;
    /* Drives the tile height at 16:9, but stretches to fill when the body is taller. */
    aspect-ratio: 16 / 9;
    border-bottom: 0;
    border-right: 1px solid
      color-mix(in oklab, var(--color-base-300) 45%, transparent);
  }

  /* Fill the stretched cover box; crops the sides only when the body outgrows 16:9. */
  .post-tile-with-cover .post-tile-cover img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
  }

  .post-tile-reverse .post-tile-cover {
    border-right: 0;
    border-left: 1px solid
      color-mix(in oklab, var(--color-base-300) 45%, transparent);
  }

  .post-tile-with-cover .post-tile-body {
    flex: 1 1 50%;
    min-width: 0;
    align-self: stretch;
  }
}
</style>
