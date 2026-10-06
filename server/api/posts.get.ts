import type { Post } from "~/types/post";
import {
  PUBLISHERS,
  PUBLISHER_META,
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import { snFetchWithTotal } from "~~/server/utils/sn-api";
import { getSolarToken } from "~~/server/utils/solarProfile";

/**
 * `pub` accepts a comma-separated list. Unknown names are dropped and an empty
 * selection falls back to every publisher the blog knows about, so callers can
 * request "everything" without hardcoding the list.
 */
function parsePublishers(value: unknown): PublisherName[] {
  const raw = Array.isArray(value)
    ? value.join(",")
    : typeof value === "string"
      ? value
      : "";
  const names = raw
    .split(",")
    .map((name) => name.trim())
    .filter(isPublisherName);

  return names.length ? [...new Set(names)] : [...PUBLISHERS];
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const take = Math.min(Number(query.take) || 12, 30);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const pubs = parsePublishers(query.pub);
  const requestedType = Number(query.type);
  const type = requestedType === 0 ? 0 : 1;
  const pinned = query.pinned === "true" || query.pinned === "1";

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;

  // Upstream gates restricted publishers per account; a mixed selection simply
  // omits them. Only an all-restricted request is turned away up front.
  if (pubs.every((name) => PUBLISHER_META[name].locked) && !session) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: this publisher requires authentication",
    });
  }

  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
    pub: pubs.join(","),
    replies: "false",
    type: String(type),
    orderDesc: "true",
  });

  if (pinned) params.set("pinned", "true");

  const result = await snFetchWithTotal<Post[]>(
    event,
    `/sphere/posts?${params.toString()}`,
    { token: token ?? undefined },
  );

  return {
    posts: result.data,
    total: result.total,
  };
});
