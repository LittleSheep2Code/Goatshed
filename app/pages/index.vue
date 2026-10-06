<template>
  <main class="relative min-w-0">
    <CoverHero
      id="hero"
      class="cover-under-app-bar"
      :image="publisherBackgroundUrl"
      :blurhash="publisherBackgroundBlurhash"
    >
      <div
        class="page-shell flex min-h-[60dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[70dvh] sm:pb-28 sm:pt-14"
      >
        <ShellBreadcrumb no-link class="self-start" :path="`/blog/${activePub}`" />

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
          <PublisherSidebar
            v-if="showSidebar"
            :publisher-name="activePub"
            class="min-w-0 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:pt-24 lg:pb-6"
            @change="setPublisher"
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
                :to="`/posts/${activePub}`"
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
import BrandingRegular from "~/assets/branding/regular.png";

import { ArrowRight, Rss, Sparkles } from "lucide-vue-next";
import {
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import type { Post } from "~/types/post";
import type { Publisher } from "~/types/publisher";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const introCode: string = `while (活着) {
  吃饭(); 上学(); 编程(); 睡觉();
}`;

const activePub = ref<PublisherName>(
  typeof route.query.pub === "string" && isPublisherName(route.query.pub)
    ? route.query.pub
    : "littlesheep",
);

const { data: publishersData } = await useFetch<
  Record<string, Publisher | null>
>("/api/publishers");

const publisherBackgroundUrl = computed(() => {
  const background = publishersData.value?.[activePub.value]?.background;
  if (!background?.id) return null;
  return (
    background.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(background.id)}`
  );
});

const publisherBackgroundBlurhash = computed(
  () => publishersData.value?.[activePub.value]?.background?.blurhash || null,
);

const {
  data: recentResponse,
  pending: loading,
  error,
} = await useAsyncData(
  "posts-home",
  () =>
    $fetch<{ posts: Post[]; total: number }>("/api/posts", {
      query: { pub: activePub.value, type: 1, take: 6, offset: 0 },
    }),
  {
    watch: [activePub],
    default: () => ({ posts: [], total: 0 }),
  },
);

const recentPosts = computed(() => recentResponse.value?.posts ?? []);
const total = computed(() => recentResponse.value?.total ?? 0);

const { data: pinnedPostsData } = await useFetch<Post[]>(
  () => `/api/publishers/${activePub.value}/pinned`,
  {
    default: () => [],
    watch: [activePub],
  },
);

const pinnedPosts = computed(() => pinnedPostsData.value ?? []);

const pinnedIds = computed(
  () => new Set(pinnedPosts.value.map((post) => post.id)),
);

const recentCards = computed(() =>
  recentPosts.value.filter((post) => !pinnedIds.value.has(post.id)),
);

const showSidebar = computed(() => true);

async function setPublisher(next: PublisherName) {
  activePub.value = next;
  await router.replace({ query: { ...route.query, pub: next } });
}

watch(
  () => route.query.pub,
  (value) => {
    if (
      typeof value === "string" &&
      isPublisherName(value) &&
      value !== activePub.value
    ) {
      activePub.value = value;
    }
  },
);

useHead({
  title: "博客",
  meta: [
    {
      name: "description",
      content:
        "浏览 littlesheep 的技术博客文章，记录 Web 开发、软件架构与技术思考。",
    },
    { property: "og:title", content: "博客 - Goatshed" },
    {
      property: "og:description",
      content:
        "浏览 littlesheep 的技术博客文章，记录 Web 开发、软件架构与技术思考。",
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
