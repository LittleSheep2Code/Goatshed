import type { Ref } from "vue";

/**
 * Flips `visible` to `true` once `target` scrolls within `rootMargin` of the
 * viewport, then stops observing. Used to defer per-card network work
 * (reactions, reply previews) in long lists until a card is actually reachable.
 *
 * Defaults to visible when IntersectionObserver is unavailable (SSR-less
 * runtimes, very old browsers) so content is never permanently hidden.
 */
export function useInView(
  options: { rootMargin?: string; threshold?: number } = {},
): { target: Ref<HTMLElement | null>; visible: Ref<boolean> } {
  const target = ref<HTMLElement | null>(null);
  const visible = ref(false);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    const element = target.value;
    if (!element || typeof IntersectionObserver === "undefined") {
      visible.value = true;
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        visible.value = true;
        observer?.disconnect();
        observer = null;
      },
      {
        rootMargin: options.rootMargin ?? "256px 0px",
        threshold: options.threshold ?? 0,
      },
    );
    observer.observe(element);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return { target, visible };
}
