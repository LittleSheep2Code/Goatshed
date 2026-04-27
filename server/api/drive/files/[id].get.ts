import { floatingFetch } from "../../../utils/floating-api";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing file id" });
  }

  return floatingFetch(event, `/drive/files/${encodeURIComponent(id)}`);
});
