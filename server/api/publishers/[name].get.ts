import { floatingFetch } from "../../utils/floating-api";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing publisher name" });
  }

  return floatingFetch(event, `/sphere/publishers/${encodeURIComponent(name)}`);
});
