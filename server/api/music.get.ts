import { getMusicSnapshot } from "~~/server/utils/lastfm";

/**
 * One Last.fm snapshot for the about page: profile, recent scrobbles, and the
 * three charts behind the section's period switcher. Cached in `getMusicSnapshot`
 * for ten minutes, which is what the header tells the browser and any proxy.
 */
export default defineEventHandler(async (event) => {
  const snapshot = await getMusicSnapshot(event);
  setHeader(event, "cache-control", "public, max-age=300, stale-while-revalidate=600");
  return snapshot;
});
