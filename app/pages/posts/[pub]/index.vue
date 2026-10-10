<template>
  <main class="page-shell relative min-w-0 pb-8">
    <CoverHero
      :image="publisherBackgroundUrl"
      :blurhash="publisherBackgroundBlurhash"
      class="cover-bleed cover-under-app-bar mb-6"
    >
      <div
        class="flex min-h-[46dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[54dvh] sm:pb-28 sm:pt-14"
      >
        <ShellBreadcrumb class="self-start" :path="`/posts/${activePub}`" />

        <h1 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          文章
        </h1>
        <p class="mt-2 text-sm text-base-content/75">
          按页浏览所选发布者的文章列表。
        </p>
      </div>
    </CoverHero>

    <section v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </section>

    <section v-else class="grid min-w-0 gap-5 lg:grid-cols-[19rem_1fr]">
      <PublisherSidebar
        :publisher-name="activePub"
        class="min-w-0 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:pt-24 lg:pb-6"
        @change="setPublisher"
      />

      <div class="min-w-0 space-y-4">
        <PostCard
          v-for="(post, index) in posts"
          :key="post.id"
          :post="post"
          :index="index"
        />

        <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            class="btn btn-sm btn-outline"
            :disabled="currentPage <= 0"
            @click="setPage(currentPage - 1)"
          >
            <ChevronLeft class="h-4 w-4" />
            上一页
          </button>

          <button
            v-for="n in visiblePages"
            :key="n"
            class="btn btn-sm"
            :class="n === currentPage ? 'btn-primary' : 'btn-ghost'"
            @click="setPage(n)"
          >
            {{ n }}
          </button>

          <button
            class="btn btn-sm btn-outline"
            :disabled="currentPage >= maxPage"
            @click="setPage(currentPage + 1)"
          >
            下一页
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import {
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import type { Post } from "~/types/post";
import type { Publisher } from "~/types/publisher";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const pageSize = 12;

const activePub = computed<PublisherName>(() => {
  const value = route.params.pub;
  return typeof value === "string" && isPublisherName(value)
    ? value
    : "littlesheep";
});

const currentPage = computed(() => {
  const raw = Number(route.query.page);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
});

defineOgImage("PublisherOgImage", {
  name: computed(() => activePub.value),
  eyebrow: "文章",
});

const { data, pending, error } = await useAsyncData(
  () => `posts-list-${activePub.value}-${currentPage.value}`,
  () =>
    $fetch<{ posts: Post[]; total: number }>("/api/posts", {
      query: {
        pub: activePub.value,
        type: 1,
        take: pageSize,
        offset: currentPage.value * pageSize,
      },
    }),
  {
    watch: [activePub, currentPage],
    default: () => ({ posts: [], total: 0 }),
  },
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

const posts = computed(() => data.value?.posts ?? []);

const total = computed(() => data.value?.total ?? 0);
const maxPage = computed(() =>
  Math.max(Math.ceil(total.value / pageSize) - 1, 0),
);

const visiblePages = computed(() => {
  const start = Math.max(currentPage.value - 2, 0);
  const end = Math.min(start + 4, maxPage.value);
  const first = Math.max(end - 4, 0);
  return Array.from({ length: end - first + 1 }, (_, i) => first + i);
});

async function setPublisher(next: PublisherName) {
  await router.push(`/posts/${next}`);
}

async function setPage(next: number) {
  const page = Math.min(Math.max(next, 0), maxPage.value);
  await router.push({
    path: `/posts/${activePub.value}`,
    query: page === 0 ? {} : { page },
  });
}

useHead({
  title: "文章",
  meta: [
    {
      name: "description",
      content: "分页浏览 littlesheep 的所有技术博客文章。",
    },
    { property: "og:title", content: "文章 - Goatshed" },
    {
      property: "og:description",
      content: "分页浏览 littlesheep 的所有技术博客文章。",
    },
    { property: "og:type", content: "website" },
  ],
});
</script>
