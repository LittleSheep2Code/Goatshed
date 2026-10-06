<template>
  <section class="cover-hero relative">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover"
      fetchpriority="high"
    />
    <div class="cover-scrim absolute inset-0" aria-hidden="true" />

    <div class="relative">
      <slot />
    </div>

    <FluidWave />
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Cover artwork, e.g. the post's own cover image. */
  image?: string | null;
  /** Used when the primary artwork is missing, e.g. the publisher's background image. */
  fallbackImage?: string | null;
}>();

const imageSrc = computed(() => props.image || props.fallbackImage || null);
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
  background: var(--hero-surface);
}

.cover-scrim {
  background:
    radial-gradient(
      ellipse 58% 52% at 30% 40%,
      color-mix(in oklab, var(--color-base-100) 90%, transparent),
      color-mix(in oklab, var(--color-base-100) 62%, transparent) 62%,
      transparent 78%
    ),
    linear-gradient(
      to bottom,
      color-mix(in oklab, var(--color-base-100) 76%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 66%, transparent) 45%,
      color-mix(in oklab, var(--color-base-100) 68%, transparent) 100%
    );
}
</style>
