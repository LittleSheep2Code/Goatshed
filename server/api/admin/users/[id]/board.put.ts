import { requireAdmin } from "~~/server/utils/admin";
import { boardAdminUrl, getBoardAdminContext } from "~~/server/utils/boardAdmin";

/**
 * Replace the full board layout for a user via Passport admin API.
 *
 * Note: custom-app widget payloads on replace are still server-owned —
 * client-supplied custom-app payloads are ignored/preserved by Passport.
 * Use the per-item payload endpoint for payload updates.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const body = await readBody(event);
  const { adminToken, solarAccountId } = await getBoardAdminContext(event, id);
  const config = useRuntimeConfig(event);
  const url = boardAdminUrl(config.public.apiBaseUrl, solarAccountId);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[board.put] Downstream error:", { url, status: response.status, body: text });
    throw createError({
      statusCode: response.status,
      message: text || `Passport admin board API returned ${response.status}`,
    });
  }

  return await response.json();
});
