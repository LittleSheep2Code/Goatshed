<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";
import {
  OG,
  OG_FRAME,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDriveUrl,
  ogFetchSolar,
  ogFit,
  ogFitDisplay,
  ogPlainText,
  type OgPublisher,
} from "./og-data";

const { name, eyebrow = "" } = defineProps<{
  /** Publisher name as it appears in the route, e.g. `littlesheep`. */
  name: string;
  /** Small kicker naming what the page lists, e.g. `文章` or `日常`. */
  eyebrow?: string;
}>();

const apiBaseUrl = ogApiBaseUrl();

const publisher = await ogFetchSolar<OgPublisher>(
  apiBaseUrl,
  `/sphere/publishers/${encodeURIComponent(name)}`,
);

/* A profile that failed to load still has the route's name to show. */
const nick = computed(() => publisher?.nick || name);

const portraitUrl = computed(() =>
  ogDriveUrl(publisher?.picture, apiBaseUrl, 576, 576),
);

const columnPx = computed(() =>
  portraitUrl.value ? OG_FRAME.copyNarrow : OG_FRAME.copyWide,
);

const bio = computed(() =>
  ogFit(ogPlainText(publisher?.bio), columnPx.value, { fontSize: 24 }),
);

const display = computed(() =>
  ogFitDisplay(nick.value, columnPx.value, { sizes: [56, 46, 38] }),
);

const handle = computed(() => `@${publisher?.name || name}`);
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
      v-if="portraitUrl"
      :style="{
        position: 'absolute',
        top: `${OG_FRAME.margin}px`,
        right: `${OG_FRAME.margin}px`,
        width: `${OG_FRAME.portrait}px`,
        height: `${OG_FRAME.portrait}px`,
        border: `1px solid ${OG.rule}`,
        borderRadius: `${OG_FRAME.portrait / 2}px`,
        overflow: 'hidden',
      }"
    >
      <img
        :src="portraitUrl"
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
          v-if="eyebrow"
          :style="{
            marginBottom: '26px',
            fontSize: '20px',
            fontWeight: 500,
            letterSpacing: '3px',
            color: OG.graphite,
          }"
        >
          {{ eyebrow }}
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
          :style="{
            marginTop: '18px',
            fontSize: '22px',
            fontWeight: 500,
            color: OG.graphite,
          }"
        >
          {{ handle }}
        </span>

        <span
          v-if="bio"
          :style="{
            marginTop: '22px',
            fontSize: '24px',
            fontWeight: 400,
            lineHeight: 1.62,
            color: OG.inkSoft,
          }"
        >
          {{ bio }}
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
          <span :style="{ color: OG.blue, fontWeight: 600 }">{{ OG_SITE_URL }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
