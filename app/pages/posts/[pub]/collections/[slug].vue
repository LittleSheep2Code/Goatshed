<template>
  <main class="page-shell relative min-w-0 pb-8">
    <CoverHero
      :image="coverUrl"
      :fallback-image="publisherBackgroundUrl"
      :blurhash="coverBlurhash"
      class="cover-bleed cover-under-app-bar mb-6"
    >
      <div
        class="flex min-h-[46dvh] flex-col justify-center pb-24 pt-10 sm:min-h-[54dvh] sm:pb-28 sm:pt-14"
      >
        <ShellBreadcrumb
          class="self-start"
          :path="`/posts/${activePub}/collections/${collectionSlug}`"
        />

        <div class="mt-4 flex items-center gap-4">
          <span
            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300/50 bg-base-200/60"
          >
            <UnLazyImage
              v-if="iconUrl"
              :src="iconUrl"
              :alt="collectionTitle"
              :blurhash="collection?.icon?.blurhash"
              class="h-full w-full object-cover"
            />
            <Layers v-else class="h-6 w-6 opacity-70" aria-hidden="true" />
          </span>

          <div class="min-w-0">
            <p class="text-xs uppercase tracking-widest text-base-content/60">
              合集
            </p>
            <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {{ collectionTitle }}
            </h1>
          </div>
        </div>

        <p
          v-if="collection?.description"
          class="mt-3 max-w-2xl whitespace-pre-line text-sm text-base-content/80"
        >
          {{ collection.description }}
        </p>

        <NuxtLink
          :to="`/posts/${activePub}/collections`"
          class="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
          {{ publisherLabel }} 的全部合集
        </NuxtLink>
      </div>
    </CoverHero>

    <section v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="post-frame space-y-4">
      <div class="alert alert-error">
        <span>找不到这个合集，或者它已经不再公开。</span>
      </div>
      <NuxtLink
        :to="`/posts/${activePub}/collections`"
        class="btn btn-sm btn-outline"
      >
        返回合集列表
      </NuxtLink>
    </section>

    <section v-else class="grid min-w-0 gap-5 lg:grid-cols-[19rem_1fr]">
      <PublisherSidebar
        :publisher-name="activePub"
        class="min-w-0 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:pt-24 lg:pb-6"
        @change="setPublisher"
      />

      <div class="min-w-0 space-y-4">
        <p
          v-if="postsPending"
          class="flex justify-center py-16"
        >
          <span class="loading loading-dots loading-lg" />
        </p>

        <div v-else-if="postsError" class="alert alert-error">
          <span>{{ postsError.message }}</span>
        </div>

        <p
          v-else-if="!posts.length"
          class="py-16 text-center text-sm text-base-content/70"
        >
          这个合集里还没有公开的文章。
        </p>

        <template v-else>
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
        </template>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Layers } from "lucide-vue-next";
import type { Post, PostCollection } from "~/types/post";
import type { Publisher } from "~/types/publisher";
import {
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import { driveFileUrl } from "~/utils/media";

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

const collectionSlug = computed(() => {
  const value = route.params.slug;
  return Array.isArray(value) ? value.join("/") : (value ?? "");
});

const currentPage = computed(() => {
  const raw = Number(route.query.page);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
});

defineOgImage("CollectionOgImage", {
  pub: computed(() => activePub.value),
  slug: computed(() => collectionSlug.value),
});

const { data: collection, pending, error } = await useAsyncData(
  () => `collection-${activePub.value}-${collectionSlug.value}`,
  () =>
    $fetch<PostCollection>(
      `/api/publishers/${activePub.value}/collections/${collectionSlug.value}`,
    ),
  { watch: [activePub, collectionSlug] },
);

const {
  data,
  pending: postsPending,
  error: postsError,
} = await useAsyncData(
  () =>
    `collection-posts-${activePub.value}-${collectionSlug.value}-${currentPage.value}`,
  () =>
    $fetch<{ posts: Post[]; total: number }>(
      `/api/publishers/${activePub.value}/collections/${collectionSlug.value}/posts`,
      { query: { take: pageSize, offset: currentPage.value * pageSize } },
    ),
  {
    watch: [activePub, collectionSlug, currentPage],
    default: () => ({ posts: [], total: 0 }),
  },
);

const { data: publishersData } = await useFetch<
  Record<string, Publisher | null>
>("/api/publishers");

const collectionTitle = computed(
  () => collection.value?.name?.trim() || collectionSlug.value,
);

const publisherLabel = computed(() => {
  const publisher = publishersData.value?.[activePub.value];
  return publisher?.nick || publisher?.name || activePub.value;
});

const iconUrl = computed(() =>
  driveFileUrl(collection.value?.icon, config.public.apiBaseUrl),
);

const coverUrl = computed(() =>
  driveFileUrl(collection.value?.background, config.public.apiBaseUrl),
);

const publisherBackgroundUrl = computed(() => {
  const background = publishersData.value?.[activePub.value]?.background;
  if (!background?.id) return null;
  return (
    background.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(background.id)}`
  );
});

const coverBlurhash = computed(() => {
  const own = collection.value?.background?.blurhash;
  if (own) return own;
  return publishersData.value?.[activePub.value]?.background?.blurhash || null;
});

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
  await router.push(`/posts/${next}/collections`);
}

async function setPage(next: number) {
  const page = Math.min(Math.max(next, 0), maxPage.value);
  await router.push({
    path: `/posts/${activePub.value}/collections/${collectionSlug.value}`,
    query: page === 0 ? {} : { page },
  });
}

useHead(() => ({
  title: collectionTitle.value,
  meta: [
    {
      name: "description",
      content:
        collection.value?.description ||
        `在 Goatshed 阅读 ${publisherLabel.value} 的合集「${collectionTitle.value}」。`,
    },
    { property: "og:title", content: collectionTitle.value },
    {
      property: "og:description",
      content: collection.value?.description || "Goatshed 上的一个合集。",
    },
    { property: "og:type", content: "website" },
    {
      property: "og:url",
      content: `https://littlesheep.me/posts/${activePub.value}/collections/${collectionSlug.value}`,
    },
  ],
  link: [
    {
      rel: "canonical",
      href: `https://littlesheep.me/posts/${activePub.value}/collections/${collectionSlug.value}`,
    },
  ],
}));
</script>
