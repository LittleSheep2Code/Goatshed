import type { Ref } from "vue";

/**
 * Wheel paging for the slide layout.
 *
 * Native `scroll-snap-stop` is not honoured consistently across input devices,
 * and a small wheel movement would otherwise be scrolled by the browser and then
 * dragged back by snapping — a visible flash. A gesture is instead accumulated
 * until it passes a threshold, which either moves exactly one slide or moves
 * nothing at all, and the same gesture cannot move twice: that is what stops
 * trackpad momentum from running through the whole page.
 *
 * Deliberately wheel-only. Keyboard and touch keep their native scrolling, and
 * where snapping is not doing the work there is nothing to drag a small movement
 * back — see the stylesheet. Two things are always handed back to the browser: a
 * slide that cannot fit a screen, and a wheel that belongs to a nested scroller
 * (a sticky sidebar, a card's own overflow) which still has room to move. Past
 * the first or last slide the page is the browser's too, so whatever sits after
 * the deck stays reachable.
 */
export function useSlidePager(container: Ref<HTMLElement | null>) {
  /**
   * Accumulated wheel distance, in px, that counts as one deliberate move. Low
   * enough that a gentle trackpad flick moves the deck; a tap's jitter is only
   * a pixel or two.
   */
  const THRESHOLD = 12;
  /** Quiet gap that marks a new gesture rather than a continuation of the last. */
  const GESTURE_GAP_MS = 140;
  /**
   * Shortest gap between two moves. Measured: a smooth scroll across a screen
   * settles in ~380ms, so anything longer is dead input after every move.
   */
  const LOCK_MS = 450;

  let travelled = 0;
  let movedInGesture = false;
  let lastWheelAt = 0;
  let lockedUntil = 0;

  function slides() {
    const host = container.value;
    return host
      ? Array.from(host.querySelectorAll<HTMLElement>("[data-slide]"))
      : [];
  }

  /** Closest slide to the middle of the viewport, i.e. the one being read. */
  function currentIndex(list: HTMLElement[]) {
    const middle = window.innerHeight / 2;
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    list.forEach((slide, index) => {
      const box = slide.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - middle);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });

    return nearest;
  }

  /** The app bar's live height in px; the CSS value is in rem. */
  function appBarHeight() {
    const root = getComputedStyle(document.documentElement);
    const rem = Number.parseFloat(root.fontSize) || 16;
    const declared = Number.parseFloat(root.getPropertyValue("--app-bar-height"));
    return Number.isFinite(declared) ? declared * rem : 0;
  }

  /**
   * True when the wheel belongs to a nested scroller that can still move —
   * a sticky sidebar, a card's own overflow — rather than to the slide deck.
   */
  function innerScrollerCanMove(target: EventTarget | null, deltaY: number) {
    const host = container.value;
    let node = target instanceof Element ? target : null;

    while (node && node !== host) {
      if (
        node instanceof HTMLElement &&
        node.scrollHeight > node.clientHeight + 1
      ) {
        const overflowY = getComputedStyle(node).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") {
          const atEnd =
            deltaY > 0
              ? node.scrollTop + node.clientHeight >= node.scrollHeight - 1
              : node.scrollTop <= 0;
          if (!atEnd) return true;
        }
      }

      node = node.parentElement;
    }

    return false;
  }

  function onWheel(event: WheelEvent) {
    // Trackpad pinch arrives as a ctrl-modified wheel; never touch that.
    if (!event.deltaY || event.ctrlKey) return;

    const list = slides();
    if (list.length < 2) return;

    if (innerScrollerCanMove(event.target, event.deltaY)) return;

    const now = performance.now();

    if (now >= lastWheelAt + GESTURE_GAP_MS) {
      travelled = 0;
      movedInGesture = false;
    }
    lastWheelAt = now;

    if (movedInGesture || now < lockedUntil) {
      event.preventDefault();
      return;
    }

    // Firefox reports wheel deltas in lines, and some devices in pages.
    const unit =
      event.deltaMode === 1
        ? 40
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
    travelled += event.deltaY * unit;

    if (Math.abs(travelled) < THRESHOLD) {
      event.preventDefault();
      return;
    }

    const index = currentIndex(list);
    const current = list[index];

    // A slide taller than the screen must stay scrollable by hand.
    if (current.getBoundingClientRect().height > window.innerHeight - appBarHeight()) {
      return;
    }

    const direction = travelled > 0 ? 1 : -1;
    const targetIndex = Math.min(
      Math.max(index + direction, 0),
      list.length - 1,
    );

    // Past either end of the deck: what follows (a footer, the next section)
    // belongs to the browser, so nothing there is behind the hijack.
    if (targetIndex === index) return;

    travelled = 0;
    movedInGesture = true;
    lockedUntil = now + LOCK_MS;
    event.preventDefault();

    list[targetIndex].scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  onMounted(() => window.addEventListener("wheel", onWheel, { passive: false }));
  onBeforeUnmount(() => window.removeEventListener("wheel", onWheel));
}
