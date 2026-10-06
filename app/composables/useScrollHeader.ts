import { onMounted, onUnmounted, ref } from "vue";

interface ScrollHeaderOptions {
  /** Minimum scroll distance (px) before hiding is allowed. */
  minScroll?: number;
  /** Ignore scroll deltas smaller than this (px) to avoid jitter. */
  delta?: number;
  /** Scroll offset (px) at which the "scrolled" state flips on. */
  scrolledOffset?: number;
}

/**
 * Tracks whether a top app bar should hide based on scroll direction:
 * hides while scrolling down, reveals while scrolling up, and always
 * reveals near the top of the page.
 *
 * Scroll handling is passive and coalesced into a single
 * `requestAnimationFrame` to stay off the critical path.
 */
export function useScrollHeader(options: ScrollHeaderOptions = {}) {
  const { minScroll = 120, delta = 4, scrolledOffset = 8 } = options;

  const hidden = ref(false);
  const scrolled = ref(false);

  let lastY = 0;
  let ticking = false;

  function update() {
    ticking = false;

    const y = Math.max(window.scrollY, 0);
    scrolled.value = y > scrolledOffset;

    // Near the top the bar always stays visible.
    if (y <= minScroll) {
      hidden.value = false;
      lastY = y;
      return;
    }

    const diff = y - lastY;
    if (Math.abs(diff) < delta) return;

    hidden.value = diff > 0;
    lastY = y;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  onMounted(() => {
    lastY = Math.max(window.scrollY, 0);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
  });

  return { hidden, scrolled };
}
