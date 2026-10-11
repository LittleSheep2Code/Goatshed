<template>
  <NuxtLink :to="to" class="collection-card">
    <div class="collection-card-cover">
      <UnLazyImage
        v-if="cover"
        :src="cover.src"
        :alt="title"
        :blurhash="cover.blurhash"
        :width="cover.width"
        :height="cover.height"
        :placeholder-ratio="cover.ratio"
        class="collection-card-image"
      />
      <span v-else class="collection-card-blank" aria-hidden="true" />

      <span class="collection-card-scrim" aria-hidden="true" />

      <span class="collection-card-body">
        <span class="collection-card-icon">
          <UnLazyImage
            v-if="iconUrl"
            :src="iconUrl"
            :alt="title"
            :blurhash="collection.icon?.blurhash"
            class="collection-card-icon-image"
          />
          <Layers v-else class="h-6 w-6" aria-hidden="true" />
        </span>

        <span class="collection-card-copy">
          <span class="collection-card-name">{{ title }}</span>
          <span v-if="collection.description" class="collection-card-description">
            {{ collection.description }}
          </span>
        </span>

        <ChevronRight class="collection-card-chevron" aria-hidden="true" />
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { ChevronRight, Layers } from "lucide-vue-next";
import type { MediaFile, PostCollection } from "~/types/post";
import { DRIVE_WIDTH, driveFileUrl } from "~/utils/media";

const props = defineProps<{
  collection: PostCollection;
  publisherName: string;
}>();

const config = useRuntimeConfig();

const to = computed(
  () => `/posts/${props.publisherName}/collections/${props.collection.slug}`,
);

const title = computed(
  () => props.collection.name?.trim() || props.collection.slug,
);

const iconUrl = computed(() =>
  driveFileUrl(
    props.collection.icon,
    config.public.apiBaseUrl,
    DRIVE_WIDTH.profile,
  ),
);

/** The collection's own artwork, or null to fall back to the blank plate. */
const cover = computed(() => {
  const file = props.collection.background;
  const src = driveFileUrl(file, config.public.apiBaseUrl, DRIVE_WIDTH.cover);
  if (!file || !src) return null;
  return {
    src,
    blurhash: file.blurhash || undefined,
    width: file.width || undefined,
    height: file.height || undefined,
    ratio: ratioOf(file),
  };
});

function ratioOf(file: MediaFile) {
  return file.width && file.height ? file.width / file.height : undefined;
}
</script>

<style scoped>
.collection-card {
  display: block;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid
    color-mix(in oklab, var(--color-base-300) 50%, transparent);
  background-color: color-mix(in oklab, var(--color-base-200) 40%, transparent);
  transition:
    border-color 150ms ease-out,
    transform 150ms ease-out;
}

.collection-card:hover {
  border-color: color-mix(in oklab, var(--color-primary) 40%, transparent);
}

.collection-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.collection-card-cover {
  position: relative;
  display: block;
  aspect-ratio: 16 / 7;
}

.collection-card-image,
.collection-card-blank {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* No artwork: a plate of the page's own surface, so the copy still reads. */
.collection-card-blank {
  display: block;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-primary) 16%, var(--color-base-200)) 0%,
    color-mix(in oklab, var(--color-base-200) 80%, var(--color-base-100)) 100%
  );
}

/* Weighted to the bottom, where the copy sits, so the artwork still shows. */
.collection-card-scrim {
  position: absolute;
  inset: 0;
  display: block;
  background: linear-gradient(
    to top,
    color-mix(in oklab, var(--color-neutral) 72%, transparent) 0%,
    color-mix(in oklab, var(--color-neutral) 28%, transparent) 46%,
    transparent 78%
  );
}

.collection-card-body {
  position: absolute;
  inset-inline: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.collection-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex: none;
  overflow: hidden;
  border-radius: 0.75rem;
  background-color: color-mix(in oklab, var(--color-base-100) 30%, transparent);
  color: var(--color-base-100);
}

.collection-card-icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-card-copy {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.collection-card-name {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-base-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-card-description {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: color-mix(in oklab, var(--color-base-100) 80%, transparent);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.collection-card-chevron {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  margin-bottom: 0.125rem;
  color: color-mix(in oklab, var(--color-base-100) 85%, transparent);
  transition: transform 150ms ease-out;
}

.collection-card:hover .collection-card-chevron {
  transform: translateX(2px);
}
</style>
