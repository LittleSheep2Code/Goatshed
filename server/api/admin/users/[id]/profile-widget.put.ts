import { requireAdmin } from "~~/server/utils/admin";
import { updateProfileWidgetForUser } from "~~/server/utils/profileWidget";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const body = await readBody(event);
  const config = useRuntimeConfig(event);
  const dataRaw = body?.data ?? body?.pairs ?? {};

  return await updateProfileWidgetForUser(id, config.public.apiBaseUrl, {
    data: dataRaw,
    image: body?.image,
    background: body?.background,
    installIfMissing: body?.install !== false,
  });
});
