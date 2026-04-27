import {
  createPkcePair,
  createOAuthState,
  setOAuthPkceCookie,
  setOAuthStateCookie,
  setOAuthRedirectCookie,
} from "../../utils/session";
import { oauthLog, redact } from "../../utils/oauth-log";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);

  const state = createOAuthState();
  const pkce = createPkcePair();
  setOAuthStateCookie(event, state);
  setOAuthPkceCookie(event, pkce.verifier);

  const next = typeof query.next === "string" && query.next.startsWith("/") ? query.next : "/me";
  setOAuthRedirectCookie(event, next);

  const callbackUrl =
    config.public.oauthRedirectUrl || `${getRequestURL(event).origin}/api/auth/callback`;

  oauthLog(event, "login start", {
    next,
    callbackUrl,
    authorizeUrl: config.public.oauthAuthorizeUrl,
    clientId: config.public.oauthClientId,
    state: redact(state),
    pkceVerifier: redact(pkce.verifier),
    pkceChallenge: redact(pkce.challenge),
  });

  const authorizeUrl = new URL(config.public.oauthAuthorizeUrl);
  authorizeUrl.searchParams.set("client_id", config.public.oauthClientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("scope", config.public.oauthScope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", pkce.challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  oauthLog(event, "redirect authorize", {
    location: authorizeUrl.toString(),
  });

  return sendRedirect(event, authorizeUrl.toString());
});
