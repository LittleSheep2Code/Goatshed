<template>
  <article class="post-tile min-w-0" @mousemove="onMove">
    <NuxtLink
      v-if="coverImage"
      :to="`/posts/${post.id}`"
      class="-mx-5 -mt-5 mb-6 block overflow-hidden border-b border-base-300/40"
    >
      <img :src="coverImage.src" :alt="coverImage.alt" class="aspect-video w-full object-cover" loading="lazy">
    </NuxtLink>

    <div class="relative z-10 flex min-w-0 flex-col gap-3">
      <div class="flex items-center gap-2 text-xs text-base-content/70">
        <span class="badge badge-soft badge-primary">{{ post.publisher.name }}</span>
        <span>{{ formattedDate }}</span>
        <span>{{ post.viewsUnique }} 次阅读</span>
      </div>

      <NuxtLink :to="`/posts/${post.id}`" class="min-w-0 hover:no-underline">
        <h2 class="text-xl font-bold leading-tight">{{ post.title || "无标题文章" }}</h2>
      </NuxtLink>

      <p class="text-sm text-base-content/80 line-clamp-3 break-words">
        {{ excerpt }}
      </p>

      <div v-if="post.tags.length" class="flex flex-wrap gap-1">
        <span
          v-for="tag in post.tags.slice(0, 4)"
          :key="tag.id"
          class="badge badge-ghost badge-sm"
        >
          #{{ tag.slug }}
        </span>
      </div>

      <div class="flex items-center justify-between text-xs text-base-content/70">
        <span>{{ post.repliesCount }} 条评论</span>
        <NuxtLink :to="`/posts/${post.id}`" class="link link-primary">阅读全文</NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";

const props = defineProps<{
  post: Post;
}>();

const config = useRuntimeConfig();

const formattedDate = computed(() => {
  return new Date(props.post.publishedAt || props.post.createdAt).toLocaleString();
});

const excerpt = computed(() => {
    const base = (props.post.description || props.post.content || "暂无简介。")
    .replace(/[#*_`>[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base.length > 220 ? `${base.slice(0, 220)}...` : base;
});

const coverImage = computed(() => {
  const candidate = props.post.picture || props.post.attachments?.[0] || props.post.background;
  if (!candidate?.id) return null;
  return {
    src: candidate.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(candidate.id)}`,
    alt: props.post.title || "文章配图",
  };
});

function onMove(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  element.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  element.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}
</script>
