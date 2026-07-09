import { updateMoodForUser } from "~~/server/utils/moodWidget";

/**
 * Install (if needed) and push mood widget payload for the current user.
 * image/background are taken from Solarpass profile picture & background file ids.
 * Only the mood string is user-editable here.
 */
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const mood = typeof body?.mood === "string" ? body.mood : "";

  const config = useRuntimeConfig(event);
  return await updateMoodForUser(session.user.id, config.public.apiBaseUrl, mood, {
    installIfMissing: body?.install !== false,
  });
});
