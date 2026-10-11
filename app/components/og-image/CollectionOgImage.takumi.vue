<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";
import {
  OG,
  OG_FRAME,
  OG_SITE_NAME,
  OG_SITE_TAGLINE,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDriveUrl,
  ogFetchCollection,
  ogFit,
  ogFitDisplay,
  ogPlainText,
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

const artUrl = computed(() =>
  ogDriveUrl(collection?.background ?? collection?.icon, apiBaseUrl, 688, 688),
);

const columnPx = computed(() =>
  artUrl.value ? OG_FRAME.copyNarrow : OG_FRAME.copyWide,
);

const lede = computed(
  () =>
    ogFit(ogPlainText(collection?.description), columnPx.value, {
      fontSize: 25,
    }) || (collection ? "" : OG_SITE_TAGLINE),
);

const authorName = computed(
  () => collection?.publisher?.nick || collection?.publisher?.name || pub,
);

const display = computed(() => ogFitDisplay(title.value, columnPx.value));
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
      v-if="artUrl"
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
      <img :src="artUrl" alt="" style="width: 100%; height: 100%; object-fit: cover" />
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
          合集
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
          <span v-if="authorName">{{ authorName }} · </span>
          <span :style="{ color: OG.blue, fontWeight: 600 }">{{ OG_SITE_URL }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
