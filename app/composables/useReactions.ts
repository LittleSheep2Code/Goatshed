import type { ReactionSummary } from "~/types/comment";

export interface ReactionState {
  reactions: ReactionSummary[];
  total: number;
}

/**
 * Reaction counts for every card on the page, keyed by post id.
 *
 * A listing renders one `ReactionBar` per card, and each bar used to fetch its own
 * counts — eight requests for the home page's eight cards, each one a token lookup
 * and a pair of calls to Solar behind it. Bars now enqueue their post id and the
 * queue is flushed once per tick, so a page of N cards costs one round trip.
 *
 * The maps only exist on the client: a server render must never carry per-visitor
 * reaction state between requests, and reactions are not part of the rendered HTML
 * anyway.
 */
const states = import.meta.client
  ? reactive(new Map<string, ReactionState>())
  : null;

/** Ids asked for but not yet delivered, so a second mount does not re-ask. */
const queued = import.meta.client ? new Set<string>() : null;

let flushScheduled = false;

async function flushQueue() {
  flushScheduled = false;
  if (!states || !queued) return;

  const ids = [...queued];
  queued.clear();
  if (ids.length === 0) return;

  try {
    const rollups = await $fetch<Record<string, ReactionState>>("/api/reactions", {
      query: { ids: ids.join(",") },
    });
    /*
      Only ids the server actually answered are cached: a post that failed is left
      absent, so the next card to mount retries it rather than showing zero.
    */
    for (const [id, rollup] of Object.entries(rollups)) states.set(id, rollup);
  } catch (error) {
    console.error("Failed to fetch reactions:", error);
  }
}

function enqueueReactions(id: string) {
  if (!states || !queued || !id) return;
  if (states.has(id) || queued.has(id)) return;

  queued.add(id);
  if (flushScheduled) return;

  flushScheduled = true;
  // One tick of slack, so every bar mounting in the same render joins one request.
  queueMicrotask(() => void flushQueue());
}

/**
 * Reads and writes one post's reaction counts through the shared batch.
 *
 * `state` is null until the batch for this post lands, which is what the bar shows
 * as "no reactions yet".
 */
export function useReactions(postId: MaybeRefOrGetter<string>) {
  const id = computed(() => toValue(postId));

  watch(
    id,
    (value) => enqueueReactions(value),
    { immediate: true },
  );

  const state = computed<ReactionState | null>(
    () => states?.get(id.value) ?? null,
  );

  return {
    state,
    /** Cache a fresh payload, e.g. the response to this viewer's own reaction. */
    apply(rollup: ReactionState) {
      states?.set(id.value, rollup);
    },
    /** Drop the cached counts and re-read them in the next batch. */
    invalidate() {
      if (!states) return;
      states.delete(id.value);
      enqueueReactions(id.value);
    },
  };
}
