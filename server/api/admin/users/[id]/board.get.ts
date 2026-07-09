import { requireAdmin } from "~~/server/utils/admin";
import {
  fetchAppBoardManifests,
  fetchUserBoard,
  filterBoardItemsForApp,
  getTargetUserBoardAccess,
} from "~~/server/utils/boardAdmin";

/**
 * App-scoped board view for Goatshed admin:
 * 1. Private Develop API → this app's widget manifests only
 * 2. User self-board → installed instances + payloads
 * 3. Filter instances to this app only
 *
 * Note: GET .../board/widgets does not return user layouts/payloads —
 * only definitions. User instances still come from Passport.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const config = useRuntimeConfig(event);
  const apiBaseUrl = config.public.apiBaseUrl;

  const { appId, manifests } = await fetchAppBoardManifests(apiBaseUrl);
  const token = await getTargetUserBoardAccess(id);
  const board = await fetchUserBoard(apiBaseUrl, token);
  const items = filterBoardItemsForApp(board, appId, manifests);

  return {
    app_id: appId,
    manifests,
    items,
    // helpful when filtering looks empty: total board size before app filter
    total_board_items: board.length,
  };
});
