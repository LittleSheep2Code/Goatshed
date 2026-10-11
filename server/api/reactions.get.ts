import { getSolarToken } from "~~/server/utils/solarToken";
import {
  fetchReactionRollup,
  type ReactionRollup,
} from "~~/server/utils/reactions";

/** Comfortably covers a page of cards while bounding one request's fan-out. */
const MAX_IDS = 50;

/**
 * Reaction counts for many posts at once.
 *
 * A listing renders one `ReactionBar` per card, and each bar used to GET its own
 * `/api/posts/{id}/reactions` — the home page's eight cards meant eight requests,
 * eight session-to-token lookups and eight pairs of calls to Solar. Batching turns
 * that into one of each. Ids that fail are omitted rather than returned empty so
 * the client can retry them instead of caching a card at zero reactions.
 */
export default defineEventHandler(async (event) => {
  const raw = getQuery(event).ids;
  const ids = (Array.isArray(raw) ? raw.join(",") : String(raw ?? ""))
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  if (ids.length === 0) return {};

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;
  const baseUrl = useRuntimeConfig(event).public.apiBaseUrl;

  const settled = await Promise.allSettled(
    ids.map((id) => fetchReactionRollup(baseUrl, id, token)),
  );

  const rollups: Record<string, ReactionRollup> = {};
  for (const [index, id] of ids.entries()) {
    const result = settled[index];
    if (result?.status === "fulfilled") rollups[id] = result.value;
  }

  return rollups;
});
