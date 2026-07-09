import { requireAdmin } from "~~/server/utils/admin";
import {
  fetchAppBoardManifests,
  fetchUserBoard,
  filterBoardItemsForApp,
  getTargetUserBoardAccess,
  replaceUserBoard,
} from "~~/server/utils/boardAdmin";

/**
 * Remove one of this app's board items from the user's layout.
 * Layout is Passport-owned (self-board PUT); private API cannot remove placements.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });
  }

  const config = useRuntimeConfig(event);
  const apiBaseUrl = config.public.apiBaseUrl;

  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const token = await getTargetUserBoardAccess(id);
  const board = await fetchUserBoard(apiBaseUrl, token);
  const appItems = filterBoardItemsForApp(board, appId, manifests);

  if (!appItems.some((x) => x.id === itemId)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Board item not found or does not belong to this app",
    });
  }

  // Rewrite full board without this item (preserve other apps' widgets)
  const updated = board.filter((item) => item.id !== itemId);
  updated.forEach((item, i) => {
    item.order = i;
  });

  await replaceUserBoard(apiBaseUrl, token, updated);
  return { success: true };
});
