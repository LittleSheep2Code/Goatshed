import type { SessionUser } from "~/types/auth";

interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
}

export function useAuth() {
  const user = useState<SessionUser | null>("auth-user", () => null);
  const authenticated = computed(() => Boolean(user.value));

  async function refreshSession() {
    try {
      const session = await $fetch<SessionResponse>("/api/auth/session", {
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
      });
      user.value = session.user;
      return session;
    } catch {
      user.value = null;
      return { authenticated: false, user: null } satisfies SessionResponse;
    }
  }

  function login(next = "/me") {
    return navigateTo(`/api/auth/login?next=${encodeURIComponent(next)}`, {
      external: true,
    });
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/");
  }

  return {
    user,
    authenticated,
    refreshSession,
    login,
    logout,
  };
}
