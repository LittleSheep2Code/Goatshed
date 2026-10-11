<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";
import {
  OG,
  OG_FRAME,
  OG_SITE_NAME,
  OG_SITE_TAGLINE,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDate,
  ogDriveUrl,
  ogFetchPost,
  ogFit,
  ogFitDisplay,
  ogImageAttachment,
  ogPlainText,
} from "./og-data";

const {
  pub,
  slug,
  title: fallbackTitle,
} = defineProps<{
  /** Publisher segment of the route, e.g. `littlesheep`. */
  pub: string;
  /** Slug or id segment of the route. */
  slug: string;
  /**
   * Headline to show when the post cannot be read anonymously — a locked
   * (`littlesheepuwu`) post returns 401, so pass nothing to keep it private.
   */
  title?: string;
}>();

const apiBaseUrl = ogApiBaseUrl();

const post = await ogFetchPost(apiBaseUrl, pub, slug);

const title = computed(() => post?.title || fallbackTitle || OG_SITE_NAME);

const artwork = computed(() => post?.picture ?? ogImageAttachment(post));

/* A plate halves the copy column, so both the lede and the headline follow it. */
const plateUrl = computed(() => ogDriveUrl(artwork.value, apiBaseUrl, 688, 688));

const columnPx = computed(() =>
  plateUrl.value ? OG_FRAME.copyNarrow : OG_FRAME.copyWide,
);

const lede = computed(
  () =>
    ogFit(
      ogPlainText(post?.description) || ogPlainText(post?.content),
      columnPx.value,
      { fontSize: 25 },
    ) || (post ? "" : OG_SITE_TAGLINE),
);

const display = computed(() => ogFitDisplay(title.value, columnPx.value));

const byline = computed(() => {
  const author = post?.publisher?.nick || post?.publisher?.name;
  return [author, ogDate(post?.published_at)].filter(Boolean).join(" · ");
});
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      position: 'relative',
      backgroundColor: OG.paper,
      fontFamily: OG.font,
      color: OG.ink,
    }"
  >
    <img
      :src="BrandingCompact"
      alt=""
      :style="{
        position: 'absolute',
        top: `${OG_FRAME.margin}px`,
        left: `${OG_FRAME.margin}px`,
        width: `${OG_FRAME.lockupWidth}px`,
        height: `${OG_FRAME.lockupHeight}px`,
        objectFit: 'contain',
      }"
    />

    <div
      v-if="plateUrl"
      :style="{
        position: 'absolute',
        top: `${OG_FRAME.margin}px`,
        right: `${OG_FRAME.margin}px`,
        width: `${OG_FRAME.plate}px`,
        height: `${OG_FRAME.plate}px`,
        border: `1px solid ${OG.rule}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }"
    >
      <img
        :src="plateUrl"
        alt=""
        style="width: 100%; height: 100%; object-fit: cover"
      />
    </div>

    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: `${OG_FRAME.margin}px`,
      }"
    >
      <div :style="{ height: `${OG_FRAME.lockupHeight}px`, flexShrink: 0 }" />

      <div
        :style="{
          display: 'flex',
          flexDirection: 'column',
          marginTop: `${OG_FRAME.copyTop}px`,
          maxWidth: `${columnPx}px`,
          flexShrink: 0,
        }"
      >
        <span
          :style="{
            marginBottom: '26px',
            fontSize: '20px',
            fontWeight: 500,
            letterSpacing: '3px',
            color: OG.graphite,
          }"
        >
          文章
        </span>

        <span
          :style="{
            fontSize: `${display.size}px`,
            fontWeight: 700,
            lineHeight: 1.34,
          }"
        >
          {{ display.text }}
        </span>

        <span
          v-if="lede"
          :style="{
            marginTop: '22px',
            fontSize: '25px',
            fontWeight: 400,
            lineHeight: 1.62,
            color: OG.inkSoft,
          }"
        >
          {{ lede }}
        </span>
      </div>

      <div style="display: flex; flex-direction: column; marginTop: auto">
        <div :style="{ height: '1px', backgroundColor: OG.rule }" />
        <span
          :style="{
            marginTop: '22px',
            fontSize: '20px',
            fontWeight: 500,
            color: OG.graphite,
          }"
        >
          <span v-if="byline">{{ byline }} · </span>
          <span :style="{ color: OG.blue, fontWeight: 600 }">{{ OG_SITE_URL }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
