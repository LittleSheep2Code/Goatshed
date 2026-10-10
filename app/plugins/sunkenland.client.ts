import { configure } from "@solsynth/sunkenland";
import login from "@solsynth/sunkenland/presets/login.css?url";
import media from "@solsynth/sunkenland/presets/media.css?url";
import post from "@solsynth/sunkenland/presets/post.css?url";
import reactions from "@solsynth/sunkenland/presets/reactions.css?url";
import repliesList from "@solsynth/sunkenland/presets/replies-list.css?url";
import replyComposer from "@solsynth/sunkenland/presets/reply-composer.css?url";

/**
 * SunkenLand widgets (`sk-*` custom elements) are browser-only, so this runs
 * client-side. The package embeds its own Vue, and each preset is imported as
 * a Vite asset URL so it stays versioned with the dependency; `public/stickers`
 * ships the reaction sticker set.
 *
 * The elements talk to Stargate directly and cannot read the Nitro session
 * cookie, so `getAccessToken` hands them the signed-in user's Solar token
 * (served by `/api/sn/token`). That drives the widgets' signed-in state — the
 * reply composer posts as the user, the reaction list highlights their own
 * reactions — without a second Solarpass sign-in on top of better-auth.
 * Guests get `null` and see the widgets' signed-out states.
 */
export default defineNuxtPlugin(() => {
  const { public: config } = useRuntimeConfig();

  configure({
    baseUrl: config.apiBaseUrl,
    css: [repliesList, login, replyComposer, reactions, post, media],
    stickerUrl: "/stickers/{symbol}.webp",
    getAccessToken: async () => {
      try {
        const { token } = await $fetch<{ token: string | null }>("/api/sn/token");
        return token;
      } catch {
        return null;
      }
    },
  });
});
