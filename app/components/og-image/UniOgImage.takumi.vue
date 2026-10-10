<script setup lang="ts">
import { OG, OG_SITE_NAME, OG_SITE_URL, ogTruncate } from "./og-data";

const {
  title = OG_SITE_NAME,
  description = "",
  eyebrow = "",
  backgroundImage,
} = defineProps<{
  /** Card headline. Site name when a page passes nothing. */
  title?: string;
  description?: string;
  /** Small kicker above the headline, e.g. `文章` or `日常`. */
  eyebrow?: string;
  /** Local path or URL painted under the dot grid at low opacity. */
  backgroundImage?: string;
}>();

/*
  CJK titles are wide, so the headline steps down instead of clipping: the
  1200px canvas leaves ~1056px of column, which is about 15 glyphs at 68px.
*/
const titleSize = computed(() => {
  const length = (title || "").length;
  if (length > 44) return 46;
  if (length > 26) return 56;
  return 68;
});

const lede = computed(() => ogTruncate(description || "", 84));
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
    <img
      v-if="backgroundImage"
      :src="backgroundImage"
      alt=""
      style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.12"
    />
    <div
      style="position: absolute; inset: 0; background-image: radial-gradient(rgba(17, 88, 209, 0.14) 1px, transparent 1px); background-size: 28px 28px"
    />
    <div
      style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(17, 88, 209, 0.1) 0%, rgba(15, 138, 214, 0.04) 42%, rgba(240, 240, 240, 0) 68%)"
    />

    <div
      style="position: relative; display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 100%; padding: 64px 72px 72px 72px"
    >
      <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
          <img
            src="/og-logo.png"
            alt=""
            style="width: 64px; height: 64px; border-radius: 18px; object-fit: cover"
          />
          <div style="display: flex; flex-direction: column; margin-left: 20px">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: -0.5px">
              Goatshed
            </span>
            <span style="font-size: 20px; font-weight: 400; color: #6f6f77">
              山羊寒舍
            </span>
          </div>
        </div>
        <span style="font-size: 22px; font-weight: 600; color: #6f6f77">
          {{ OG_SITE_URL }}
        </span>
      </div>

      <div style="display: flex; flex-direction: column; max-width: 1000px">
        <span
          v-if="eyebrow"
          style="align-self: flex-start; margin-bottom: 24px; padding: 10px 22px; border-radius: 999px; background-color: rgba(17, 88, 209, 0.1); color: #1158d1; font-size: 22px; font-weight: 700"
        >
          {{ eyebrow }}
        </span>
        <span
          :style="{
            fontSize: `${titleSize}px`,
            fontWeight: 800,
            lineHeight: 1.14,
            letterSpacing: '-1.5px',
          }"
        >
          {{ title }}
        </span>
        <span
          v-if="lede"
          style="margin-top: 22px; font-size: 28px; font-weight: 400; line-height: 1.5; color: #55555c"
        >
          {{ lede }}
        </span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 20px; font-weight: 600; color: #6f6f77">
          Solar Network · littlesheep
        </span>
        <span style="display: flex; align-items: center">
          <span
            style="width: 8px; height: 8px; border-radius: 4px; background-color: #0f8ad6"
          />
          <span style="margin-left: 10px; font-size: 20px; font-weight: 600; color: #6f6f77">
            技术 · 生活 · 碎碎念
          </span>
        </span>
      </div>
    </div>

    <div
      style="position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #1158d1 0%, #3e78d8 45%, #0f8ad6 100%)"
    />
  </div>
</template>
