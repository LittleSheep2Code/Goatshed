import { getMoodStateForUser } from "~~/server/utils/moodWidget";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const config = useRuntimeConfig(event);
  return await getMoodStateForUser(session.user.id, config.public.apiBaseUrl);
});
