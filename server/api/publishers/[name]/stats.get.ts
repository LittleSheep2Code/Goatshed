import type { PublisherStats } from "~/types/publisher";
import { snFetch } from "~~/server/utils/sn-api";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing publisher name" });
  }

  return snFetch<PublisherStats>(
    event,
    `/sphere/publishers/${encodeURIComponent(name)}/content-stats`,
  );
});
