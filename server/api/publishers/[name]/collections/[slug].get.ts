import type { PostCollection } from "~/types/post";
import { snFetch } from "~~/server/utils/sn-api";
import {
  assertPublisherReadable,
  sessionSolarToken,
} from "~~/server/utils/solarAccess";

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

  return snFetch<PostCollection>(
    event,
    `/sphere/publishers/${encodeURIComponent(name)}/collections/${encodeURIComponent(slug)}`,
    { token: token ?? undefined },
  );
});
