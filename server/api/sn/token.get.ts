import { getSolarToken } from "~~/server/utils/solarToken";

/**
 * Host-provisioned access token for the SunkenLand `sk-*` widgets.
 *
 * The widgets talk to Stargate directly and cannot read the Nitro session
 * cookie, so `app/plugins/sunkenland.client.ts` feeds them the signed-in
 * user's Solar token via `configure({ getAccessToken })`. Guests get
 * `{ token: null }` so the elements render their signed-out state instead of
 * surfacing an auth error.
 */
export default defineEventHandler(async (event) => {
  // Per-user credential: never let a proxy or the browser cache it.
  setResponseHeader(event, "Cache-Control", "no-store");

  const session = event.context.session;
  if (!session) return { token: null };

  return { token: await getSolarToken(session.user.id) };
});
