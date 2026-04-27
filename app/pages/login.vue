<template>
  <main class="page-shell py-12">
    <section class="mx-auto max-w-xl rounded-box border border-base-300 bg-base-100 p-8">
      <h1 class="text-3xl font-extrabold">登录</h1>
      <p class="mt-2 text-base-content/70">
        使用你的 FloatingIsland 身份登录。本站维护独立会话。
      </p>

      <div class="mt-6 space-y-3">
        <button class="btn btn-primary w-full" @click="startLogin">
          使用 {{ providerName }} 继续
        </button>
        <p class="text-xs text-base-content/60">
          OAuth 客户端配置来自环境变量。
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute();
const auth = useAuth();
const config = useRuntimeConfig();

const providerName = computed(() => config.public.oauthProviderName || "OAuth");

function startLogin() {
  const next = typeof route.query.next === "string" ? route.query.next : "/me";
  auth.login(next);
}

useHead({ title: "登录" });
</script>
