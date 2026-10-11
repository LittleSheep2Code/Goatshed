<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";
import {
  OG,
  OG_FRAME,
  OG_SITE_NAME,
  OG_SITE_URL,
  ogFit,
  ogFitDisplay,
} from "./og-data";

const {
  title = OG_SITE_NAME,
  description = "",
  eyebrow = "",
} = defineProps<{
  /** Card headline. Site name when a page passes nothing. */
  title?: string;
  description?: string;
  /** Small kicker above the headline naming the section, e.g. `关于`. */
  eyebrow?: string;
}>();

const display = computed(() => ogFitDisplay(title, OG_FRAME.copyWide));
const lede = computed(() =>
  ogFit(description, OG_FRAME.copyWide, { fontSize: 25 }),
);
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
          maxWidth: `${OG_FRAME.copyWide}px`,
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
          <span :style="{ color: OG.blue, fontWeight: 600 }">{{ OG_SITE_URL }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
