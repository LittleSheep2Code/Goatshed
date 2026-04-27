import { readSession } from "../../utils/session";

export default defineEventHandler((event) => {
  const session = readSession(event);
  return {
    authenticated: Boolean(session),
    user: session?.user ?? null,
  };
});
