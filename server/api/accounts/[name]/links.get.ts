import type { AccountLink } from "~/types/account";
import { snFetch } from "~~/server/utils/sn-api";

/*
  The links an account wants to be found by: its public carrier connections plus
  its public email contact. Both sources are public routes and already filtered
  server-side, so this only normalizes them into one list the page can render
  without knowing Solar Network's shapes.
*/

/** Contact types Stargate assigns; mirrors `ContactType` in its account model. */
const CONTACT_TYPE_EMAIL = 0;

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  steam: "Steam",
  lastfm: "Last.fm",
};

/** Public connection shape of `/stargate/accounts/{name}/connections`. */
interface SolarConnection {
  provider: string;
  url: string;
}

/** The part of an account contact this route reads. */
interface SolarContact {
  type: number;
  content: string;
  isPublic: boolean;
  isPrimary: boolean;
  verifiedAt: string | null;
}

/**
 * Trailing URL segment when it names the account, `null` when it only
 * identifies it (a Steam profile id is a 17-digit number, not a handle).
 */
function handleFromUrl(url: string): string | null {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean).pop();
    if (!segment) return null;
    const decoded = decodeURIComponent(segment);
    return /^\d+$/.test(decoded) ? null : decoded;
  } catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing account name" });
  }

  const account = encodeURIComponent(name);
  const [connections, accountData] = await Promise.all([
    snFetch<SolarConnection[]>(
      event,
      `/stargate/accounts/${account}/connections`,
    ),
    snFetch<{ contacts?: SolarContact[] }>(
      event,
      `/stargate/accounts/${account}`,
    ),
  ]);

  const links: AccountLink[] = connections
    .filter((connection) => connection.url)
    .map((connection) => ({
      provider: connection.provider,
      label:
        PROVIDER_LABELS[connection.provider.toLowerCase()] ??
        connection.provider,
      handle: handleFromUrl(connection.url),
      url: connection.url,
    }));

  // Contacts are public-facing already; the route still picks the verified
  // email the account marked primary, so an unverified address never ships.
  const emails = (accountData.contacts ?? [])
    .filter(
      (contact) =>
        contact.type === CONTACT_TYPE_EMAIL &&
        contact.isPublic &&
        contact.verifiedAt &&
        contact.content,
    )
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  const email = emails[0]?.content;
  if (email) {
    links.push({
      provider: "email",
      label: "Email",
      handle: email,
      url: `mailto:${email}`,
    });
  }

  return links;
});
