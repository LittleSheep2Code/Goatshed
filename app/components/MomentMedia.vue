<template>
  <div class="moment-media">
    <NuxtLink
      v-if="images.length === 1"
      :to="to"
      class="moment-media-surface"
      :style="{ aspectRatio: ratio }"
    >
      <UnLazyImage
        :src="single?.src ?? ''"
        :alt="single?.alt ?? ''"
        :blurhash="single?.blurhash"
        :width="single?.width"
        :height="single?.height"
        :placeholder-ratio="single ? ratioOf(single) : undefined"
        :style="transitionStyle(0)"
      />
    </NuxtLink>

    <template v-else>
      <NuxtLink
        :to="to"
        class="moment-media-surface"
        :style="{ aspectRatio: ratio }"
        :aria-label="`查看动态（共 ${images.length} 张图片，当前第 ${index + 1} 张）`"
        @click="onSurfaceClick"
      >
        <div
          class="moment-media-track"
          :style="{ transform: `translateX(-${index * 100}%)` }"
        >
          <div
            v-for="(image, i) in images"
            :key="i"
            class="moment-media-slide"
            :aria-hidden="i !== index ? 'true' : undefined"
          >
            <UnLazyImage
              :src="image.src"
              :alt="image.alt"
              :blurhash="image.blurhash"
              :width="image.width"
              :height="image.height"
              :placeholder-ratio="ratioOf(image)"
              :style="transitionStyle(i)"
            />
          </div>
        </div>
      </NuxtLink>

      <button
        v-show="index > 0"
        type="button"
        class="moment-media-arrow moment-media-arrow-left"
        aria-label="上一张"
        @click.stop.prevent="prev"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        v-show="index < images.length - 1"
        type="button"
        class="moment-media-arrow moment-media-arrow-right"
        aria-label="下一张"
        @click.stop.prevent="next"
      >
        <ChevronRight class="h-4 w-4" />
      </button>

      <div class="moment-media-progress" aria-hidden="true">
        <div class="moment-media-progress-track">
          <div
            class="moment-media-progress-bar"
            :style="{ width: `${((index + 1) / images.length) * 100}%` }"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const props = defineProps<{
  images: {
    src: string;
    alt: string;
    blurhash?: string;
    width?: number;
    height?: number;
  }[];
  to: string;
  /** CSS aspect-ratio for the media frame, e.g. "4 / 3". */
  ratio?: string;
  /** View-transition name applied to the first slide, for the open animation. */
  transitionName?: string;
}>();

const index = ref(0);
const root = ref<HTMLElement | null>(null);
let suppressClickUntil = 0;

const single = computed(() => props.images[0]);

/** BlurHash aspect, so the decoded placeholder fills the frame instead of stretching. */
function ratioOf(image: { width?: number; height?: number }) {
  return image.width && image.height ? image.width / image.height : undefined;
}

useSwipe(root, {
  onSwipeLeft: () => {
    if (index.value < props.images.length - 1) {
      index.value++;
      markSwipe();
    }
  },
  onSwipeRight: () => {
    if (index.value > 0) {
      index.value--;
      markSwipe();
    }
  },
});

function prev() {
  if (index.value > 0) index.value--;
}

function next() {
  if (index.value < props.images.length - 1) index.value++;
}

// A swipe inside the card ends with a synthetic click on the link; swallow it
// so dragging to change slides never navigates away.
function markSwipe() {
  suppressClickUntil = Date.now() + 350;
}

function onSurfaceClick(event: MouseEvent) {
  if (Date.now() < suppressClickUntil) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function transitionStyle(i: number) {
  return i === 0 && props.transitionName
    ? { viewTransitionName: props.transitionName }
    : undefined;
}
</script>

<style scoped>
.moment-media {
  position: relative;
  width: 100%;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-base-300) 45%, transparent);
}

.moment-media-surface {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  max-height: 20rem;
}

.moment-media-surface img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-media-track {
  display: flex;
  height: 100%;
  transition: transform 300ms ease-out;
}

.moment-media-slide {
  flex: 0 0 100%;
  height: 100%;
}

.moment-media-arrow {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
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
}

.moment-media:hover .moment-media-arrow {
  opacity: 1;
  transform: translateY(-50%) scale(1);
  pointer-events: auto;
}

.moment-media-arrow:active {
  transform: translateY(-50%) scale(0.92);
}

.moment-media-arrow-left {
  left: 0.75rem;
}

.moment-media-arrow-right {
  right: 0.75rem;
}

/* Touch devices swipe instead of hovering; keep the arrows out of the way. */
@media (hover: none) {
  .moment-media-arrow {
    display: none;
  }
}

.moment-media-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  padding: 0.5rem 0.75rem;
}

.moment-media-progress-track {
  height: 3px;
  overflow: hidden;
  border-radius: 9999px;
  background: oklch(1 0 0 / 0.25);
}

.moment-media-progress-bar {
  height: 100%;
  border-radius: 9999px;
  background: oklch(1 0 0 / 0.85);
  transition: width 300ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .moment-media-track,
  .moment-media-progress-bar,
  .moment-media-arrow {
    transition: none;
  }
}
</style>
