# Goatshed

Goatshed is a personal blog built with Nuxt 4. It is first a blog project, but it also demonstrates how to integrate with the Solar Network API for content, account data, and Sign in with Solarpass.

## What It Does

- Renders blog posts and moments from Solar Network publishers.
- Uses server-side Nuxt API routes as a thin proxy over Solar Network APIs.
- Supports protected publishers and protected content with a local session.
- Includes a Solarpass login flow based on OpenID Connect.
- Shows the logged-in user's Solar account profile on `/me`.

## Stack

- Nuxt 4
- Vue 3
- Nitro server routes
- Tailwind CSS 4
- daisyUI
- Nuxt Image
- Shiki for code highlighting

## Solar Network Integration

The app talks to Solar Network through `NUXT_PUBLIC_API_BASE_URL`, which defaults to `https://api.solian.app`.

Server routes under `server/api` call Solar endpoints such as:

- `/sphere/publishers/...`
- `/sphere/posts...`
- `/passport/accounts/...`
- `/drive/files/...`

The helper in `server/utils/floating-api.ts` adds a bearer token when a user session exists, then converts API payloads from snake_case to camelCase for the app.

## Authentication

Authentication is implemented as a server-side OAuth/OpenID Connect flow against Solarpass.

### Login Flow

1. The client calls `/api/auth/login` through `useAuth().login()`.
2. The server creates an OAuth `state` value and a PKCE verifier/challenge pair.
3. `state`, `next` redirect target, and the PKCE verifier are stored in short-lived HTTP-only cookies.
4. The user is redirected to the Solarpass authorize endpoint.
5. Solarpass redirects back to `/api/auth/callback` with `code` and `state`.
6. The callback validates `state`, reads the PKCE verifier, and exchanges the code for an access token.
7. The server fetches user info from Solar Network and creates a local Goatshed session.
8. The user is redirected to the original `next` path, defaulting to `/me`.

### Session Model

- The browser stores a signed `goatshed_session` cookie.
- Session payloads are stored server-side in Nitro storage under `.data/` by default.
- Stored session data includes:
  - Solar account identity used by the UI
  - access token
  - refresh token if returned
  - expiration timestamp
- User profile data is refreshed through `/passport/accounts/me` and cached server-side for 1 hour.

### Protected Content

Some publishers are treated as locked in the server API layer. When that content is requested:

- unauthenticated users receive `401 Unauthorized`
- authenticated users have their Solar access token forwarded to Solar Network

This means the app itself owns the session, while Solar Network remains the identity provider and content API.

## Important Files

- `nuxt.config.ts`: runtime config, Solar endpoints, and session secret.
- `app/composables/useAuth.ts`: client auth state, login, logout, session refresh.
- `app/plugins/auth-init.ts`: refreshes auth state on app startup.
- `app/middleware/auth.ts`: protects pages such as `/me`.
- `server/api/auth/login.get.ts`: starts OAuth login.
- `server/api/auth/callback.get.ts`: handles token exchange and session creation.
- `server/api/auth/session.get.ts`: returns current session state.
- `server/api/auth/logout.post.ts`: destroys the local session.
- `server/utils/session.ts`: cookie signing, session storage, PKCE/state helpers.
- `server/utils/floating-api.ts`: Solar API fetch wrapper.

## Environment

Copy values from `.env.example` and configure:

- `NUXT_PUBLIC_API_BASE_URL`
- `NUXT_PUBLIC_OAUTH_PROVIDER_NAME`
- `NUXT_PUBLIC_OAUTH_CLIENT_ID`
- `NUXT_OAUTH_CLIENT_SECRET`
- `NUXT_PUBLIC_OAUTH_AUTHORIZE_URL`
- `NUXT_PUBLIC_OAUTH_TOKEN_URL`
- `NUXT_PUBLIC_OAUTH_USER_INFO_URL`
- `NUXT_PUBLIC_OAUTH_SCOPE`
- `NUXT_PUBLIC_OAUTH_REDIRECT_URL`
- `NUXT_AUTH_SESSION_SECRET`

`NUXT_AUTH_SESSION_SECRET` should be replaced with a long random secret in any real deployment.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
