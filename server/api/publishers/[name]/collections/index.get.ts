import type { PostCollection } from "~/types/post";
import { snFetch } from "~~/server/utils/sn-api";
import {
  assertPublisherReadable,
  sessionSolarToken,
} from "~~/server/utils/solarAccess";

/**
 * Every collection a publisher owns. Upstream returns the whole set — it is not
 * paginated and carries no `X-Total`.
 */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing publisher name",
    });
  }

  assertPublisherReadable(event, name);
  const token = await sessionSolarToken(event);

  return snFetch<PostCollection[]>(
    event,
    `/sphere/publishers/${encodeURIComponent(name)}/collections`,
    { token: token ?? undefined },
  );
});
