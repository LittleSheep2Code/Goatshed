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
        <ShellBreadcrumb
          class="self-start"
          :path="`/posts/${activePub}/collections`"
        />

        <h1 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          合集
        </h1>
        <p class="mt-2 text-sm text-base-content/75">
          按主题整理的连载与专题，一个合集就是一条阅读顺序。
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
        <p v-if="!collections?.length" class="py-16 text-center text-sm text-base-content/70">
          这个发布者还没有公开的合集。
        </p>

        <div v-else class="grid min-w-0 gap-5 sm:grid-cols-2">
          <CollectionCard
            v-for="collection in collections"
            :key="collection.id"
            :collection="collection"
            :publisher-name="activePub"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { PostCollection } from "~/types/post";
import type { Publisher } from "~/types/publisher";
import {
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const activePub = computed<PublisherName>(() => {
  const value = route.params.pub;
  return typeof value === "string" && isPublisherName(value)
    ? value
    : "littlesheep";
});

defineOgImage("PublisherOgImage", {
  name: computed(() => activePub.value),
  eyebrow: "合集",
});

const { data: collections, pending, error } = await useAsyncData(
  () => `publisher-collections-${activePub.value}`,
  () =>
    $fetch<PostCollection[]>(
      `/api/publishers/${activePub.value}/collections`,
    ),
  {
    watch: [activePub],
    default: () => [],
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

async function setPublisher(next: PublisherName) {
  await router.push(`/posts/${next}/collections`);
}

useHead({
  title: "合集",
  meta: [
    {
      name: "description",
      content: "按主题浏览所选发布者的连载与专题合集。",
    },
    { property: "og:title", content: "合集 - Goatshed" },
    {
      property: "og:description",
      content: "按主题浏览所选发布者的连载与专题合集。",
    },
    { property: "og:type", content: "website" },
  ],
});
</script>
