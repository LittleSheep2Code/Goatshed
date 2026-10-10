<template>
  <dialog
    ref="dialogEl"
    class="image-lightbox"
    :class="{ 'is-closing': closing }"
    aria-label="图片查看器"
    data-pagefind-ignore
    @cancel.prevent="close"
    @animationend="handleAnimationEnd"
    @close="handleDialogClose"
  >
    <!--
      The stage is the whole viewport: the chrome floats over it, so the photo
      gets every pixel and clicks on the empty space around it close the viewer.
    -->
    <div
      ref="stageEl"
      class="image-lightbox-stage"
      @click.self="closeFromStage"
      @touchstart.passive="markTouchStart"
      @touchend="markTouchEnd"
    >
      <span
        v-if="current && !failed && loadedSrc !== current.src"
        class="loading loading-spinner loading-lg image-lightbox-spinner"
        aria-hidden="true"
      />

      <!--
        Keyed on the source, so a swap mounts a fresh element and its fade-in
        replays instead of the browser reusing the previous slide's paint.
      -->
      <img
        v-if="current && !failed"
        :key="current.src"
        class="image-lightbox-image"
        :class="{ 'is-loaded': loadedSrc === current.src, 'is-zoomed': zoomed }"
        :src="current.src"
        :alt="current.alt"
        draggable="false"
        decoding="async"
        @click="zoomed = !zoomed"
        @load="markLoaded"
        @error="markFailed"
      />

      <p v-else-if="failed" class="image-lightbox-failed">
        图片加载失败
        <a
          v-if="current"
          :href="current.src"
          target="_blank"
          rel="noopener noreferrer"
        >
          在新标签页打开
        </a>
      </p>
    </div>

    <div class="image-lightbox-bar">
      <span class="image-lightbox-count" aria-live="polite">
        <template v-if="count > 1">{{ index + 1 }} / {{ count }}</template>
      </span>

      <div class="image-lightbox-actions">
        <button
          type="button"
          class="btn btn-circle btn-sm image-lightbox-btn"
          :aria-label="zoomed ? '缩小' : '放大'"
          @click="zoomed = !zoomed"
        >
          <ZoomOut v-if="zoomed" class="h-4 w-4" aria-hidden="true" />
          <ZoomIn v-else class="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="btn btn-circle btn-sm image-lightbox-btn"
          aria-label="关闭"
          @click="close"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <button
      v-if="count > 1"
      type="button"
      class="btn btn-circle image-lightbox-step image-lightbox-step-prev"
      aria-label="上一张"
      :disabled="index === 0"
      @click="go(-1)"
    >
      <ChevronLeft class="h-5 w-5" aria-hidden="true" />
    </button>

    <button
      v-if="count > 1"
      type="button"
      class="btn btn-circle image-lightbox-step image-lightbox-step-next"
      aria-label="下一张"
      :disabled="index === count - 1"
      @click="go(1)"
    >
      <ChevronRight class="h-5 w-5" aria-hidden="true" />
    </button>

    <!--
      The caption repeats the image's own `alt`, so it is hidden from assistive
      tech rather than read out twice.
    -->
    <p
      v-if="current?.alt"
      class="image-lightbox-caption"
      aria-hidden="true"
    >
      {{ current.alt }}
    </p>
  </dialog>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-vue-next";

interface LightboxImage {
  src: string;
  alt: string;
}

const props = defineProps<{
  /**
   * The element whose inline images the viewer opens. Clicks inside it are
   * delegated rather than each image being wrapped, so it works with the
   * article's `v-html` output — and keeps working when that output changes.
   */
  container?: HTMLElement | null;
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const stageEl = ref<HTMLElement | null>(null);

const images = ref<LightboxImage[]>([]);
const index = ref(0);
const zoomed = ref(false);
const failed = ref(false);
/** Playing the exit animation; the dialog itself is still open until it ends. */
const closing = ref(false);
let closeTimer = 0;
/** The source that has finished loading; the spinner and fade-in key off it. */
const loadedSrc = ref("");

const count = computed(() => images.value.length);
const current = computed<LightboxImage | null>(
  () => images.value[index.value] ?? null,
);

/** `data-src` first: a lazy loader holds the real file there until it swaps it in. */
function sourceOf(image: HTMLImageElement): string {
  return image.dataset.src || image.currentSrc || image.src;
}

/**
 * Read the article's images at click time rather than caching them: the body
 * renders late, and widgets inside it may add their own artwork afterwards.
 */
function collectImages(): HTMLImageElement[] {
  const root = props.container;
  if (!root) return [];

  return Array.from(root.querySelectorAll<HTMLImageElement>("img")).filter(
    (image) => {
      if (image.dataset.noLightbox !== undefined) return false;
      // A linked image is a navigation target first; leave its click alone.
      if (image.closest("a")) return false;
      // BlurHash stand-ins and other inline pixels are not what the reader clicked.
      const src = sourceOf(image);
      return !!src && !src.startsWith("data:");
    },
  );
}

function open(image: HTMLImageElement) {
  const nodes = collectImages();
  // Matched by element, not by source: two entries of the same file would
  // otherwise both resolve to the first one.
  const at = nodes.indexOf(image);
  // Not part of the set the viewer walks — a linked image, or a placeholder.
  if (at < 0) return;

  images.value = nodes.map((node) => ({ src: sourceOf(node), alt: node.alt }));
  index.value = at;
  reset();
  preloadNeighbours();

  const dialog = dialogEl.value;
  if (!dialog || dialog.open) return;
  dialog.showModal();
  lockScroll(true);
}

/**
 * Shuts the viewer, spending the closing animation first. Esc arrives here too
 * — `cancel` is prevented on the dialog — so every exit looks the same.
 */
function close() {
  const dialog = dialogEl.value;
  if (!dialog?.open || closing.value) return;

  // No animation to wait for: the stylesheet skips it under the same query.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    dialog.close();
    return;
  }

  closing.value = true;
  // Backstop for an animation that never runs — a hidden tab, a dialog the
  // compositor never painted.
  closeTimer = window.setTimeout(finishClose, 400);
}

/** The animation's own end normally gets here first; the timer is the safety net. */
function finishClose() {
  window.clearTimeout(closeTimer);
  closing.value = false;
  dialogEl.value?.close();
}

function handleAnimationEnd(event: AnimationEvent) {
  // The photo fades out alongside the dialog; only the dialog's own end counts.
  if (event.target !== dialogEl.value) return;
  if (closing.value) finishClose();
}

/** Esc, the backdrop and the close button all land here, once the dialog shuts. */
function handleDialogClose() {
  window.clearTimeout(closeTimer);
  closing.value = false;
  lockScroll(false);
  reset();
  images.value = [];
  index.value = 0;
}

function reset() {
  zoomed.value = false;
  failed.value = false;
  loadedSrc.value = "";
}

function go(step: number) {
  const next = index.value + step;
  if (next < 0 || next >= count.value) return;
  index.value = next;
  reset();
  preloadNeighbours();
}

function preloadNeighbours() {
  for (const offset of [1, -1]) {
    const neighbour = images.value[index.value + offset];
    if (!neighbour) continue;
    const preload = new Image();
    preload.src = neighbour.src;
  }
}

/*
  Both handlers compare the event's own `src` attribute against the mounted
  slide: a replaced element can still report its load after Vue has swapped it
  for the next one, which would mark the wrong photo as ready.
*/
function markLoaded(event: Event) {
  const source = current.value?.src;
  const target = event.target as HTMLImageElement | null;
  if (!source || target?.getAttribute("src") !== source) return;
  loadedSrc.value = source;
  failed.value = false;
}

function markFailed(event: Event) {
  const source = current.value?.src;
  const target = event.target as HTMLImageElement | null;
  if (!source || target?.getAttribute("src") !== source) return;
  failed.value = true;
}

function handleContainerClick(event: MouseEvent) {
  const target = event.target as Element | null;
  const image = target?.closest?.("img");
  if (!(image instanceof HTMLImageElement)) return;
  open(image);
}

/*
  A touch that dragged across the stage can still be followed by a synthesised
  click at the point it ended, which would read as a click on the empty space
  and shut the viewer mid-gesture — the hazard `MomentMedia` swallows after a
  swipe. The vertical axis counts too: zoomed, that drag is panning the photo.
*/
let touchOrigin: { x: number; y: number } | null = null;
let suppressClickUntil = 0;

function markTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  touchOrigin = touch ? { x: touch.clientX, y: touch.clientY } : null;
}

function markTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0];
  if (
    touchOrigin &&
    touch &&
    Math.max(
      Math.abs(touch.clientX - touchOrigin.x),
      Math.abs(touch.clientY - touchOrigin.y),
    ) > 8
  ) {
    suppressClickUntil = Date.now() + 350;
  }
  touchOrigin = null;
}

function closeFromStage() {
  if (Date.now() < suppressClickUntil) return;
  close();
}

/*
  The page scrolls behind the modal dialog, so it is frozen for as long as the
  viewer is up — on both elements, since either can be the scroller.
*/
let scrollLocked = false;
let previousOverflow: [string, string] = ["", ""];

function lockScroll(locked: boolean) {
  if (locked === scrollLocked) return;
  scrollLocked = locked;

  if (locked) {
    previousOverflow = [
      document.documentElement.style.overflow,
      document.body.style.overflow,
    ];
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return;
  }

  [document.documentElement.style.overflow, document.body.style.overflow] =
    previousOverflow;
}

function handleKeydown(event: KeyboardEvent) {
  if (!dialogEl.value?.open) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    go(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    go(-1);
  }
}

watch(
  () => props.container,
  (container, _previous, onCleanup) => {
    if (!container) return;
    container.addEventListener("click", handleContainerClick);
    onCleanup(() => container.removeEventListener("click", handleContainerClick));
  },
  { immediate: true },
);

/*
  Zoomed, the stage pans by scrolling, and a horizontal drag would read as a
  swipe as well. `useSwipe` is disabled there rather than the stage being
  un-scrollable.
*/
useSwipe(stageEl, {
  onSwipeLeft: () => {
    if (!zoomed.value) go(1);
  },
  onSwipeRight: () => {
    if (!zoomed.value) go(-1);
  },
});

onMounted(() => window.addEventListener("keydown", handleKeydown));

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer);
  window.removeEventListener("keydown", handleKeydown);
  lockScroll(false);
});
</script>

<style scoped>
/*
  The viewer is the top layer's own scrim: frosted from the current theme's
  surface rather than flat black, so the photo sits on the same material as the
  rest of the site in either palette.
*/
.image-lightbox {
  position: fixed;
  inset: 0;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: color-mix(in srgb, var(--color-base-100) 72%, transparent);
  backdrop-filter: blur(18px) saturate(1.1);
  color: var(--color-base-content);
  overflow: hidden;
  overscroll-behavior: contain;
}

.image-lightbox::backdrop {
  background-color: transparent;
}

/* A `display` of ours would otherwise outrank the UA's `dialog:not([open])`. */
.image-lightbox:not([open]) {
  display: none;
}

@media (prefers-reduced-motion: no-preference) {
  .image-lightbox[open] {
    animation: image-lightbox-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  /*
    The exit is played on the still-open dialog and `close()` is called from its
    `animationend`, so the scrim, the chrome and the photo all leave together
    instead of the top layer vanishing in one frame.
  */
  .image-lightbox.is-closing {
    animation: image-lightbox-out 180ms cubic-bezier(0.4, 0, 1, 1) forwards;
    /* Nothing in here is live any more. */
    pointer-events: none;
  }

  .image-lightbox.is-closing .image-lightbox-image {
    animation: image-lightbox-image-out 180ms cubic-bezier(0.4, 0, 1, 1)
      forwards;
  }
}

@keyframes image-lightbox-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes image-lightbox-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes image-lightbox-image-out {
  from {
    opacity: 1;
    scale: 1;
  }
  to {
    opacity: 0;
    scale: 0.97;
  }
}

.image-lightbox-stage {
  position: absolute;
  inset: 0;
  display: flex;
  /* Clears the bar and the caption, which float over the stage. */
  padding: 3.5rem 1rem 4rem;
  overflow: auto;
  overscroll-behavior: contain;
}

/*
  `margin: auto` rather than a centred flex container: centring an oversized
  image in a scroller puts its top-left corner out of reach.
*/
.image-lightbox-image {
  display: block;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  /* The same radius the article gives it, so opening a picture only scales it. */
  border-radius: var(--radius-media);
  box-shadow: 0 24px 64px -12px rgb(0 0 0 / 0.45);
  opacity: 0;
  cursor: zoom-in;
}

@media (prefers-reduced-motion: no-preference) {
  .image-lightbox-image {
    transition: opacity 240ms ease;
  }
}

.image-lightbox-image.is-loaded {
  opacity: 1;
}

.image-lightbox-image.is-zoomed {
  max-width: none;
  max-height: none;
  border-radius: 0;
  cursor: zoom-out;
}

.image-lightbox-spinner {
  position: absolute;
  inset: 0;
  margin: auto;
  /* Sits behind the photo: it must not swallow the click that closes the viewer. */
  pointer-events: none;
}

.image-lightbox-failed {
  margin: auto;
  font-size: 0.875rem;
  text-align: center;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}

.image-lightbox-failed a {
  color: var(--color-primary);
  text-decoration: underline;
}

.image-lightbox-bar {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-image: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-base-100) 85%, transparent),
    transparent
  );
  /* A fade, not a bar: clicks pass through it to the stage below. */
  pointer-events: none;
}

.image-lightbox-actions {
  display: flex;
  gap: 0.5rem;
  pointer-events: auto;
}

.image-lightbox-count {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--color-base-content) 70%, transparent);
}

.image-lightbox-btn {
  border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
  background-color: color-mix(in srgb, var(--color-base-100) 70%, transparent);
  color: inherit;
  box-shadow: 0 4px 16px -6px rgb(0 0 0 / 0.4);
}

.image-lightbox-btn:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.image-lightbox-step {
  position: absolute;
  inset-block-start: 50%;
  translate: 0 -50%;
  border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
  background-color: color-mix(in srgb, var(--color-base-100) 70%, transparent);
  color: inherit;
  box-shadow: 0 4px 16px -6px rgb(0 0 0 / 0.4);
}

.image-lightbox-step:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.image-lightbox-step:disabled {
  opacity: 0.25;
}

.image-lightbox-step-prev {
  inset-inline-start: 0.75rem;
}

.image-lightbox-step-next {
  inset-inline-end: 0.75rem;
}

.image-lightbox-caption {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  padding: 1.75rem 1.25rem 1rem;
  background-image: linear-gradient(
    to top,
    color-mix(in srgb, var(--color-base-100) 85%, transparent),
    transparent
  );
  font-size: 0.8125rem;
  line-height: 1.5;
  text-align: center;
  text-wrap: pretty;
  color: color-mix(in srgb, var(--color-base-content) 75%, transparent);
  pointer-events: none;
}
</style>
