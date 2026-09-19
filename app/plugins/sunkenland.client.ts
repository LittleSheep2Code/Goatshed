import { configure } from "@solsynth/sunken-land";
import login from "@solsynth/sunken-land/presets/login.css?url";
import reactions from "@solsynth/sunken-land/presets/reactions.css?url";
import repliesList from "@solsynth/sunken-land/presets/replies-list.css?url";
import replyComposer from "@solsynth/sunken-land/presets/reply-composer.css?url";

/**
 * SunkenLand widgets (`sk-*` custom elements) are browser-only, so this runs
 * client-side. The package embeds its own Vue, and each preset is imported as
 * a Vite asset URL so it stays versioned with the dependency; `public/stickers`
 * is filled by the `postinstall` copy.
 *
 * Reads work unauthenticated. To let the widgets sign users in (and react /
 * reply) register a Solarpass client and pass it here:
 *
 *   oidc: { clientId: "<app-slug>", redirectUri: defaultRedirectUri() }
 */
export default defineNuxtPlugin(() => {
  const { public: config } = useRuntimeConfig();

  configure({
    baseUrl: config.apiBaseUrl,
    css: [repliesList, login, replyComposer, reactions],
    stickerUrl: "/stickers/{symbol}.webp",
  });
});
