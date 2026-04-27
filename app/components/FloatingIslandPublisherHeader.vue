<template>
  <header class="app-panel relative overflow-hidden p-5 sm:p-6">
    <div
      class="pointer-events-none absolute inset-0 opacity-60"
      :style="bannerStyle"
      aria-hidden="true"
    />

    <div class="relative z-10">
      <p class="text-xs font-semibold tracking-[0.18em] text-primary/80 uppercase">FloatingIsland</p>

      <div class="mt-3 flex items-start gap-3 sm:gap-4">
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300/60 bg-base-100/80 sm:h-14 sm:w-14">
          <img
            v-if="publisherPictureUrl"
            :src="publisherPictureUrl"
            :alt="displayName"
            class="h-full w-full object-cover"
            loading="lazy"
          >
          <span v-else class="text-sm font-bold text-base-content/75">{{ initials }}</span>
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{{ sectionTitle }}</h1>
            <span v-if="publisher?.verification?.title" class="badge badge-soft badge-primary gap-1">
              <BadgeCheck class="h-3.5 w-3.5" />
              {{ publisher.verification.title }}
            </span>
          </div>

          <p class="mt-1 text-sm text-base-content/70">
            <span class="font-medium text-base-content/85">{{ displayName }}</span>
            <span class="mx-1 opacity-40">/</span>
            <span>@{{ publisherName }}</span>
          </p>

          <p class="mt-2 text-sm leading-6 text-base-content/80">
            {{ sectionDescription }}
          </p>

          <p v-if="publisher?.bio" class="mt-2 line-clamp-2 text-sm leading-6 text-base-content/70">
            {{ publisher.bio }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { BadgeCheck } from "lucide-vue-next";
import type { Publisher } from "~/types/publisher";

const props = defineProps<{
  publisherName: string;
  sectionTitle: string;
  sectionDescription: string;
}>();

const config = useRuntimeConfig();

const { data: publisher } = await useFetch<Publisher>(
  () => `/api/publishers/${props.publisherName}`,
  {
    watch: [() => props.publisherName],
  },
);

const displayName = computed(() => publisher.value?.nick || publisher.value?.name || props.publisherName);

const initials = computed(() => {
  return displayName.value.slice(0, 2).toUpperCase();
});

const publisherPictureUrl = computed(() => {
  const pic = publisher.value?.picture;
  if (!pic?.id) return null;
  return pic.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`;
});

const publisherBackgroundUrl = computed(() => {
  const bg = publisher.value?.background;
  if (!bg?.id) return null;
  return bg.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`;
});

const bannerStyle = computed(() => {
  const image = publisherBackgroundUrl.value
    ? `linear-gradient(110deg, rgba(10, 15, 22, 0.35), rgba(10, 15, 22, 0.18)), url(${publisherBackgroundUrl.value})`
    : "radial-gradient(circle at 15% 15%, color-mix(in oklab, var(--color-primary) 30%, transparent), transparent 45%), radial-gradient(circle at 85% 10%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 50%)";
  return {
    backgroundImage: image,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
});
</script>
