import { PROJECT_REPOS } from "~/constants/projects";

/**
 * Star counts for the repos the about page's project cards link to.
 *
 * Read unauthenticated, which caps the server's IP at 60 requests an hour, so a
 * count is remembered for half an hour and concurrent cold callers share one
 * request. A repo GitHub does not answer for is left out of the result rather
 * than reported as zero: a broken read and a starless project must not look the
 * same to the page.
 */

const ENDPOINT = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 30 * 60_000;

const cache = new Map<string, { stars: number; at: number }>();
const inFlight = new Map<string, Promise<number | null>>();

/** One `GET /repos/{owner}/{repo}`, or null when GitHub has no usable answer. */
async function fetchStars(repo: string): Promise<number | null> {
  try {
    const response = await fetch(`${ENDPOINT}/repos/${repo}`, {
      headers: { accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as { stargazers_count?: number };
    return typeof payload.stargazers_count === "number"
      ? payload.stargazers_count
      : null;
  } catch {
    return null;
  }
}

/**
 * Stars for one repo, reused for `CACHE_TTL_MS`. A refresh that fails serves the
 * last good count instead of dropping the number off the card.
 */
async function repoStars(repo: string): Promise<number | null> {
  const cached = cache.get(repo);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.stars;

  const pending = inFlight.get(repo);
  if (pending) return pending;

  const request = fetchStars(repo)
    .then((stars) => {
      if (stars === null) return cached?.stars ?? null;
      cache.set(repo, { stars, at: Date.now() });
      return stars;
    })
    .finally(() => inFlight.delete(repo));
  inFlight.set(repo, request);
  return request;
}

/** Star counts for every repo the about page links, keyed by `owner/name`. */
export async function getProjectStars(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    Object.values(PROJECT_REPOS).map(
      async (repo) => [repo, await repoStars(repo)] as const,
    ),
  );

  const stars: Record<string, number> = {};
  for (const [repo, count] of entries) {
    if (count !== null) stars[repo] = count;
  }
  return stars;
}
