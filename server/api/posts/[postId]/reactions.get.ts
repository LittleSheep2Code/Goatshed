import { getSolarToken } from "~~/server/utils/solarToken";

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, "postId");
  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
  const headers: Record<string, string> = {};
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${baseUrl}/sphere/posts/${postId}/reactions`,
    { headers },
  );

  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const raw = await response.json();
  const solarReactions: { symbol: string }[] = Array.isArray(raw) ? raw : [];

  let userReactions: string[] = [];
  if (token) {
    const mineResponse = await fetch(
      `${baseUrl}/sphere/posts/${postId}/reactions/mine`,
      { headers },
    );
    if (mineResponse.ok) {
      const mineRaw = await mineResponse.json();
      const mineData = Array.isArray(mineRaw) ? mineRaw : [];
      userReactions = mineData.map((r: { symbol: string }) => r.symbol);
    }
  }

  const countMap = new Map<string, number>();
  for (const r of solarReactions) {
    countMap.set(r.symbol, (countMap.get(r.symbol) || 0) + 1);
  }

  const reactions = Array.from(countMap.entries()).map(([symbol, count]) => ({
    symbol,
    count,
    reacted: userReactions.includes(symbol),
  }));

  const total = reactions.reduce((sum, r) => sum + r.count, 0);

  return { reactions, total };
});
