<template>
  <a
    v-if="type === 'link' && url"
    :href="url"
    target="_blank"
    rel="noopener noreferrer nofollow"
    class="moment-embed moment-embed-link"
  >
    <div v-if="image && !coverFailed" class="moment-embed-cover">
      <img
        :src="image"
        :alt="title || '链接预览'"
        loading="lazy"
        decoding="async"
        @error="coverFailed = true"
      >
    </div>

    <div class="moment-embed-body">
      <div class="moment-embed-source">
        <img
          v-if="favicon && !faviconFailed"
          :src="favicon"
          alt=""
          class="moment-embed-favicon"
          loading="lazy"
          @error="faviconFailed = true"
        >
        <Link2 v-else class="h-3.5 w-3.5 shrink-0" />
        <span class="moment-embed-host">{{ siteName || host }}</span>
        <ExternalLink class="moment-embed-goto" />
      </div>

      <p v-if="title" class="moment-embed-title">{{ title }}</p>
      <p v-if="description" class="moment-embed-description">{{ description }}</p>
    </div>
  </a>

  <div v-else-if="type === 'poll'" class="moment-embed moment-embed-poll">
    <div class="moment-embed-source">
      <Vote class="h-3.5 w-3.5 shrink-0" />
      <span class="moment-embed-host">投票</span>
    </div>
    <p v-if="title" class="moment-embed-title">{{ title }}</p>
    <p v-if="description" class="moment-embed-description">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { PostEmbed } from "~/types/post";
import { ExternalLink, Link2, Vote } from "lucide-vue-next";

const props = defineProps<{ embed: PostEmbed }>();

// Resolver-supplied assets are third-party URLs; they can 404 or be blocked by
// CORP. Fall back to the generic link mark instead of a broken image.
const coverFailed = ref(false);
const faviconFailed = ref(false);

const type = computed(() =>
  typeof props.embed.type === "string" ? props.embed.type.toLowerCase() : "",
);

/** First non-empty string among `keys`; embeds come from several resolver shapes. */
function pick(...keys: string[]): string | null {
  for (const key of keys) {
    const value = (props.embed as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

const url = computed(() => pick("url", "uri", "href"));
const title = computed(() => pick("title"));
const description = computed(() => pick("description"));
const siteName = computed(() => pick("siteName", "site_name"));
const image = computed(() => resolveAsset(pick("imageUrl", "image_url")));
const favicon = computed(() => resolveAsset(pick("faviconUrl", "favicon_url")));

const host = computed(() => {
  if (!url.value) return "";
  try {
    return new URL(url.value).host;
  } catch {
    return url.value;
  }
});

/**
 * Resolvers return site-relative asset paths (e.g. "/apple-touch-icon.png");
 * they only make sense against the origin of the page they describe.
 */
function resolveAsset(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (!raw.startsWith("/") || !url.value) return raw;
  try {
    const parsed = new URL(url.value);
    return `${parsed.protocol}//${parsed.host}${raw}`;
  } catch {
    return null;
  }
}
</script>

<style scoped>
.moment-embed {
  display: block;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-base-300) 70%, transparent);
  border-radius: var(--radius-box, 0.9rem);
  background: color-mix(in srgb, var(--color-base-200) 40%, transparent);
  text-decoration: none;
  color: inherit;
}

.moment-embed-link {
  transition:
    border-color 200ms ease,
    background-color 200ms ease;
}

.moment-embed-link:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  background: color-mix(in srgb, var(--color-base-200) 65%, transparent);
}

.moment-embed-cover {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-base-300) 50%, transparent);
}

.moment-embed-cover img {
  display: block;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.moment-embed-body {
  padding: 0.625rem 0.75rem;
}

.moment-embed-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}

.moment-embed-favicon {
  height: 1rem;
  width: 1rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.moment-embed-host {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moment-embed-goto {
  height: 0.875rem;
  width: 0.875rem;
  flex-shrink: 0;
}

.moment-embed-title {
  margin-top: 0.375rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  color: color-mix(in srgb, var(--color-base-content) 90%, transparent);
}

.moment-embed-description {
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.75rem;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-base-content) 70%, transparent);
}

.moment-embed-poll {
  padding: 0.625rem 0.75rem;
}
</style>
