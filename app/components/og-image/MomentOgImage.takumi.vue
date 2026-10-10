<script setup lang="ts">
import {
  OG,
  OG_SITE_NAME,
  OG_SITE_TAGLINE,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDate,
  ogDriveUrl,
  ogFetchPost,
  ogImageAttachment,
  ogPlainText,
  ogTruncate,
} from "./og-data";

const { pub, slug } = defineProps<{
  /** Publisher segment of the route, e.g. `littlesheep0v0`. */
  pub: string;
  /** Slug or id segment of the route. */
  slug: string;
}>();

const apiBaseUrl = ogApiBaseUrl();

/*
  A moment is a Solar Network post with `type: 0`; the same endpoint serves
  both, and an anonymous read of a locked publisher simply comes back empty.
*/
const post = await ogFetchPost(apiBaseUrl, pub, slug);

const authorName = computed(
  () => post?.publisher?.nick || post?.publisher?.name || "",
);

const body = computed(() =>
  ogTruncate(
    ogPlainText(post?.content) || ogPlainText(post?.description),
    post?.attachments?.length ? 90 : 160,
  ) || (post ? "" : OG_SITE_TAGLINE),
);

/* Roughly 19 glyphs per line at 34px across the 660px text column. */
const bodySize = computed(() => (body.value.length > 72 ? 30 : 34));

const mediaUrl = computed(() =>
  ogDriveUrl(ogImageAttachment(post), apiBaseUrl, 920, 1260),
);

const avatarUrl = computed(() =>
  ogDriveUrl(post?.publisher?.picture, apiBaseUrl, 120, 120),
);

const authorInitial = computed(() => authorName.value.slice(0, 2).toUpperCase());

const publishedAt = computed(() => ogDate(post?.published_at));
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
      style="position: absolute; inset: 0; background-image: radial-gradient(rgba(15, 138, 214, 0.16) 1px, transparent 1px); background-size: 26px 26px"
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
        <span style="margin-left: 18px; font-size: 22px; font-weight: 600; color: #0f8ad6">
          moment
        </span>
      </div>

      <!-- The quote rule mirrors the moment page's left-accent styling. -->
      <div style="display: flex; align-items: flex-start; max-width: 660px">
        <span
          style="width: 6px; align-self: stretch; border-radius: 3px; background: linear-gradient(180deg, #1158d1 0%, #0f8ad6 100%)"
        />
        <span
          :style="{
            marginLeft: '26px',
            fontSize: `${bodySize}px`,
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '-0.4px',
          }"
        >
          {{ body }}
        </span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
          <div
            style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 28px; overflow: hidden; background: linear-gradient(135deg, #0f8ad6 0%, #1158d1 100%)"
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
              {{ authorName || "littlesheep" }}
            </span>
            <span style="font-size: 20px; font-weight: 600; color: #6f6f77">
              {{ publishedAt || OG_SITE_URL }}
            </span>
          </div>
        </div>
        <span style="margin-right: 40px; font-size: 20px; font-weight: 600; color: #6f6f77">
          {{ OG_SITE_NAME }}
        </span>
      </div>
    </div>

    <div style="position: relative; display: flex; width: 400px; height: 100%">
      <img
        v-if="mediaUrl"
        :src="mediaUrl"
        alt=""
        style="width: 400px; height: 630px; object-fit: cover"
      />
      <div
        v-else
        style="display: flex; align-items: center; justify-content: center; width: 400px; height: 630px; background: linear-gradient(160deg, rgba(15, 138, 214, 0.18) 0%, rgba(17, 88, 209, 0.06) 60%, rgba(240, 240, 240, 0) 100%)"
      >
        <img
          src="/og-logo.png"
          alt=""
          style="width: 220px; height: 220px; border-radius: 56px; object-fit: cover; opacity: 0.18"
        />
      </div>
    </div>

    <div
      style="position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #0f8ad6 0%, #3e78d8 55%, #1158d1 100%)"
    />
  </div>
</template>
