import type { H3Event } from "h3";
import { PUBLISHER_META, isPublisherName } from "~/constants/publishers";
import { getSolarToken } from "~~/server/utils/solarProfile";

/**
 * Solar bearer token for the request's better-auth session, or `null` for
 * guests. Collection routes forward it upstream so a signed-in reader resolves
 * the posts their account is allowed to see.
 */
export async function sessionSolarToken(
  event: H3Event,
): Promise<string | null> {
  const session = event.context.session;
  return session ? getSolarToken(session.user.id) : null;
}

/**
 * Turns away an anonymous read of a locked publisher's collection surface.
 * Mirrors the gate in `server/api/posts.get.ts`: only names this blog knows to
 * be locked are rejected, so an unknown publisher still falls through to
 * upstream's own 404.
 */
export function assertPublisherReadable(event: H3Event, name: string): void {
  if (
    isPublisherName(name) &&
    PUBLISHER_META[name].locked &&
    !event.context.session
  ) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: this publisher requires authentication",
    });
  }
}
