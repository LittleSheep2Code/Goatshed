/**
 * One external identity of an account, normalized for display: a carrier
 * connection (GitHub, Steam, …) or the public email contact.
 */
export interface AccountLink {
  /** Source of the link, e.g. `github`, `steam`, `lastfm`, `email`. */
  provider: string;
  /** Display name of the source. */
  label: string;
  /** Account handle on that source, when the link names one. */
  handle: string | null;
  /** Where the chip points; `mailto:` for the email contact. */
  url: string;
}

export interface AccountProfile {
  bio?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  timeZone?: string;
}

export interface Account {
  id: string;
  name: string;
  nick?: string;
  language?: string;
  region?: string;
  profile?: AccountProfile;
  createdAt?: string;
  updatedAt?: string;
}
