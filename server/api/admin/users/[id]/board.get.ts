import { requireAdmin } from "~~/server/utils/admin";
import { boardAdminUrl, getBoardAdminContext } from "~~/server/utils/boardAdmin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const { adminToken, solarAccountId } = await getBoardAdminContext(event, id);
  const config = useRuntimeConfig(event);
  const url = boardAdminUrl(config.public.apiBaseUrl, solarAccountId);

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${adminToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[board.get] Downstream error:", { url, status: response.status, body: text });
    throw createError({
      statusCode: response.status,
      message: text || `Passport admin board API returned ${response.status}`,
    });
  }

  return await response.json();
});
