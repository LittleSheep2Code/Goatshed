import type { Post } from "~/types/post";
import { snFetchWithTotal } from "~~/server/utils/sn-api";
import {
  assertPublisherReadable,
  sessionSolarToken,
} from "~~/server/utils/solarAccess";

/**
 * Posts in a collection, newest first. Upstream sorts by publish date
 * descending and filters to what the requesting account may read, reporting
 * the visible count through `X-Total`.
 */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  const slug = getRouterParam(event, "slug");
  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing publisher name or collection slug",
    });
  }

  assertPublisherReadable(event, name);
  const token = await sessionSolarToken(event);

  const query = getQuery(event);
  const take = Math.min(Number(query.take) || 12, 30);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });

  const result = await snFetchWithTotal<Post[]>(
    event,
    `/sphere/publishers/${encodeURIComponent(name)}/collections/${encodeURIComponent(slug)}/posts?${params.toString()}`,
    { token: token ?? undefined },
  );

  return {
    posts: result.data,
    total: result.total,
  };
});
