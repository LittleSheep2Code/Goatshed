import { requireAdmin } from "~~/server/utils/admin";
import { updateMoodForUser } from "~~/server/utils/moodWidget";

/** Admin shortcut: set a user's mood widget with profile media auto-filled. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const body = await readBody(event);
  const mood = typeof body?.mood === "string" ? body.mood : "";

  const config = useRuntimeConfig(event);
  return await updateMoodForUser(id, config.public.apiBaseUrl, mood, {
    installIfMissing: body?.install !== false,
  });
});
