import { updateMoodForUser } from "~~/server/utils/moodWidget";

/**
 * Body: { mood, image?, install? }
 * image optional URL or file id; omit/empty → Solarpass profile picture.
 */
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const config = useRuntimeConfig(event);
  return await updateMoodForUser(session.user.id, config.public.apiBaseUrl, {
    mood: typeof body?.mood === "string" ? body.mood : "",
    image: body?.image,
    installIfMissing: body?.install !== false,
  });
});
