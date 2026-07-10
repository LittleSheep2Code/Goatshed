import { updateWorkingForUser } from "~~/server/utils/workingWidget";

/**
 * Body: { tasks, image?, background?, install? }
 * image/background optional URL or file id; omit/empty → Solarpass defaults.
 */
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const config = useRuntimeConfig(event);
  return await updateWorkingForUser(session.user.id, config.public.apiBaseUrl, {
    tasks: body?.tasks,
    image: body?.image,
    background: body?.background,
    installIfMissing: body?.install !== false,
  });
});
