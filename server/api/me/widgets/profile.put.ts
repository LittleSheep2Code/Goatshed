import { updateProfileWidgetForUser } from "~~/server/utils/profileWidget";

/**
 * Body: { data | pairs, image?, background?, install? }
 * image/background optional URL or file id; omit/empty → Solarpass defaults.
 */
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const config = useRuntimeConfig(event);
  const dataRaw = body?.data ?? body?.pairs ?? {};

  return await updateProfileWidgetForUser(session.user.id, config.public.apiBaseUrl, {
    data: dataRaw,
    image: body?.image,
    background: body?.background,
    installIfMissing: body?.install !== false,
  });
});
