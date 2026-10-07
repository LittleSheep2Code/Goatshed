<template>
  <section class="comment-section -mx-3" data-pagefind-ignore>
    <ClientOnly>
      <!--
        SunkenLand widgets. They talk to Stargate directly and get the signed-in
        user's token from the plugin's `getAccessToken` hook. Slot children must
        be light-DOM siblings with a `slot` attribute — Vue's `<template #…>`
        named slots do not compile on custom elements.
      -->
      <sk-reply-composer :post="postId" placeholder="写下你的评论..." submit-label="发送">
        <span slot="sign-in" class="w-full">
          <span class="comment-login-prompt block w-full rounded-xl border border-base-300/40 bg-base-200/30 px-4 py-3 text-center text-sm text-base-content/60">
            <button class="link link-primary" type="button" @click="login()">登录</button> 后参与评论
          </span>
        </span>
      </sk-reply-composer>

      <sk-replies-list :post="postId" :take="20" class="comment-replies">
        <span slot="header">评论</span>
        <span slot="loading">加载评论中...</span>
        <span slot="empty">暂无评论，来抢沙发吧</span>
        <span slot="load-more">加载更多评论</span>
      </sk-replies-list>
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  postId: string;
}>();

const { login } = useAuth();
</script>

<style>
/*
  Map the site's DaisyUI tokens onto the widgets' `--sk-*` surface so they stay
  on-palette in both light and dark themes instead of the presets' defaults.
  Custom properties set on the host element inherit into its shadow root.
*/
.comment-section sk-replies-list,
.comment-section sk-reply-composer {
  --sk-font: var(--font-sans);
  --sk-base-100: var(--color-base-100);
  --sk-base-200: var(--color-base-200);
  --sk-base-300: var(--color-base-300);
  --sk-base-content: var(--color-base-content);
  --sk-primary: var(--color-primary);
  --sk-primary-content: var(--color-primary-content);
  --sk-radius: var(--radius-box);
  --sk-border: color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

.comment-section .comment-replies {
  display: block;
  margin-top: 1rem;
}
</style>
