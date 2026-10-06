<template>
  <aside class="space-y-4 lg:pr-5">
    <div class="overflow-hidden p-4">
      <div v-if="pending" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md" />
      </div>

      <div v-else-if="owner" class="space-y-4">
        <div class="flex flex-col items-center gap-3 text-center">
          <div class="avatar">
            <div class="h-24 w-24 rounded-full bg-primary text-primary-content">
              <UnLazyImage
                v-if="pictureUrl"
                :key="pictureUrl"
                :src="pictureUrl"
                :alt="displayName"
                :blurhash="pictureBlurhash"
              />
              <span v-else class="text-3xl font-bold">{{ initials }}</span>
            </div>
          </div>

          <div class="min-w-0">
            <p
              class="flex items-center justify-center gap-1.5 text-lg font-bold"
            >
              {{ displayName }}
              <BadgeCheck
                v-if="owner.verification?.title"
                class="h-4 w-4 shrink-0 text-primary"
                :aria-label="owner.verification.title"
              />
            </p>
            <p class="truncate text-xs text-base-content/70">@{{ owner.name }}</p>
          </div>

          <p class="text-xs font-medium text-base-content/70">
            {{ OWNER_TAGLINE }}
          </p>
        </div>

        <p
          v-if="bioHtml"
          class="prose-goatshed prose-sm max-w-none text-sm leading-6 text-base-content/80 text-center"
          v-html="bioHtml"
        />

        <dl v-if="stats" class="grid grid-cols-3 gap-2">
          <div class="rounded-xl bg-base-200/50 px-3 py-2" title="已发布的内容数">
            <dt class="text-[11px] font-medium text-base-content/60">文章</dt>
            <dd class="mt-1 text-lg font-bold leading-none tabular-nums">
              {{ formatCount(stats.postsCount) }}
            </dd>
          </div>

          <div class="rounded-xl bg-base-200/50 px-3 py-2" title="已发布内容的词数（按空白分词）">
            <dt class="text-[11px] font-medium text-base-content/60">词数</dt>
            <dd class="mt-1 text-lg font-bold leading-none tabular-nums">
              {{ formatCount(stats.wordsCount) }}
            </dd>
          </div>

          <div class="rounded-xl bg-base-200/50 px-3 py-2" title="有发布记录的天数">
            <dt class="text-[11px] font-medium text-base-content/60">活跃</dt>
            <dd class="mt-1 text-lg font-bold leading-none tabular-nums">
              {{ formatCount(stats.daysPostedCount) }}d
            </dd>
          </div>
        </dl>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <NuxtLink
            to="/about"
            class="flex items-center justify-center gap-1.5 rounded-xl border border-base-300/50 bg-base-200/40 px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <Info class="h-3.5 w-3.5" aria-hidden="true" />
            关于我
          </NuxtLink>
          <NuxtLink
            :to="`/posts/${owner.name}`"
            class="flex items-center justify-center gap-1.5 rounded-xl border border-base-300/50 bg-base-200/40 px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <BookOpen class="h-3.5 w-3.5" aria-hidden="true" />
            文章
          </NuxtLink>
          <NuxtLink
            to="/moments/littlesheep0v0"
            class="flex items-center justify-center gap-1.5 rounded-xl border border-base-300/50 bg-base-200/40 px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <NotebookText class="h-3.5 w-3.5" aria-hidden="true" />
            动态
          </NuxtLink>
          <NuxtLink
            to="/donate"
            class="flex items-center justify-center gap-1.5 rounded-xl border border-base-300/50 bg-base-200/40 px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <Heart class="h-3.5 w-3.5" aria-hidden="true" />
            打赏
          </NuxtLink>
        </div>
      </div>

      <div v-else-if="error" class="text-sm text-error">加载博主信息失败。</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  BadgeCheck,
  BookOpen,
  Heart,
  Info,
  NotebookText,
} from "lucide-vue-next";
import { OWNER_PUBLISHER } from "~/constants/publishers";
import type { Publisher, PublisherStats } from "~/types/publisher";
import { renderMarkdown, withSoftBreaks } from "~/utils/markdown";
import { driveFileUrl } from "~/utils/media";
import { formatCount } from "~/utils/number";

/** One-line self-description, mirroring the /about hero. */
const OWNER_TAGLINE =
  "高级全干工程师 / 城市做题小家 / VOCALOID 品鉴者";

/** The owner's self-introduction post, linked from the about blurb. */
const SELF_INTRO_SLUG = "littlesheep-self-introduction";

const config = useRuntimeConfig();

const {
  data: owner,
  pending,
  error,
} = await useFetch<Publisher>(`/api/publishers/${OWNER_PUBLISHER}`);

const { data: stats } = await useFetch<PublisherStats | null>(
  `/api/publishers/${OWNER_PUBLISHER}/stats`,
  { default: () => null },
);

const displayName = computed(
  () => owner.value?.nick || owner.value?.name || OWNER_PUBLISHER,
);

const initials = computed(() => displayName.value.slice(0, 2).toUpperCase());

const pictureUrl = computed(() =>
  driveFileUrl(owner.value?.picture, config.public.apiBaseUrl),
);

const pictureBlurhash = computed(
  () => owner.value?.picture?.blurhash || undefined,
);

const { data: bioHtml } = await useAsyncData(
  "author-sidebar-bio",
  async () => {
    const bio = owner.value?.bio;
    return bio ? await renderMarkdown(withSoftBreaks(bio)) : "";
  },
  { default: () => "", watch: [() => owner.value?.bio] },
);
</script>

<style scoped>
@media (min-width: 1024px) {
  aside {
    background-image: linear-gradient(
      to bottom,
      transparent 0%,
      color-mix(in srgb, var(--color-base-300) 80%, transparent) 12%,
      color-mix(in srgb, var(--color-base-300) 80%, transparent) 88%,
      transparent 100%
    );
    background-size: 1px 100%;
    background-position: right center;
    background-repeat: no-repeat;
  }
}
</style>
