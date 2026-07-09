import { requireAdmin } from "~~/server/utils/admin";
import { boardAdminUrl, getBoardAdminContext } from "~~/server/utils/boardAdmin";

/**
 * Admin override: push payload to any board item (prebuilt or custom-app).
 *
 * Uses Passport admin API — not the Develop app-secret private route.
 * Payload must follow the universal envelope contract:
 * { field: { value, label, format? } }
 *
 * See docs/ACCOUNT_ADMIN_API.md and docs/ACCOUNT_BOARD.md.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });
  }

  const body = await readBody(event);
  if (!body || typeof body.payload !== "object" || body.payload === null) {
    throw createError({ statusCode: 400, statusMessage: "Body must include a payload object" });
  }

  const { adminToken, solarAccountId } = await getBoardAdminContext(event, id);
  const config = useRuntimeConfig(event);
  const url = boardAdminUrl(
    config.public.apiBaseUrl,
    solarAccountId,
    `/items/${encodeURIComponent(itemId)}/payload`,
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ payload: body.payload }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[payload.post] Downstream error:", { url, status: response.status, body: text });
    throw createError({
      statusCode: response.status,
      message: text || `Passport admin board payload API returned ${response.status}`,
    });
  }

  if (response.status === 204) return { success: true };
  return await response.json();
});
