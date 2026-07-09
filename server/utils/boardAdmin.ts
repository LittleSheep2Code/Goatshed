import type { H3Event } from "h3";
import { getUserSolarToken, getSolarAccountId } from "./solarAccount";

/**
 * Resolve auth + target account context for Passport board admin APIs.
 *
 * Uses the currently logged-in Goatshed admin's Solian token (requires
 * `accounts.view` / `accounts.board.manage` on the Solar side) and the
 * target user's DysonNetwork account id as the admin route identifier.
 *
 * Production gateway paths: `/passport/admin/accounts/{identifier}/board...`
 * See docs/ACCOUNT_ADMIN_API.md and docs/ACCOUNT_BOARD.md.
 */
export async function getBoardAdminContext(
  event: H3Event,
  targetUserId: string,
): Promise<{ adminToken: string; solarAccountId: string }> {
  const session = event.context.session as { user?: { id?: string } } | undefined;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const adminToken = await getUserSolarToken(session.user.id);
  if (!adminToken) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin has no linked Solian account or token expired",
    });
  }

  const solarAccountId = await getSolarAccountId(targetUserId);
  if (!solarAccountId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Target user has no linked Solian account",
    });
  }

  return { adminToken, solarAccountId };
}

export function boardAdminUrl(apiBaseUrl: string, solarAccountId: string, suffix = ""): string {
  return `${apiBaseUrl}/passport/admin/accounts/${encodeURIComponent(solarAccountId)}/board${suffix}`;
}
