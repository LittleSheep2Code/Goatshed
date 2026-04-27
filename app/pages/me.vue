<template>
  <main class="page-shell py-8 space-y-6">
    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <h1 class="text-2xl font-extrabold">我的账户</h1>
      <p class="mt-1 text-sm text-base-content/70">使用本地会话中间件保护的页面。</p>

      <div v-if="auth.user.value" class="mt-5 space-y-2">
        <div class="mb-2 flex items-center gap-3">
          <div class="avatar">
            <div class="h-12 w-12 rounded-full bg-base-300">
              <img v-if="avatarUrl" :src="avatarUrl" :alt="auth.user.value.name">
              <span v-else class="flex h-full w-full items-center justify-center text-sm font-bold">{{ initials }}</span>
            </div>
          </div>
          <div>
            <p class="font-semibold">{{ auth.user.value.nick || auth.user.value.name }}</p>
            <p class="text-xs text-base-content/70">@{{ auth.user.value.username || auth.user.value.name }}</p>
          </div>
        </div>
        <p><span class="font-semibold">名称：</span> {{ auth.user.value.name }}</p>
        <p><span class="font-semibold">昵称：</span> {{ auth.user.value.nick || "-" }}</p>
        <p><span class="font-semibold">用户名：</span> {{ auth.user.value.username || "-" }}</p>
        <p><span class="font-semibold">ID：</span> {{ auth.user.value.id }}</p>

        <div v-if="account" class="mt-4 rounded-box border border-base-300 bg-base-200/40 p-4 space-y-1 text-sm">
          <p class="font-semibold">账户详情</p>
          <p><span class="font-semibold">语言：</span> {{ account.language || "-" }}</p>
          <p><span class="font-semibold">地区：</span> {{ account.region || "-" }}</p>
          <p><span class="font-semibold">位置：</span> {{ account.profile?.location || "-" }}</p>
          <p><span class="font-semibold">时区：</span> {{ account.profile?.timeZone || "-" }}</p>
          <p><span class="font-semibold">简介：</span> {{ account.profile?.bio || "-" }}</p>
        </div>
      </div>

      <div class="mt-6">
        <button class="btn btn-outline" @click="auth.logout">退出登录</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Account } from "~/types/account";

definePageMeta({
  middleware: ["auth"],
});

const auth = useAuth();
const config = useRuntimeConfig();

const avatarUrl = computed(() => {
  const username = auth.user.value?.username || auth.user.value?.name;
  if (!username) return "";
  return `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(username)}/picture`;
});

const initials = computed(() => {
  const source = auth.user.value?.nick || auth.user.value?.name || "?";
  return source.slice(0, 2).toUpperCase();
});

const accountName = computed(() => auth.user.value?.username || auth.user.value?.name || "");

const { data: account } = await useFetch<Account | null>(
  () => (accountName.value ? `/api/accounts/${encodeURIComponent(accountName.value)}` : null),
  {
    default: () => null,
  },
);

useHead({ title: "我的账户" });
</script>
