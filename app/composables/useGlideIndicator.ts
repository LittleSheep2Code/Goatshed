import { onMounted, onUnmounted, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";

import { GLIDE_FEEL, glideAt, glideSpan, isGlideAtRest, stepGlide, type GlideState, type Span } from "~/utils/glide";

/** Hidden for less than this (the CSS fade-out), the highlight is still on screen and glides on. */
const FADE_OUT_MS = 180;

/** Parked for this long without the pointer moving, the highlight starts breathing. */
const BREATHE_AFTER_MS = 700;

interface GlideController {
  moveTo(key: string | null): void;
  destroy(): void;
}

function createGlide(container: HTMLElement, indicator: HTMLElement): GlideController {
  let item: HTMLElement | null = null;
  let visible = false;
  let hiddenAt = Number.NEGATIVE_INFINITY;
  let state: GlideState | null = null;
  let frame = 0;
  let lastTime = 0;
  let breatheTimer = 0;
  let breathing = false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Item box in container coordinates: the indicator (a child, absolutely positioned at the
  // container's padding edge) is translated by `left` and sized by `right - left`.
  const measure = (): Span | null => {
    const box = container.getBoundingClientRect();
    if (!item?.isConnected || box.width === 0) return null;
    const rect = item.getBoundingClientRect();
    const scale = box.width / container.offsetWidth || 1;
    const origin = box.left + container.clientLeft * scale;
    return { left: (rect.left - origin) / scale, right: (rect.right - origin) / scale };
  };

  const paint = ({ left, right }: Span) => {
    indicator.style.translate = `${left}px 0`;
    indicator.style.width = `${Math.max(right - left, 0)}px`;
  };

  const snap = () => {
    const target = measure();
    if (!target) return;
    state = glideAt(target);
    paint(target);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const setBreathing = (on: boolean) => {
    if (breathing === on) return;
    breathing = on;
    indicator.dataset.breathing = String(on);
  };

  // The highlight breathes only while one target stays put *and* is still being pointed at or
  // focused — the resting highlight over the current page never idles into an animation.
  const armBreathe = () => {
    clearTimeout(breatheTimer);
    setBreathing(false);
    breatheTimer = window.setTimeout(() => {
      if (item && visible && !document.hidden && !reduced.matches && item.matches(":hover, :focus")) {
        setBreathing(true);
      }
    }, BREATHE_AFTER_MS);
  };

  const tick = (now: number) => {
    frame = 0;
    const target = measure();
    if (!target || !state || reduced.matches) {
      snap();
      return;
    }
    state = stepGlide(state, target, GLIDE_FEEL, now - lastTime);
    lastTime = now;
    if (isGlideAtRest(state, target)) {
      snap();
      return;
    }
    paint(glideSpan(state, GLIDE_FEEL));
    frame = requestAnimationFrame(tick);
  };

  // Layout shifts outside a glide (fonts, breakpoints, the bar revealing itself) re-seat the pill.
  const observer = new ResizeObserver(() => {
    if (!frame) snap();
  });
  observer.observe(container);
  for (const element of container.querySelectorAll("[data-glide-key]")) observer.observe(element);

  const onMotionChange = () => {
    stop();
    snap();
    armBreathe();
  };
  reduced.addEventListener("change", onMotionChange);

  const onVisibility = () => {
    stop();
    if (!document.hidden) snap();
    armBreathe();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    moveTo(key) {
      const now = performance.now();
      const onScreen = visible || now - hiddenAt < FADE_OUT_MS;
      visible = key !== null;
      indicator.dataset.visible = String(visible);
      armBreathe();
      if (key === null) {
        hiddenAt = now;
        return;
      }
      item = container.querySelector<HTMLElement>(`[data-glide-key="${CSS.escape(key)}"]`);
      // First target, a returning highlight, hidden tab or reduced motion: land, don't glide.
      if (!onScreen || !state || document.hidden || reduced.matches) {
        stop();
        snap();
        return;
      }
      if (!frame) {
        lastTime = now;
        frame = requestAnimationFrame(tick);
      }
    },
    destroy() {
      stop();
      clearTimeout(breatheTimer);
      observer.disconnect();
      reduced.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

/**
 * Springs `indicatorRef` onto the element marked `data-glide-key={activeKey}` inside `containerRef`.
 *
 * The indicator must be absolutely positioned at the container's padding edge (left: 0); this
 * composable writes its `translate` and `width` every frame without re-rendering, tracking the
 * target's live box so it also follows items that resize while it travels. `data-visible` flips to
 * "false" when `activeKey` is null so CSS can fade it out; it reappears on the next target without
 * gliding. Once one target has been held for a moment, `data-breathing` flips to "true" so CSS can
 * breathe the highlight; retargeting it (or hiding it) flips it back.
 */
export function useGlideIndicator(
  containerRef: Ref<HTMLElement | null | undefined>,
  indicatorRef: Ref<HTMLElement | null | undefined>,
  activeKey: MaybeRefOrGetter<string | null>,
) {
  let controller: GlideController | null = null;

  onMounted(() => {
    const container = containerRef.value;
    const indicator = indicatorRef.value;
    if (!container || !indicator) return;
    controller = createGlide(container, indicator);
    controller.moveTo(toValue(activeKey));
  });

  watch(
    () => toValue(activeKey),
    (key) => controller?.moveTo(key),
  );

  onUnmounted(() => {
    controller?.destroy();
    controller = null;
  });
}
