import type { Ref } from "vue";

/**
 * Reveals every `[data-reveal]` descendant of `container` as it scrolls into
 * view, by adding `is-revealed`. A single observer covers the whole subtree, so
 * a page can stagger dozens of elements without dozens of observers.
 *
 * The hidden state lives in CSS, which also unhides it for visitors who asked
 * for reduced motion or have scripting off, so this only ever handles the
 * animated path. Where IntersectionObserver is missing there is no way to know
 * when to reveal, so everything is shown at once.
 */
export function useScrollReveal(container: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    const host = container.value;
    if (!host) return;

    const targets = Array.from(
      host.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer?.unobserve(entry.target);
        }
      },
      /*
        The top margin is deliberately huge: anything at or above the viewport
        counts as intersecting, so elements skipped by a jump — End key, a deep
        link, scroll restoration — still get revealed instead of being stranded
        invisible above the reader. The bottom trim is what makes the reveal
        read as "arriving" rather than "already there", and it is a fixed offset
        rather than a percentage, since a percentage trim grows with the window
        and can leave the last elements on a page unreachable.
      */
      { rootMargin: "100000px 0px -48px 0px", threshold: 0 },
    );

    targets.forEach((target) => observer!.observe(target));
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });
}
