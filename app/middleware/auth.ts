export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  if (auth.authenticated.value) return;

  const session = await auth.refreshSession();
  if (session.authenticated) return;

  return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`);
});
