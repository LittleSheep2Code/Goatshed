<script setup lang="ts">
import {
  OG,
  OG_SITE_NAME,
  OG_SITE_TAGLINE,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDriveUrl,
  ogFetchCollection,
  ogPlainText,
  ogTruncate,
} from "./og-data";

const { pub, slug } = defineProps<{
  /** Publisher segment of the route, e.g. `littlesheep`. */
  pub: string;
  /** Collection slug as it appears in the route, e.g. `devlog`. */
  slug: string;
}>();

const apiBaseUrl = ogApiBaseUrl();

/*
  Collections are public upstream, but a locked publisher still answers 401 to
  an anonymous read, so the card falls back to the slug it was addressed by.
*/
const collection = await ogFetchCollection(apiBaseUrl, pub, slug);

const title = computed(
  () => collection?.name?.trim() || collection?.slug || slug || OG_SITE_NAME,
);

const lede = computed(
  () =>
    ogTruncate(ogPlainText(collection?.description), 90) ||
    (collection ? "" : OG_SITE_TAGLINE),
);

/* The copy column holds ~660px, about 14 glyphs at 50px. */
const titleSize = computed(() => {
  const length = title.value.length;
  if (length > 30) return 40;
  if (length > 18) return 46;
  return 52;
});

const authorName = computed(
  () => collection?.publisher?.nick || collection?.publisher?.name || pub,
);

const authorInitial = computed(() => authorName.value.slice(0, 2).toUpperCase());

const avatarUrl = computed(() =>
  ogDriveUrl(collection?.publisher?.picture, apiBaseUrl, 120, 120),
);

const artUrl = computed(() =>
  ogDriveUrl(collection?.background ?? collection?.icon, apiBaseUrl, 400, 630),
);
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: OG.base,
      fontFamily: OG.font,
      color: OG.ink,
    }"
  >
    <div
      style="position: absolute; inset: 0; background-image: radial-gradient(rgba(17, 88, 209, 0.14) 1px, transparent 1px); background-size: 28px 28px"
    />

    <div
      style="position: relative; display: flex; flex-direction: column; justify-content: space-between; flex: 1; min-width: 0; height: 100%; padding: 60px 0 68px 72px"
    >
      <div style="display: flex; align-items: center">
        <img
          src="/og-logo.png"
          alt=""
          style="width: 52px; height: 52px; border-radius: 15px; object-fit: cover"
        />
        <span style="margin-left: 16px; font-size: 26px; font-weight: 800">
          Goatshed
        </span>
        <span
          style="margin-left: 18px; font-size: 22px; font-weight: 600; color: #6f6f77"
        >
          collection
        </span>
      </div>

      <div style="display: flex; flex-direction: column; max-width: 660px">
        <span
          style="align-self: flex-start; margin-bottom: 20px; padding: 8px 20px; border-radius: 999px; background-color: rgba(17, 88, 209, 0.1); color: #1158d1; font-size: 21px; font-weight: 700"
        >
          合集
        </span>

        <span
          :style="{
            fontSize: `${titleSize}px`,
            fontWeight: 800,
            lineHeight: 1.16,
            letterSpacing: '-1.2px',
          }"
        >
          {{ title }}
        </span>

        <span
          v-if="lede"
          style="margin-top: 20px; font-size: 26px; font-weight: 400; line-height: 1.5; color: #55555c"
        >
          {{ lede }}
        </span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
          <div
            style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 28px; overflow: hidden; background: linear-gradient(135deg, #1158d1 0%, #0f8ad6 100%)"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt=""
              style="width: 100%; height: 100%; object-fit: cover"
            />
            <span v-else style="font-size: 22px; font-weight: 800; color: #f8fbff">
              {{ authorInitial || "GS" }}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; margin-left: 16px">
            <span style="font-size: 26px; font-weight: 700">
              {{ authorName }}
            </span>
            <span style="font-size: 20px; font-weight: 600; color: #6f6f77">
              {{ OG_SITE_URL }}
            </span>
          </div>
        </div>
        <span
          style="margin-right: 40px; font-size: 20px; font-weight: 600; color: #6f6f77"
        >
          Solar Network
        </span>
      </div>
    </div>

    <div style="position: relative; display: flex; width: 400px; height: 100%">
      <img
        v-if="artUrl"
        :src="artUrl"
        alt=""
        style="width: 400px; height: 630px; object-fit: cover"
      />
      <div
        v-else
        style="display: flex; align-items: center; justify-content: center; width: 400px; height: 630px; background: linear-gradient(160deg, rgba(17, 88, 209, 0.16) 0%, rgba(15, 138, 214, 0.06) 60%, rgba(240, 240, 240, 0) 100%)"
      >
        <img
          src="/og-logo.png"
          alt=""
          style="width: 220px; height: 220px; border-radius: 56px; object-fit: cover; opacity: 0.18"
        />
      </div>
    </div>

    <div
      style="position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #1158d1 0%, #3e78d8 45%, #0f8ad6 100%)"
    />
  </div>
</template>
