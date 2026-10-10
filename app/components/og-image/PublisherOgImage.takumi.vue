<script setup lang="ts">
import {
  OG,
  OG_SITE_NAME,
  OG_SITE_URL,
  ogApiBaseUrl,
  ogDriveUrl,
  ogFetchSolar,
  ogPlainText,
  ogTruncate,
  type OgPublisher,
} from "./og-data";

const { name, eyebrow = "" } = defineProps<{
  /** Publisher name as it appears in the route, e.g. `littlesheep`. */
  name: string;
  /** Small kicker pill, e.g. `文章` or `日常`. */
  eyebrow?: string;
}>();

const apiBaseUrl = ogApiBaseUrl();

const publisher = await ogFetchSolar<OgPublisher>(
  apiBaseUrl,
  `/sphere/publishers/${encodeURIComponent(name)}`,
);

/* A profile that failed to load still has the route's name to show. */
const nick = computed(() => publisher?.nick || name);
const bio = computed(() => ogTruncate(ogPlainText(publisher?.bio), 96));
const verification = computed(() => publisher?.verification?.title || "");

const avatarUrl = computed(() =>
  ogDriveUrl(publisher?.picture, apiBaseUrl, 440, 440),
);

const initial = computed(() => nick.value.slice(0, 2).toUpperCase());
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
      style="position: absolute; inset: 0; background-image: radial-gradient(rgba(117, 119, 186, 0.22) 1px, transparent 1px); background-size: 28px 28px"
    />
    <div
      style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(17, 88, 209, 0.1) 0%, rgba(117, 119, 186, 0.06) 45%, rgba(240, 240, 240, 0) 72%)"
    />

    <div
      style="position: relative; display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 100%; padding: 64px 72px 72px 72px"
    >
      <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
          <img
            src="/og-logo.png"
            alt=""
            style="width: 56px; height: 56px; border-radius: 16px; object-fit: cover"
          />
          <span style="margin-left: 16px; font-size: 26px; font-weight: 800">
            Goatshed
          </span>
        </div>
        <span style="font-size: 22px; font-weight: 600; color: #6f6f77">
          {{ OG_SITE_URL }}
        </span>
      </div>

      <div style="display: flex; align-items: center">
        <div
          style="display: flex; align-items: center; justify-content: center; width: 180px; height: 180px; border-radius: 44px; overflow: hidden; background: linear-gradient(135deg, #1158d1 0%, #0f8ad6 100%)"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt=""
            style="width: 100%; height: 100%; object-fit: cover"
          />
          <span v-else style="font-size: 64px; font-weight: 800; color: #f8fbff">
            {{ initial }}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; margin-left: 44px">
          <span
            v-if="eyebrow"
            style="align-self: flex-start; margin-bottom: 18px; padding: 8px 20px; border-radius: 999px; background-color: rgba(17, 88, 209, 0.1); color: #1158d1; font-size: 21px; font-weight: 700"
          >
            {{ eyebrow }}
          </span>
          <span style="font-size: 66px; font-weight: 800; line-height: 1.1; letter-spacing: -1.5px">
            {{ nick }}
          </span>
          <span style="margin-top: 12px; font-size: 24px; font-weight: 600; color: #6f6f77">
            @{{ name }}
          </span>
          <span
            v-if="bio"
            style="margin-top: 18px; max-width: 820px; font-size: 24px; font-weight: 400; line-height: 1.5; color: #55555c"
          >
            {{ bio }}
          </span>
          <span
            v-if="verification"
            style="align-self: flex-start; margin-top: 18px; padding: 8px 18px; border-radius: 999px; background-color: rgba(47, 143, 91, 0.12); color: #2f8f5b; font-size: 20px; font-weight: 700"
          >
            {{ verification }}
          </span>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 20px; font-weight: 600; color: #6f6f77">
          {{ OG_SITE_NAME }}
        </span>
        <span style="font-size: 20px; font-weight: 600; color: #6f6f77">
          Solar Network
        </span>
      </div>
    </div>

    <div
      style="position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #1158d1 0%, #3e78d8 45%, #0f8ad6 100%)"
    />
  </div>
</template>
