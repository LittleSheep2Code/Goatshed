<template>
  <section ref="target" class="moment-replies">
    <p class="moment-replies-head">
      <MessageCircle class="h-3.5 w-3.5" />
      {{ total }} 条回复
    </p>

    <ul v-if="replies.length" class="moment-replies-list">
      <li v-for="reply in replies" :key="reply.id" class="moment-reply">
        <img
          v-if="reply.author?.avatar"
          :src="reply.author.avatar"
          :alt="reply.author.nick || reply.author.name"
          class="moment-reply-avatar"
          loading="lazy"
        >
        <span v-else class="moment-reply-avatar moment-reply-avatar-fallback">
          {{ initial(reply) }}
        </span>

        <div class="moment-reply-body">
          <div class="moment-reply-meta">
            <span class="moment-reply-author">{{ name(reply) }}</span>
            <time class="moment-reply-time" :datetime="reply.createdAt">
              {{ formatRelativeTime(reply.createdAt) }}
            </time>
          </div>
          <p class="moment-reply-content">{{ reply.content }}</p>
        </div>
      </li>
    </ul>

    <NuxtLink :to="to" class="moment-replies-all">
      查看全部 {{ total }} 条回复
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import type { Comment } from "~/types/comment";
import { MessageCircle } from "lucide-vue-next";
import { formatRelativeTime } from "~/utils/time";

const props = withDefaults(
  defineProps<{
    postId: string;
    /** Server-reported reply count, shown before/independently of the fetch. */
    total: number;
    /** Moment detail URL the "view all" affordance points at. */
    to: string;
    /** How many replies to preview. */
    previewCount?: number;
  }>(),
  { previewCount: 3 },
);

const replies = ref<Comment[]>([]);
const fetched = ref(false);

const { target, visible } = useInView();

async function fetchPreview() {
  try {
    const data = await $fetch<{ comments: Comment[] }>(
      `/api/posts/${props.postId}/comments`,
      { query: { take: props.previewCount, offset: 0 } },
    );
    replies.value = data.comments;
  } catch (e) {
    // A failed preview must not break the timeline card; the "view all" link
    // still reaches the full thread.
    console.error("Failed to fetch reply preview:", e);
  }
}

watch(visible, (isVisible) => {
  if (!isVisible || fetched.value) return;
  fetched.value = true;
  void fetchPreview();
});

function name(reply: Comment): string {
  return reply.author?.nick || reply.author?.name || "匿名";
}

function initial(reply: Comment): string {
  return name(reply).charAt(0).toUpperCase();
}
</script>

<style scoped>
.moment-replies {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid
    color-mix(in srgb, var(--color-base-300) 45%, transparent);
}

.moment-replies-head {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}

.moment-replies-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
}

.moment-reply {
  display: flex;
  gap: 0.5rem;
}

.moment-reply-avatar {
  height: 1.25rem;
  width: 1.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
  object-fit: cover;
}

.moment-reply-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-primary);
}

.moment-reply-body {
  min-width: 0;
  flex: 1;
}

.moment-reply-meta {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  min-width: 0;
}

.moment-reply-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6875rem;
  font-weight: 600;
}

.moment-reply-time {
  flex-shrink: 0;
  font-size: 0.625rem;
  color: color-mix(in srgb, var(--color-base-content) 45%, transparent);
}

.moment-reply-content {
  margin-top: 0.125rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.75rem;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-base-content) 75%, transparent);
}

.moment-replies-all {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--color-primary) 85%, transparent);
  text-decoration: none;
}

.moment-replies-all:hover {
  text-decoration: underline;
}
</style>
