/**
 * Shapes for the Last.fm snapshot behind the about page's music section.
 * Everything is already normalised by `server/utils/lastfm.ts`: no `#text`
 * keys, no per-size artwork arrays, no strings where a number belongs.
 */

/** One scrobble, or the track Last.fm reports as playing right now. */
export interface MusicTrack {
  name: string;
  artist: string;
  /** Last.fm's page for the artist, absent when the method omits it. */
  artistUrl: string | null;
  album: string | null;
  /** Last.fm's page for the track. */
  url: string;
  /** Largest artwork on offer, or null when Last.fm only has its placeholder. */
  art: string | null;
  /** Plays over the chart's period; null on the recent list, which does not count. */
  playcount: number | null;
  /** ISO timestamp of the scrobble; null while the track is still playing. */
  playedAt: string | null;
  /** True only for the one track Last.fm is streaming right now. */
  nowPlaying: boolean;
}

export interface MusicArtist {
  name: string;
  url: string;
  playcount: number;
}

/** A tag the account's top artists share, i.e. the genres it listens to. */
export interface MusicGenre {
  name: string;
  /** Last.fm's page for the tag. */
  url: string;
  /** How many of the charted artists carry this tag. */
  artists: number;
}

/** Last.fm's own period vocabulary, used verbatim as the chart keys. */
export type MusicPeriod = "7day" | "1month" | "overall";

export interface MusicChart {
  period: MusicPeriod;
  tracks: MusicTrack[];
  artists: MusicArtist[];
}

export interface MusicStats {
  /** Lifetime scrobbles. */
  scrobbles: number;
  /** Distinct artists/tracks Last.fm counts for the account, null when omitted. */
  artists: number | null;
  tracks: number | null;
  /** ISO timestamp of the account's first scrobble, null when omitted. */
  since: string | null;
}

export interface MusicSnapshot {
  user: { name: string; url: string };
  /** Null between tracks; the page falls back to the newest scrobble. */
  nowPlaying: MusicTrack | null;
  recent: MusicTrack[];
  /** One entry per `MusicPeriod`, charted ahead of time so switching costs no request. */
  charts: MusicChart[];
  /** Genres shared by the charted artists, strongest first. */
  genres: MusicGenre[];
  stats: MusicStats;
  /** ISO timestamp this snapshot was assembled, not when Last.fm answered. */
  updatedAt: string;
}
