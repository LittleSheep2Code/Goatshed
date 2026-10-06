<template>
  <main class="relative min-w-0">
    <CoverHero
      id="hero"
      class="cover-under-app-bar"
      :image="publisherBackgroundUrl"
      :blurhash="publisherBackgroundBlurhash"
    >
      <div
        class="flex min-h-[60dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[70dvh] sm:pb-28 sm:pt-14"
      >
        <ShellBreadcrumb no-link class="self-start" path="/blog" />

        <h1
          class="hero-title mb-3 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Goatshed
          <a
            href="/rss.xml"
            class="ml-1 inline-block align-middle"
            aria-label="RSS feed"
            title="RSS feed"
          >
            <Rss
              class="h-5 w-5 opacity-40 transition-opacity duration-300 hover:opacity-100"
            />
          </a>
        </h1>

        <CodeBlock
          :code="introCode"
          lang="cpp"
          container-class="max-w-xl opacity-75 sm:text-lg"
        />
      </div>
    </CoverHero>

    <section v-if="loading" class="page-shell flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="page-shell py-8">
      <div class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </section>

    <section v-else class="page-shell py-8">
      <section id="recent-posts" class="pb-6">
        <div class="grid min-w-0 gap-5 lg:grid-cols-[19rem_1fr]">
          <AuthorSidebar
            class="min-w-0 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:pt-24 lg:pb-6"
          />

          <div class="min-w-0 space-y-4">
            <template v-if="pinnedPosts.length">
              <div class="flex items-center gap-3 pt-1">
                <h2
                  class="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary"
                >
                  <Sparkles class="h-4 w-4" />
                  精选
                </h2>
                <div class="h-px flex-1 bg-base-300/50" />
              </div>

              <PostCard
                v-for="(post, index) in pinnedPosts"
                :key="post.id"
                :post="post"
                :index="index"
              />
            </template>

            <div class="flex items-center gap-3 pt-3">
              <h2 class="text-sm font-bold uppercase tracking-widest">最新</h2>
              <div class="h-px flex-1 bg-base-300/50" />
              <span class="select-none text-xs text-primary/50"
                >[{{ recentCards.length }}/{{ total }}]</span
              >
            </div>

            <PostCard
              v-for="(post, index) in recentCards"
              :key="post.id"
              :post="post"
              :index="pinnedPosts.length + index"
            />

            <div class="mb-4 mt-8 flex w-full justify-center">
              <NuxtLink
                :to="`/posts/${OWNER_PUBLISHER}`"
                class="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-8 py-4 text-base font-bold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/20 sm:w-auto"
              >
                浏览全部文章
                <ArrowRight
                  class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowRight, Rss, Sparkles } from "lucide-vue-next";
import { OWNER_PUBLISHER } from "~/constants/publishers";
import type { Post } from "~/types/post";
import type { Publisher } from "~/types/publisher";

const config = useRuntimeConfig();

const introCode = `while (活着) {
  吃饭(); 上学(); 编程(); 睡觉();
}`;

const { data: publishersData } = await useFetch<
  Record<string, Publisher | null>
>("/api/publishers");

const publisherBackgroundUrl = computed(() => {
  const background = publishersData.value?.[OWNER_PUBLISHER]?.background;
  if (!background?.id) return null;
  return (
    background.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(background.id)}`
  );
});

const publisherBackgroundBlurhash = computed(
  () => publishersData.value?.[OWNER_PUBLISHER]?.background?.blurhash || null,
);

// Omitting `pub` lets the API aggregate every publisher the blog knows about.
const {
  data: recentResponse,
  pending: loading,
  error,
} = await useAsyncData(
  "posts-home",
  () =>
    $fetch<{ posts: Post[]; total: number }>("/api/posts", {
      query: { type: 1, take: 6, offset: 0 },
    }),
  { default: () => ({ posts: [], total: 0 }) },
);

const recentPosts = computed(() => recentResponse.value?.posts ?? []);
const total = computed(() => recentResponse.value?.total ?? 0);

const { data: pinnedResponse } = await useAsyncData(
  "pinned-home",
  () =>
    $fetch<{ posts: Post[]; total: number }>("/api/posts", {
      query: { type: 1, take: 6, pinned: true },
    }),
  { default: () => ({ posts: [], total: 0 }) },
);

const pinnedPosts = computed(() => pinnedResponse.value?.posts ?? []);

const pinnedIds = computed(
  () => new Set(pinnedPosts.value.map((post) => post.id)),
);

const recentCards = computed(() =>
  recentPosts.value.filter((post) => !pinnedIds.value.has(post.id)),
);

useHead({
  title: "博客",
  meta: [
    {
      name: "description",
      content:
        "Goatshed 山羊寒舍：littlesheep 的博客，写代码、写 Solar Network，也写点日常碎碎念。",
    },
    { property: "og:title", content: "博客 - Goatshed" },
    {
      property: "og:description",
      content:
        "Goatshed 山羊寒舍：littlesheep 的博客，写代码、写 Solar Network，也写点日常碎碎念。",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://littlesheep.me" },
  ],
});
</script>

<style scoped>
.hero-title {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    color-mix(in oklab, var(--color-primary) 50%, var(--color-base-content)) 20%,
    var(--color-base-content) 35%,
    var(--color-base-content) 65%,
    color-mix(in oklab, var(--color-primary) 50%, var(--color-base-content)) 80%,
    var(--color-primary) 100%
  );
  background-size: 250% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 6s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}
</style>
