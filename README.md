# Goatshed

Goatshed is a personal blog built with Nuxt 4. It is first a blog project, but it also demonstrates how to integrate with the Solar Network API for content, account data, and Sign in with Solarpass.

## What It Does

- Renders blog posts and moments from Solar Network publishers.
- Embeds a Solar post linked on its own line in an article through the SunkenLand `sk-post` widget.
- Opens an article's inline images in a full-screen lightbox with keyboard, swipe and zoom navigation.
- Uses server-side Nuxt API routes as a thin proxy over Solar Network APIs.
- Supports protected publishers and protected content with authentication via better-auth.
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
- SunkenLand (`sk-*` web components) for reactions, replies, and post embeds
- better-auth (authentication)
- Drizzle ORM (database)
- PostgreSQL
- nuxt-og-image with the Takumi renderer (Open Graph cards)
- @nuxt/fonts (self-hosted Nunito + Noto Sans SC)

## Solar Network Integration

The app talks to Solar Network through `NUXT_PUBLIC_API_BASE_URL`, which defaults to `https://api.solian.app`.

Server routes under `server/api` call Solar endpoints such as:

- `/sphere/publishers/...`
- `/sphere/posts...`
- `/stargate/accounts/...`
- `/drive/files/...`

The helper in `server/utils/floating-api.ts` adds a bearer token when a user session exists, then converts API payloads from snake_case to camelCase for the app.

## Authentication

Authentication uses [better-auth](https://www.better-auth.com/) with a Drizzle adapter on PostgreSQL, and a genericOAuth plugin for Solarpass (Solian) OIDC.

### Login Flow

1. The login page calls `signIn.social({ provider: 'solian' })`.
2. better-auth redirects the user to the Solarpass authorize endpoint (via OIDC discovery).
3. After authorization, Solarpass redirects back to the better-auth callback.
4. better-auth creates a user record, an account record (with tokens), and a session in PostgreSQL.
5. A session cookie is set on the browser.
6. The user is redirected to the original page.

### Session Model

- better-auth manages session tokens and cookies.
- The Nitro plugin (`server/plugins/auth.ts`) resolves the session on every request and stores it on `event.context.session`.
- Solar Network profile data is cached in the `account.solarProfile` JSONB column with a 24-hour TTL.

### Protected Content

Some publishers are treated as locked in the server API layer. When that content is requested:

- unauthenticated users receive `401 Unauthorized`
- authenticated users have their Solar access token forwarded to Solar Network

## Important Files

- `nuxt.config.ts`: runtime config and Solar endpoints.
- `server/utils/db.ts`: Drizzle PostgreSQL connection.
- `server/utils/auth.ts`: better-auth instance with Solarpass OAuth.
- `server/plugins/auth.ts`: resolves session on every request, auto-promotes admins.
- `server/utils/solarProfile.ts`: cached Solarpass profile fetcher.
- `server/db/schema.ts`: Drizzle schema (auth tables).
- `app/composables/useAuth.ts`: client auth via better-auth.
- `app/middleware/auth.ts`: protects pages such as `/me`.
- `server/api/auth/[...all].ts`: better-auth catch-all handler.
- `server/utils/floating-api.ts`: Solar API fetch wrapper.
- `server/utils/lastfm.ts`: Last.fm snapshot (recent scrobbles, charts) for the about page's music section, cached for ten minutes.

## Open Graph Images

Cards are rendered at runtime by [nuxt-og-image](https://nuxtseo.com/og-image) with the Takumi renderer (`@takumi-rs/core`, a native binding), 1200×630, and served from `/_og/d/...`.

- Templates live in `app/components/og-image/*.takumi.vue`; each file is one card. `UniOgImage` (brand card with a title/eyebrow/description), `PostOgImage`, `MomentOgImage`, `PublisherOgImage`.
- `app/components/og-image/og-data.ts` holds the wire shapes plus the helpers the templates share. Cards fetch the public Solar Network API directly and never carry a session token, so a locked publisher degrades to a brand-only card instead of leaking its content.
- A page opts in with `defineOgImage("<Name>", props)`. Props are reactive (`computed(...)`), and pages that pass no `title`/`description` inherit the page's `useHead` values.
- Fonts are declared once in `nuxt.config.ts` under `fonts.families` and self-hosted from `public/fonts/`: Nunito weights 400–900 and a whole-file Noto Sans SC. The OG renderer only reads globally emitted `@font-face` rules, and whole-file CJK avoids pulling hundreds of sliced subsets per render.
- `NUXT_OG_IMAGE_SECRET` signs the image URLs. Without it a new secret is minted per build, so every deploy invalidates what unfurlers cached; set it for anything but a single-instance setup.
- Editing a `.takumi.vue` template does not hot-reload in `dev`; restart the dev server before re-rendering a card.

## Environment

Copy values from `.env.example` and configure:

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — secret for session signing
- `BETTER_AUTH_URL` — app base URL (e.g. `http://localhost:3000`)
- `SOLIAN_CLIENT_ID` — Solarpass OAuth client ID
- `SOLIAN_CLIENT_SECRET` — Solarpass OAuth client secret
- `ADMIN_EMAILS` — comma-separated list of admin email addresses
- `NUXT_PUBLIC_API_BASE_URL`
- `NUXT_LASTFM_API_KEY` — Last.fm API key; the about page's music section stays hidden without it
- `NUXT_PUBLIC_LASTFM_USER` — Last.fm account that section reads (defaults to `LittleSheepOvO`)

## Development

```bash
bun install
bun run dev
```

## Production Build

```bash
bun run build
bun run preview
```
