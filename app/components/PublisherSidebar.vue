<template>
  <aside class="space-y-4 lg:pr-5">
    <div class="overflow-hidden p-4">
      <div v-if="pending" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md" />
      </div>

      <div v-else-if="publisher" class="space-y-3">
        <div class="flex flex-col items-center gap-3 text-center">
          <div class="relative inline-block">
            <div class="avatar">
              <div class="h-24 w-24 rounded-full bg-primary text-primary-content">
                <UnLazyImage
                  v-if="publisherPictureUrl"
                  :key="publisherPictureUrl"
                  :src="publisherPictureUrl"
                  :alt="publisher.name"
                  :blurhash="publisherPictureBlurhash"
                />
                <span v-else class="text-3xl font-bold">{{ initials }}</span>
              </div>
            </div>

            <ClientOnly>
              <PopoverRoot v-model:open="switcherOpen">
                <PopoverTrigger
                  class="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-base-100 bg-base-300 text-base-content/80 shadow-md transition-colors hover:bg-primary hover:text-primary-content"
                  aria-label="切换发布者"
                  title="切换发布者"
                >
                  <ArrowLeftRight class="h-3.5 w-3.5" />
                </PopoverTrigger>

                <PopoverPortal>
                  <PopoverContent
                    class="z-50 w-64 rounded-2xl border border-base-300/40 bg-base-100 p-1.5 shadow-xl"
                    :side-offset="8"
                    align="center"
                    :collision-padding="16"
                  >
                    <button
                      v-for="name in PUBLISHERS"
                      :key="name"
                      type="button"
                      class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
                      :class="name === publisherName ? 'bg-primary/10' : 'hover:bg-base-200'"
                      @click="selectPublisher(name)"
                    >
                      <span class="inline-block h-8 w-8 shrink-0 overflow-hidden rounded-full border border-base-300/70 bg-base-200">
                        <img
                          v-if="publisherAvatar(name)"
                          :src="publisherAvatar(name)"
                          :alt="publisherLabel(name)"
                          class="block h-full w-full object-cover"
                          loading="lazy"
                        >
                        <span v-else class="flex h-full w-full items-center justify-center text-xs font-bold">
                          {{ publisherLabel(name).slice(0, 1).toUpperCase() }}
                        </span>
                      </span>

                      <span class="min-w-0">
                        <span class="flex items-center gap-1.5 text-sm font-semibold">
                          {{ publisherLabel(name) }}
                          <Lock v-if="PUBLISHER_META[name].locked" class="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                        </span>
                        <span class="block truncate text-xs text-base-content/60">
                          {{ PUBLISHER_META[name].description }}
                        </span>
                      </span>
                    </button>
                  </PopoverContent>
                </PopoverPortal>
              </PopoverRoot>
            </ClientOnly>
          </div>

          <div class="min-w-0">
            <p class="truncate text-lg font-bold">{{ publisher.nick || publisher.name }}</p>
            <p class="truncate text-xs text-base-content/70">@{{ publisher.name }}</p>
          </div>
        </div>

        <p v-if="publisher.bio" class="text-sm leading-6 text-base-content/80">
          {{ publisher.bio }}
        </p>

        <div v-if="publisher.verification?.title" class="badge badge-soft badge-primary">
          {{ publisher.verification.title }}
        </div>

        <div v-if="publisherAttachments.length" class="grid grid-cols-3 gap-2">
          <a
            v-for="file in publisherAttachments"
            :key="file.id"
            :href="file.url"
            target="_blank"
            rel="noreferrer"
            class="block overflow-hidden rounded-lg border border-base-300/40"
          >
            <UnLazyImage
              :src="file.url"
              :alt="file.name || 'Publisher attachment'"
              :blurhash="file.blurhash"
              :width="file.width"
              :height="file.height"
              class="h-16 w-full object-cover"
            />
          </a>
        </div>
      </div>

      <div v-else-if="error" class="text-sm text-error">加载发布者失败。</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Publisher } from "~/types/publisher";
import type { Post } from "~/types/post";
import { ArrowLeftRight, Lock } from "lucide-vue-next";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import {
  PUBLISHER_META,
  PUBLISHERS,
  type PublisherName,
} from "~/constants/publishers";
import { getPostIdentifier } from "~/utils/post";

const props = defineProps<{
  publisherName: string;
}>();

const emit = defineEmits<{
  change: [value: PublisherName];
}>();

const config = useRuntimeConfig();
const auth = useAuth();
const route = useRoute();
const router = useRouter();

const switcherOpen = ref(false);

const { data: publishersData, pending, error } = await useFetch<Record<string, Publisher | null>>('/api/publishers');

const publisher = computed(() => publishersData.value?.[props.publisherName] ?? null);

const { data: pinned, pending: pinnedPending } = await useFetch<Post[]>(
  () => `/api/publishers/${props.publisherName}/pinned`,
  {
    default: () => [],
    watch: [() => props.publisherName],
  },
);

const initials = computed(() => {
  const source = publisher.value?.nick || publisher.value?.name || "?";
  return source.slice(0, 2).toUpperCase();
});

const publisherPictureUrl = computed(() => {
  const pic = publisher.value?.picture;
  if (!pic?.id) return null;
  return pic.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`;
});

const publisherPictureBlurhash = computed(
  () => publisher.value?.picture?.blurhash || undefined,
);

const publisherBackgroundUrl = computed(() => {
  const bg = publisher.value?.background;
  if (!bg?.id) return null;
  return bg.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`;
});

const publisherAttachments = computed(() => {
  const files = publisher.value?.attachments || [];
  return files
    .filter((file) => file?.id)
    .slice(0, 6)
    .map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(file.id)}`,
      blurhash: file.blurhash || undefined,
      width: file.width || undefined,
      height: file.height || undefined,
    }));
});

function getPostUrl(post: Post) {
  const identifier = getPostIdentifier(post);
  return post.type === 0 ? `/moments/${identifier}` : `/posts/${identifier}`;
}

function publisherLabel(name: PublisherName) {
  const pub = publishersData.value?.[name];
  return pub?.nick || pub?.name || name;
}

function publisherAvatar(name: PublisherName) {
  const picture = publishersData.value?.[name]?.picture;
  if (!picture?.id) return "";
  return picture.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(picture.id)}`;
}

function selectPublisher(name: PublisherName) {
  switcherOpen.value = false;
  if (name === props.publisherName) return;

  if (PUBLISHER_META[name].locked && !auth.authenticated.value) {
    const next = router.resolve({
      path: route.path,
      query: { ...route.query, pub: name },
    }).fullPath;
    auth.login(next);
    return;
  }

  emit("change", name);
}
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
