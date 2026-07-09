import { requireAdmin } from "~~/server/utils/admin";
import { boardAdminUrl, getBoardAdminContext } from "~~/server/utils/boardAdmin";

/**
 * Remove a board item via Passport admin API.
 * Prefer this over GET+filter+PUT on the user self-board endpoint.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });
  }

  const { adminToken, solarAccountId } = await getBoardAdminContext(event, id);
  const config = useRuntimeConfig(event);
  const url = boardAdminUrl(
    config.public.apiBaseUrl,
    solarAccountId,
    `/items/${encodeURIComponent(itemId)}`,
  );

  const response = await fetch(url, {
    method: "DELETE",
    headers: { authorization: `Bearer ${adminToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[board.item.delete] Downstream error:", {
      url,
      status: response.status,
      body: text,
    });
    throw createError({
      statusCode: response.status,
      message: text || `Passport admin board API returned ${response.status}`,
    });
  }

  return { success: true };
});
