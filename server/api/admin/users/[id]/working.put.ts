import { requireAdmin } from "~~/server/utils/admin";
import { updateWorkingForUser } from "~~/server/utils/workingWidget";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const body = await readBody(event);
  const config = useRuntimeConfig(event);
  return await updateWorkingForUser(id, config.public.apiBaseUrl, {
    tasks: body?.tasks,
    image: body?.image,
    background: body?.background,
    installIfMissing: body?.install !== false,
  });
});
