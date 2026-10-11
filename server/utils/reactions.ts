import type { ReactionSummary } from "~/types/comment";

/** The shape Solar returns from `sphere/posts/{id}/reactions`. */
interface SolarReaction {
  symbol: string;
}

export interface ReactionRollup {
  reactions: ReactionSummary[];
  total: number;
}

/**
 * Solar's reaction roll-up for one post, shaped for the site's `ReactionBar`.
 *
 * The viewer's Solar token is a parameter rather than a lookup so that a batch of
 * posts shares a single token round trip; it is what makes the `mine` request — and
 * therefore the "you reacted to this" highlight — possible.
 */
export async function fetchReactionRollup(
  baseUrl: string,
  postId: string,
  token: string | null,
): Promise<ReactionRollup> {
  const path = `${baseUrl}/sphere/posts/${encodeURIComponent(postId)}/reactions`;
  const headers: Record<string, string> = token
    ? { authorization: `Bearer ${token}` }
    : {};

  const [allResponse, mineResponse] = await Promise.all([
    fetch(path, { headers }),
    token ? fetch(`${path}/mine`, { headers }) : Promise.resolve(null),
  ]);

  if (!allResponse.ok) {
    const text = await allResponse.text();
    throw createError({
      statusCode: allResponse.status,
      message: text || `Request failed: ${allResponse.status}`,
    });
  }

  const raw = await allResponse.json();
  const solarReactions: SolarReaction[] = Array.isArray(raw) ? raw : [];

  let userReactions: string[] = [];
  if (mineResponse?.ok) {
    const mineRaw = await mineResponse.json();
    const mineData = Array.isArray(mineRaw) ? mineRaw : [];
    userReactions = mineData.map((r: { symbol: string }) => r.symbol);
  }

  const countMap = new Map<string, number>();
  for (const reaction of solarReactions) {
    countMap.set(reaction.symbol, (countMap.get(reaction.symbol) || 0) + 1);
  }

  const reactions = Array.from(countMap.entries()).map(([symbol, count]) => ({
    symbol,
    count,
    reacted: userReactions.includes(symbol),
  }));

  return {
    reactions,
    total: reactions.reduce((sum, reaction) => sum + reaction.count, 0),
  };
}
