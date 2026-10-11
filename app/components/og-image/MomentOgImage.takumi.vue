<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";
import {
  OG,
  OG_FRAME,
  OG_SITE_TAGLINE,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDate,
  ogDriveUrl,
  ogFetchPost,
  ogFitDisplay,
  ogImageAttachment,
  ogPlainText,
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

const body = computed(
  () =>
    ogPlainText(post?.content) ||
    ogPlainText(post?.description) ||
    (post ? "" : OG_SITE_TAGLINE),
);

/* The plate halves the column, so the excerpt gives ground accordingly. */
const plateUrl = computed(() =>
  ogDriveUrl(ogImageAttachment(post), apiBaseUrl, 688, 688),
);

const columnPx = computed(() =>
  plateUrl.value ? OG_FRAME.copyNarrow : OG_FRAME.copyWide,
);

/* Prose, not a headline: a wider size ladder and room for four lines. */
const display = computed(() =>
  ogFitDisplay(body.value, columnPx.value, {
    maxLines: 4,
    sizes: [40, 34, 30],
  }),
);

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
          日常
        </span>

        <span
          :style="{
            fontSize: `${display.size}px`,
            fontWeight: 600,
            lineHeight: 1.62,
          }"
        >
          {{ display.text }}
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
