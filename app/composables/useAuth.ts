import { createAuthClient, type VueAuthClient } from "better-auth/vue";
import type { BetterAuthClientOptions } from "better-auth";

type AuthClient = VueAuthClient<BetterAuthClientOptions>;

/**
 * better-auth's Vue client owns the session store, and `useSession()` fetches
 * `/api/auth/get-session` the first time that store is read. Every component
 * that called this composable used to build its own client — and therefore its
 * own store — so a single page load issued one session request per caller
 * (10 on the homepage). One client per app (client) or per request (server)
 * collapses that to one.
 */
let client: AuthClient | null = null;

function createClient(): AuthClient {
  return createAuthClient({
    baseURL: useRequestURL().origin,
    fetchOptions: {
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    },
  });
}

function resolveClient(): AuthClient {
  if (!import.meta.server) return (client ||= createClient());

  /*
    The forwarded cookie is what makes the client authenticated, and it differs
    per request, so the instance cannot be shared across requests. Pinning it to
    the request event keeps the "one per render" guarantee without leaking one
    request's session into another's.
  */
  const event = useRequestEvent();
  if (!event) return createClient();

  const context = event.context as { authClient?: AuthClient };
  return (context.authClient ||= createClient());
}

export function useAuth() {
  const authClient = resolveClient();

  const sessionState = authClient.useSession();
  const session = computed(() => sessionState.value?.data ?? null);
  const user = computed(() => sessionState.value?.data?.user ?? null);
  const authenticated = computed(() => Boolean(sessionState.value?.data));

  function login(next = "/me") {
    return navigateTo(`/login?next=${encodeURIComponent(next)}`);
  }

  async function logout() {
    await authClient.signOut();
  }

  return {
    client: authClient,
    session,
    user,
    authenticated,
    login,
    logout,
    useSession: authClient.useSession,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
  };
}

export function useServerSession() {
  if (!import.meta.server) {
    throw new Error("useServerSession can only be used on the server");
  }
  const event = useRequestEvent()!;
  return event.context.session || null;
}
