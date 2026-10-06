<template>
  <section class="cover-hero relative" :style="backgroundStyle">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover"
      fetchpriority="high"
    />
    <div class="cover-scrim absolute inset-0" aria-hidden="true" />

    <div class="hero-shell relative">
      <slot />
    </div>

    <FluidWave />
  </section>
</template>

<script setup lang="ts">
import { createPlaceholderFromHash } from "unlazy";

const props = defineProps<{
  /** Cover artwork, e.g. the post's own cover image. */
  image?: string | null;
  /** Used when the primary artwork is missing, e.g. the publisher's background image. */
  fallbackImage?: string | null;
  /** BlurHash of the artwork in use. Decoded on the server into the cover's backdrop. */
  blurhash?: string | null;
}>();

const imageSrc = computed(() => props.image || props.fallbackImage || null);

/*
  The cover stays a plain eager `<img>` so the preload scanner can start it during HTML parsing.
  The BlurHash is decoded to a data URI at SSR time and painted underneath: it is inline in the
  HTML, so the artwork reads as blurred cover art from the first paint instead of an empty panel,
  while the image itself is still fetched at the earliest possible moment.
*/
const backgroundStyle = computed(() => {
  if (!props.blurhash) return undefined;
  const placeholder = createPlaceholderFromHash({ hash: props.blurhash, size: 32 });
  return placeholder ? { backgroundImage: `url("${placeholder}")` } : undefined;
});
</script>

<style scoped>
/*
  Cover surface: the artwork fills it, the scrim keeps the copy legible and the wave — filled with
  the page surface — makes the page below read as liquid rising into the cover.
*/
.cover-hero {
  --hero-surface: color-mix(
    in oklab,
    var(--color-base-200) 72%,
    var(--color-base-100)
  );
  --wave-surface: var(--color-base-100);
  --wave-height: 5rem;
  /* Longhands rather than the `background` shorthand so an inline BlurHash backdrop can cover. */
  background-color: var(--hero-surface);
  background-position: center;
  background-size: cover;
}

/*
  Two veils, stacked. Each one is a plain light wash of the page surface, so their alphas multiply:
  keep them well under ~0.9 or the artwork underneath is painted out entirely. The horizontal veil
  is weighted to the left, where the copy sits; the vertical veil keeps the app bar and breadcrumb
  legible across the top and the wave lip at the bottom.
*/
.cover-scrim {
  background:
    linear-gradient(
      to right,
      color-mix(in oklab, var(--color-base-100) 86%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 62%, transparent) 38%,
      transparent 72%
    ),
    linear-gradient(
      to bottom,
      color-mix(in oklab, var(--color-base-100) 56%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 32%, transparent) 45%,
      color-mix(in oklab, var(--color-base-100) 42%, transparent) 100%
    );
}

/* Below `sm` the copy runs the full width, so the left-weighted veil can't cover it. */
@media (width < 40rem) {
  .cover-scrim {
    background: linear-gradient(
      to bottom,
      color-mix(in oklab, var(--color-base-100) 52%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 84%, transparent) 28%,
      color-mix(in oklab, var(--color-base-100) 84%, transparent) 74%,
      color-mix(in oklab, var(--color-base-100) 58%, transparent) 100%
    );
  }
}
</style>
