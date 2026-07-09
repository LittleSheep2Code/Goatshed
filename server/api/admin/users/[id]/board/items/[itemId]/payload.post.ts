import { requireAdmin } from "~~/server/utils/admin";
import {
  fetchAppBoardManifests,
  fetchUserBoard,
  filterBoardItemsForApp,
  getAppBoardSecret,
  getBoardItemWidgetKey,
  getTargetSolarAccountId,
  getTargetUserBoardAccess,
  privateBoardPayloadUrl,
} from "~~/server/utils/boardAdmin";

/**
 * Push payload for this app's board widget only via Develop private API.
 * POST /develop/private/apps/{app_id}/board/payload
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

  const config = useRuntimeConfig(event);
  const apiBaseUrl = config.public.apiBaseUrl;

  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const token = await getTargetUserBoardAccess(id);
  const board = await fetchUserBoard(apiBaseUrl, token);
  const appItems = filterBoardItemsForApp(board, appId, manifests);
  const item = appItems.find((x) => x.id === itemId);

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: "Board item not found or does not belong to this app",
    });
  }

  const widgetKey = body.widget_key || getBoardItemWidgetKey(item);
  if (!widgetKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing widget_key for board item",
    });
  }

  const solarAccountId = await getTargetSolarAccountId(id);
  const { secret } = getAppBoardSecret();
  const url = privateBoardPayloadUrl(apiBaseUrl, appId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
      "x-app-secret": secret,
    },
    body: JSON.stringify({
      account_id: solarAccountId,
      widget_key: widgetKey,
      board_item_id: itemId,
      payload: body.payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[payload.post] Private board API error:", {
      url,
      status: response.status,
      body: text,
    });
    throw createError({
      statusCode: response.status,
      message: text || `Develop private board payload API returned ${response.status}`,
    });
  }

  if (response.status === 204) return { success: true };
  return await response.json();
});
