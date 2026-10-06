<template>
  <article class="timeline-card" @click="onCardClick">
    <MomentMedia
      v-if="images.length"
      :images="images"
      :to="url"
      :ratio="ratio"
      :transition-name="transitionName"
    />

    <div class="timeline-card-body">
      <header class="timeline-card-head">
        <img
          v-if="publisherPictureUrl"
          :src="publisherPictureUrl"
          :alt="publisherName"
          class="timeline-card-avatar"
          loading="lazy"
        >
        <span class="timeline-card-nick">{{ publisherName }}</span>
        <NuxtLink :to="url" class="timeline-permalink">
          <time class="timeline-time" :datetime="publishedAt">{{ time }}</time>
        </NuxtLink>
        <Users
          v-if="post.visibility === 1"
          class="timeline-card-lock"
          title="仅好友可见"
        />
        <EyeOff
          v-else-if="post.visibility === 2"
          class="timeline-card-lock"
          title="不公开列出"
        />
        <Lock
          v-else-if="post.visibility === 3"
          class="timeline-card-lock"
          title="仅自己可见"
        />
      </header>

      <NuxtLink v-if="post.title" :to="url" class="timeline-title-link">
        <h2 class="timeline-title">{{ post.title }}</h2>
      </NuxtLink>

      <div
        v-if="renderedBody"
        class="prose-goatshed timeline-article line-clamp-4"
        v-html="renderedBody"
      />

      <div v-if="embeds.length" class="timeline-embeds">
        <MomentEmbed v-for="(embed, i) in embeds" :key="i" :embed="embed" />
      </div>

      <div ref="engagement" class="timeline-engagement">
        <ReactionBar
          v-if="engagementVisible && post.id"
          :post-id="post.id"
          :max-visible="3"
        />

        <div class="timeline-stats">
          <NuxtLink :to="url" class="timeline-stat" title="查看回复">
            <MessageCircle class="h-3.5 w-3.5" />
            <span>{{ post.repliesCount }}</span>
          </NuxtLink>

          <span class="timeline-stat" :title="`${post.viewsTotal} 次浏览`">
            <Eye class="h-3.5 w-3.5" />
            <span>{{ post.viewsUnique }}</span>
          </span>

          <button
            type="button"
            class="timeline-stat timeline-stat-action"
            :title="shareLabel"
            @click.stop="shareMoment"
          >
            <Check v-if="shareState === 'copied'" class="h-3.5 w-3.5" />
            <Share2 v-else class="h-3.5 w-3.5" />
            <span>{{ shareLabel }}</span>
          </button>
        </div>
      </div>

      <MomentReplyPreview
        v-if="post.repliesCount > 0"
        :post-id="post.id"
        :total="post.repliesCount"
        :to="url"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Post, PostEmbed } from "~/types/post";
import { getPostIdentifier } from "~/utils/post";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  MessageCircle,
  Share2,
  Users,
} from "lucide-vue-next";

interface MomentImage {
  src: string;
  alt: string;
  blurhash?: string;
  width?: number;
  height?: number;
}

const props = defineProps<{
  post: Post;
  /** Pre-resolved media for the card, in display order. */
  images: MomentImage[];
  /** CSS aspect-ratio for the media frame, e.g. "4 / 3". */
  ratio?: string;
  /** Pre-formatted clock time, e.g. "14:03". */
  time: string;
  /** ISO timestamp for the <time> element. */
  publishedAt: string;
  /** View-transition name applied to the first slide, for the open animation. */
  transitionName?: string;
  /** Server-rendered markdown body (description falling back to content). */
  renderedBody?: string;
}>();

const config = useRuntimeConfig();

const url = computed(() => `/moments/${getPostIdentifier(props.post)}`);

const publisherName = computed(
  () => props.post.publisher?.nick || props.post.publisher?.name || "匿名",
);

const publisherPictureUrl = computed(() => {
  const pic = props.post.publisher?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

const embeds = computed<PostEmbed[]>(() =>
  (props.post.meta?.embeds ?? []).filter(
    (embed): embed is PostEmbed => typeof embed === "object" && embed !== null,
  ),
);

// Per-card network work (reactions, reply preview) only starts once the card
// nears the viewport — a long timeline must not fire dozens of requests on load.
const { target: engagement, visible: engagementVisible } = useInView();

const shareState = ref<"idle" | "copied" | "error">("idle");
const shareLabel = computed(() =>
  shareState.value === "copied"
    ? "已复制"
    : shareState.value === "error"
      ? "复制失败"
      : "分享",
);

/**
 * The card is a click target, but nested links/buttons own their own events, and
 * a drag-select must never navigate.
 */
function onCardClick(event: MouseEvent) {
  const element = event.target as HTMLElement | null;
  if (element?.closest("a, button, input, textarea, select")) return;

  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) return;

  navigateTo(url.value);
}

async function shareMoment() {
  const absolute = new URL(url.value, window.location.origin).toString();

  if (navigator.share) {
    try {
      await navigator.share({
        title: props.post.title || "动态",
        url: absolute,
      });
      return;
    } catch (e) {
      // User dismissed the share sheet; not an error.
      if ((e as DOMException)?.name === "AbortError") return;
    }
  }

  const copied = await copyText(absolute);
  shareState.value = copied ? "copied" : "error";
  window.setTimeout(() => (shareState.value = "idle"), 1800);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  } catch {
    return false;
  }
}
</script>

<style scoped>
.timeline-card {
  display: block;
  overflow: hidden;
  margin-bottom: 0.875rem;
  border-radius: var(--radius-box, 0.9rem);
  border: 1px solid
    color-mix(in srgb, var(--color-base-300) 70%, transparent);
  background: var(--color-base-100);
  cursor: pointer;
  transition:
    border-color 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease;
}

.timeline-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px oklch(0 0 0 / 0.06);
}

.timeline-card-body {
  padding: 1rem;
}

@media (min-width: 640px) {
  .timeline-card-body {
    padding: 1.25rem;
  }
}

.timeline-card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}

.timeline-card-avatar {
  height: 1.25rem;
  width: 1.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
  object-fit: cover;
}

.timeline-card-nick {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: color-mix(in srgb, var(--color-base-content) 78%, transparent);
}

.timeline-time {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}

.timeline-permalink {
  color: inherit;
  text-decoration: none;
}

.timeline-permalink:hover .timeline-time {
  color: color-mix(in srgb, var(--color-primary) 85%, transparent);
  text-decoration: underline;
}

.timeline-card-lock {
  height: 0.875rem;
  width: 0.875rem;
  flex-shrink: 0;
}

.timeline-title-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.timeline-title {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
  color: color-mix(in srgb, var(--color-base-content) 92%, transparent);
}

.timeline-article {
  margin-top: 0.375rem;
  color: color-mix(in srgb, var(--color-base-content) 78%, transparent);
}

.timeline-embeds {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-engagement {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
}

.timeline-stats {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

.timeline-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 1.5rem;
  padding-inline: 0.375rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  font-variant-numeric: tabular-nums;
  color: inherit;
  text-decoration: none;
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.timeline-stat-action {
  cursor: pointer;
}

.timeline-stat:hover {
  background: color-mix(in srgb, var(--color-base-200) 80%, transparent);
  color: color-mix(in srgb, var(--color-base-content) 85%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .timeline-card,
  .timeline-stat {
    transition: none;
  }

  .timeline-card:hover {
    transform: none;
  }
}
</style>
