import type {
  MusicArtist,
  MusicChart,
  MusicGenre,
  MusicPeriod,
  MusicSnapshot,
  MusicTrack,
} from "~/types/music";

/**
 * Last.fm client for the about page's music section.
 *
 * One snapshot — profile, recent scrobbles, three charts, plus the album covers
 * and the artist tags the chart methods do not carry — is assembled server-side
 * and kept for `CACHE_TTL_MS`. The page renders it with the rest of the SSR
 * output, which is also what lets the reveal observer in `useScrollReveal` find
 * the section on first mount.
 */

const ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const REQUEST_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 10 * 60_000;

/** Chart periods, narrowest first: the page shows them as one switcher. */
const PERIODS: MusicPeriod[] = ["7day", "1month", "overall"];

/** Row counts the section's two columns are laid out for, at every size. */
const TOP_TRACKS = 6;
const TOP_ARTISTS = 6;
const RECENT_TRACKS = 6;

/**
 * Last.fm serves the same grey square for every track it has no cover for, so
 * a URL carrying this id means "no artwork" rather than "artwork".
 */
const ART_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

/** Last.fm returns a bare object instead of a one-element array on single hits. */
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function toCount(value: string | number | undefined): number {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function toIso(seconds: string | number | undefined): string | null {
  const value = Number(seconds);
  return Number.isFinite(value) && value > 0
    ? new Date(value * 1000).toISOString()
    : null;
}

/** Artwork sizes, largest first; `mega` only shows up on recent scrobbles. */
const ART_SIZES = ["mega", "extralarge", "large", "medium", "small"];

/** Largest artwork Last.fm actually has, or null when it only has the filler. */
function pickArt(images: RawImage[] | undefined): string | null {
  for (const size of ART_SIZES) {
    const url = images?.find((image) => image.size === size)?.["#text"];
    if (url && !url.includes(ART_PLACEHOLDER)) return url;
  }
  return null;
}

/** Artist is `{"#text"}` on recent scrobbles and `{name, url}` on charts. */
function toTrack(raw: RawRecentTrack): MusicTrack {
  return {
    name: raw.name,
    artist: raw.artist?.["#text"] || raw.artist?.name || "未知艺人",
    artistUrl: raw.artist?.url || null,
    album: raw.album?.["#text"] || null,
    url: raw.url,
    art: pickArt(raw.image),
    playcount: null,
    playedAt: toIso(raw.date?.uts),
    nowPlaying: raw["@attr"]?.nowplaying === "true",
  };
}

function toChartedTrack(raw: RawTopTrack): MusicTrack {
  return {
    name: raw.name,
    artist: raw.artist?.name || raw.artist?.["#text"] || "未知艺人",
    artistUrl: raw.artist?.url || null,
    album: null,
    url: raw.url,
    // Last.fm answers chart methods with its own grey placeholder; the real
    // cover is filled in afterwards by `lookupArt`.
    art: null,
    playcount: toCount(raw.playcount),
    playedAt: null,
    nowPlaying: false,
  };
}

interface RawImage {
  size: string;
  "#text": string;
}

interface RawArtistRef {
  "#text"?: string;
  name?: string;
  url?: string;
}

interface RawRecentTrack {
  name: string;
  url: string;
  artist?: RawArtistRef;
  album?: { "#text"?: string };
  image?: RawImage[];
  date?: { uts?: string };
  "@attr"?: { nowplaying?: string };
}

interface RawTopTrack {
  name: string;
  url: string;
  playcount?: string;
  artist?: RawArtistRef;
}

interface RawTopArtist {
  name: string;
  url: string;
  playcount?: string;
}

interface RawUserInfo {
  name: string;
  url: string;
  playcount?: string;
  artist_count?: string;
  track_count?: string;
  registered?: { unixtime?: string };
}

interface RawRecentTracks {
  recenttracks?: { track?: RawRecentTrack | RawRecentTrack[] };
}

interface RawTopTracks {
  toptracks?: { track?: RawTopTrack | RawTopTrack[] };
}

interface RawTopArtists {
  topartists?: { artist?: RawTopArtist | RawTopArtist[] };
}

/**
 * One Last.fm method call. The key travels in the query string — never in a log
 * line or an error message — and failures become 502s so a Last.fm outage
 * cannot be mistaken for a bug in this app.
 */
async function call<T>(
  event: Parameters<typeof useRuntimeConfig>[0],
  method: string,
  params: Record<string, string>,
): Promise<T> {
  const config = useRuntimeConfig(event);
  const apiKey = config.lastfmApiKey;
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Last.fm is not configured (NUXT_LASTFM_API_KEY)",
    });
  }

  const query = new URLSearchParams({
    method,
    api_key: apiKey,
    format: "json",
    ...params,
  });

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${query}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw createError({
      statusCode: 502,
      statusMessage: `Last.fm did not answer ${method}`,
      cause,
    });
  }

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Last.fm answered ${response.status} for ${method}`,
    });
  }

  // Last.fm answers 200 with an `error` member for bad keys, users and methods.
  const payload = (await response.json()) as { error?: number; message?: string };
  if (payload.error) {
    throw createError({
      statusCode: 502,
      statusMessage: `Last.fm rejected ${method}: ${payload.message ?? payload.error}`,
    });
  }

  return payload as T;
}

/**
 * Optional half of the snapshot: a chart that fails is dropped, not fatal, so a
 * single flaky method cannot blank the whole section.
 */
function optional<T>(request: Promise<T>, label: string): Promise<T | null> {
  return request.catch((error: unknown) => {
    console.warn(`[lastfm] ${label} unavailable:`, error);
    return null;
  });
}

async function collectSnapshot(
  event: Parameters<typeof useRuntimeConfig>[0],
  user: string,
): Promise<MusicSnapshot> {
  const [profile, recent, charts] = await Promise.all([
    // The one required call: if this fails, the section has nothing to show.
    call<{ user: RawUserInfo }>(event, "user.getinfo", { user }),
    optional(
      call<RawRecentTracks>(event, "user.getrecenttracks", {
        user,
        limit: String(RECENT_TRACKS),
      }),
      "user.getrecenttracks",
    ),
    Promise.all(
      PERIODS.map(async (period): Promise<MusicChart> => {
        const [tracks, artists] = await Promise.all([
          optional(
            call<RawTopTracks>(event, "user.gettoptracks", {
              user,
              period,
              limit: String(TOP_TRACKS),
            }),
            `user.gettoptracks ${period}`,
          ),
          optional(
            call<RawTopArtists>(event, "user.gettopartists", {
              user,
              period,
              limit: String(TOP_ARTISTS),
            }),
            `user.gettopartists ${period}`,
          ),
        ]);

        return {
          period,
          tracks: asArray(tracks?.toptracks?.track).map(toChartedTrack),
          artists: asArray(artists?.topartists?.artist).map(
            (artist): MusicArtist => ({
              name: artist.name,
              url: artist.url,
              playcount: toCount(artist.playcount),
            }),
          ),
        };
      }),
    ),
  ]);

  const scrobbles = asArray(recent?.recenttracks?.track).map(toTrack);
  const playing = scrobbles.find((track) => track.nowPlaying) ?? null;
  const info = profile.user;

  /*
    Covers. Chart responses carry no artwork of their own, so every distinct
    chart track is looked up — across all three periods, since the windows
    overlap heavily. The scrobble feed usually brings its own artwork, so only
    the card's lead track is added when it arrived without any.
  */
  const lead = playing ?? scrobbles[0] ?? null;
  const targets = new Map<string, ArtTarget>();
  for (const chart of charts) {
    for (const entry of chart.tracks) {
      targets.set(JSON.stringify([entry.artist, entry.name]), {
        artist: entry.artist,
        track: entry.name,
      });
    }
  }
  if (lead && !lead.art) {
    targets.set(JSON.stringify([lead.artist, lead.name]), {
      artist: lead.artist,
      track: lead.name,
    });
  }

  /*
    Both extras hang off the same artists and tracks the charts already brought
    back, and both are read from caches that outlive the snapshot, so a warm
    server pays for neither of them.
  */
  const artistNames = [
    ...new Set(
      charts.flatMap((chart) => chart.artists.map((artist) => artist.name)),
    ),
  ];
  const [art, genres] = await Promise.all([
    lookupArt(event, [...targets.values()]),
    lookupGenres(event, artistNames),
  ]);

  for (const chart of charts) {
    for (const entry of chart.tracks) {
      entry.art = art.get(JSON.stringify([entry.artist, entry.name])) ?? null;
    }
  }
  if (lead && !lead.art) {
    lead.art = art.get(JSON.stringify([lead.artist, lead.name])) ?? null;
  }

  return {
    user: { name: info.name, url: info.url },
    nowPlaying: playing,
    // The now-playing entry has no scrobble time and belongs to the card above
    // the ledger, not to the ledger itself.
    recent: scrobbles.filter((track) => track !== playing),
    charts,
    genres,
    stats: {
      scrobbles: toCount(info.playcount),
      artists: info.artist_count ? toCount(info.artist_count) : null,
      tracks: info.track_count ? toCount(info.track_count) : null,
      since: toIso(info.registered?.unixtime),
    },
    updatedAt: new Date().toISOString(),
  };
}

interface RawTrackInfo {
  track?: { album?: { image?: RawImage[] } };
}

/**
 * Chart artwork does not change, so covers outlive several snapshot refreshes.
 * A miss (null) is cached too: most of this account's tracks have no album
 * association upstream, and re-asking for them every ten minutes is waste.
 */
const ART_TTL_MS = 24 * 60 * 60 * 1000;
const artCache = new Map<string, { url: string | null; at: number }>();

/** Burst of lookups a cold cache is allowed to make at once. */
const ART_LOOKUP_CAP = 24;

interface ArtTarget {
  artist: string;
  track: string;
}

/**
 * Album covers for chart tracks. The chart methods answer with Last.fm's grey
 * placeholder, but `track.getInfo` knows the album, so each distinct track is
 * looked up once and remembered for a day.
 */
async function lookupArt(
  event: Parameters<typeof useRuntimeConfig>[0],
  targets: ArtTarget[],
): Promise<Map<string, string>> {
  const art = new Map<string, string>();
  const misses: ArtTarget[] = [];

  for (const target of targets) {
    const key = JSON.stringify([target.artist, target.track]);
    const cached = artCache.get(key);
    if (cached && Date.now() - cached.at < ART_TTL_MS) {
      if (cached.url) art.set(key, cached.url);
      continue;
    }
    misses.push(target);
  }

  const fetched = await Promise.all(
    misses.slice(0, ART_LOOKUP_CAP).map(async (target) => {
      /*
        Artwork is decoration, and a genuinely dead upstream already surfaces as
        a failed `user.getinfo`, so a cover that cannot be had stays quiet
        instead of logging a warning per track.
      */
      const payload = await call<RawTrackInfo>(event, "track.getInfo", {
        artist: target.artist,
        track: target.track,
      }).catch(() => null);
      return { target, url: payload ? pickArt(payload.track?.album?.image) : null };
    }),
  );

  for (const { target, url } of fetched) {
    const key = JSON.stringify([target.artist, target.track]);
    artCache.set(key, { url, at: Date.now() });
    if (url) art.set(key, url);
  }

  return art;
}

interface RawArtistTags {
  toptags?: { tag?: RawTag | RawTag[] };
}

interface RawTag {
  name: string;
  url: string;
}

/** Artist tags change as slowly as artwork, so they share its day-long cache. */
const tagCache = new Map<string, { tags: RawTag[]; at: number }>();

/** A tag has to be carried by more than one charted artist to count as a genre. */
const GENRE_MIN_ARTISTS = 2;
const GENRE_LIMIT = 6;

/**
 * The genres behind the charts. `user.getTopTags` reports the account's own
 * tagging and is empty for anyone who never tagged a track, so genres are
 * assembled from the artists' tags instead. A tag only one artist carries is
 * usually a joke or a one-off ("seen live", "favourite"), so singletons are
 * dropped and the rest ranked by how many charted artists share them.
 */
async function lookupGenres(
  event: Parameters<typeof useRuntimeConfig>[0],
  artists: string[],
): Promise<MusicGenre[]> {
  const tagged = await Promise.all(
    artists.map(async (artist) => {
      const cached = tagCache.get(artist);
      if (cached && Date.now() - cached.at < ART_TTL_MS) return cached.tags;

      const payload = await call<RawArtistTags>(event, "artist.getTopTags", {
        artist,
      }).catch(() => null);
      const tags = asArray(payload?.toptags?.tag);
      tagCache.set(artist, { tags, at: Date.now() });
      return tags;
    }),
  );

  const byTag = new Map<string, MusicGenre>();
  for (const tags of tagged) {
    for (const tag of tags) {
      const key = tag.name.toLowerCase();
      const genre = byTag.get(key) ?? { name: tag.name, url: tag.url, artists: 0 };
      genre.artists += 1;
      byTag.set(key, genre);
    }
  }

  return [...byTag.values()]
    .filter((genre) => genre.artists >= GENRE_MIN_ARTISTS)
    .sort((a, b) => b.artists - a.artists || a.name.localeCompare(b.name))
    .slice(0, GENRE_LIMIT);
}

const cache = new Map<string, { value: MusicSnapshot; at: number }>();
const inFlight = new Map<string, Promise<MusicSnapshot>>();

/**
 * Snapshot for the configured account, reused for `CACHE_TTL_MS`. Concurrent
 * callers on a cold cache share one fan-out, and a refresh that fails falls
 * back to the stale copy rather than blanking the section.
 */
export async function getMusicSnapshot(
  event: Parameters<typeof useRuntimeConfig>[0],
): Promise<MusicSnapshot> {
  const { lastfmUser } = useRuntimeConfig(event).public;
  const cached = cache.get(lastfmUser);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  let pending = inFlight.get(lastfmUser);
  if (!pending) {
    pending = collectSnapshot(event, lastfmUser)
      .then((value) => {
        cache.set(lastfmUser, { value, at: Date.now() });
        return value;
      })
      .finally(() => inFlight.delete(lastfmUser));
    inFlight.set(lastfmUser, pending);
  }

  try {
    return await pending;
  } catch (error) {
    if (cached) {
      console.warn("[lastfm] refresh failed, serving the cached snapshot:", error);
      return cached.value;
    }
    throw error;
  }
}
