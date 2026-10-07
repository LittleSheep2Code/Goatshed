import { getProjectStars } from "~~/server/utils/github";

/**
 * Star counts for the about page's project cards, keyed by `owner/name`. Cached
 * in `getProjectStars` for half an hour, which is what the header tells the
 * browser and any proxy.
 */
export default defineEventHandler(async (event) => {
  const stars = await getProjectStars();
  setHeader(
    event,
    "cache-control",
    "public, max-age=300, stale-while-revalidate=600",
  );
  return stars;
});
