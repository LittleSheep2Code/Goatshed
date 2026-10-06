<template>
  <header
    class="sticky top-0 z-40 border-b transition duration-300 ease-out motion-reduce:transition-none max-lg:px-4"
    :class="[
      hidden ? '-translate-y-full' : 'translate-y-0',
      // At the top the bar dissolves into the cover artwork behind it.
      scrolled
        ? 'border-base-300/70 bg-base-100/85 backdrop-blur-lg'
        : 'border-transparent bg-transparent backdrop-blur-none',
      scrolled && !hidden ? 'shadow-md' : 'shadow-none',
    ]"
    :inert="hidden || undefined"
    :aria-hidden="hidden ? 'true' : undefined"
  >
    <div class="page-shell navbar min-h-(--app-bar-height) px-0">
      <div class="navbar-start">
        <NuxtLink
          to="/"
          class="btn btn-ghost px-2 text-lg font-extrabold normal-case sm:text-xl"
        >
          <img :src="BrandingCompact" alt="Goatshed" class="h-8" />
        </NuxtLink>
      </div>

      <div class="navbar-center hidden md:flex">
        <nav
          ref="navRef"
          class="relative isolate"
          @pointerleave="navIntent = null"
          @focusout="onNavFocusOut"
        >
          <span ref="navIndicator" aria-hidden="true" class="nav-indicator" />
          <ul class="flex items-center gap-1 px-1">
            <li v-for="item in navItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="nav-link inline-flex items-center gap-1.5"
                :class="{ 'nav-link-active': activeNavKey === item.to }"
                :data-glide-key="item.to"
                :aria-current="activeNavKey === item.to ? 'page' : undefined"
                @pointerenter="navIntent = item.to"
                @focus="navIntent = item.to"
              >
                <component :is="item.icon" class="h-4 w-4" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>

      <div class="navbar-end gap-2">
        <div class="dropdown dropdown-end md:hidden">
          <button
            tabindex="0"
            class="btn btn-ghost btn-sm px-2"
            aria-label="打开导航菜单"
          >
            <Menu class="h-5 w-5" />
          </button>
          <ul
            tabindex="0"
            class="menu dropdown-content mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
          >
            <li>
              <NuxtLink
                to="/"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <House class="h-4 w-4" />
                博客
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/posts"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <FileText class="h-4 w-4" />
                文章
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/moments"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <MessageCircle class="h-4 w-4" />
                动态
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
to="/store"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <ShoppingBag class="h-4 w-4" />
                商店
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/about"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <Info class="h-4 w-4" />
                关于
              </NuxtLink>
            </li>
            <li class="menu-title mt-1 border-t border-base-300 pt-2">
              <span class="text-xs opacity-60">账户</span>
            </li>
            <template v-if="auth.authenticated.value && auth.user.value">
              <li>
                <NuxtLink to="/me" class="inline-flex items-center gap-2">
                  <User class="h-4 w-4" />
                  {{ auth.user.value.name }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/orders" class="inline-flex items-center gap-2">
                  <Receipt class="h-4 w-4" />
                  我的订单
                </NuxtLink>
              </li>
              <li>
                <button
                  class="inline-flex items-center gap-2 text-error"
                  @click="handleLogout"
                >
                  <LogOut class="h-4 w-4" />
                  退出登录
                </button>
              </li>
            </template>
            <template v-else>
              <li>
                <NuxtLink to="/login" class="inline-flex items-center gap-2">
                  <LogIn class="h-4 w-4" />
                  登录
                </NuxtLink>
              </li>
            </template>
          </ul>
        </div>

        <template v-if="auth.authenticated.value && auth.user.value">
          <details ref="userMenu" class="dropdown dropdown-end hidden md:block">
            <summary
              class="list-none flex items-center gap-2 rounded-box sm:px-3 cursor-pointer"
            >
              <div class="avatar">
                <div class="h-7 w-7 rounded-full bg-base-300">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    :alt="auth.user.value.name"
                    loading="lazy"
                  />
                </div>
              </div>
            </summary>

            <ul
              class="menu dropdown-content mt-2 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-sm z-50"
            >
              <li>
                <NuxtLink to="/me" @click="closeMenu">我的账户</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/orders" @click="closeMenu">我的订单</NuxtLink>
              </li>
              <li>
                <button @click="handleLogout">退出登录</button>
              </li>
            </ul>
          </details>
        </template>

        <template v-else>
          <NuxtLink
            to="/login"
            class="btn btn-primary btn-sm hidden md:inline-flex"
            >登录</NuxtLink
          >
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";

import {
  FileText,
  House,
  Info,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Receipt,
  ShoppingBag,
  User,
} from "lucide-vue-next";

const auth = useAuth();
const userMenu = ref<HTMLDetailsElement>();
const route = useRoute();

// Desktop nav. Order matches the highlight's resting order and mobile menu.
const navItems = [
  { to: "/", label: "博客", icon: House },
  { to: "/posts", label: "文章", icon: FileText },
  { to: "/moments", label: "动态", icon: MessageCircle },
  { to: "/store", label: "商店", icon: ShoppingBag },
  { to: "/about", label: "关于", icon: Info },
] as const;

const navRef = ref<HTMLElement>();
const navIndicator = ref<HTMLElement>();
// The highlight trails the pointer/keyboard, then falls back to the current page's item.
const navIntent = ref<string | null>(null);

const activeNavKey = computed(
  () =>
    navItems.find((item) =>
      item.to === "/"
        ? route.path === "/"
        : route.path === item.to || route.path.startsWith(`${item.to}/`),
    )?.to ?? null,
);

useGlideIndicator(
  navRef,
  navIndicator,
  computed(() => navIntent.value ?? activeNavKey.value),
);

function onNavFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (!next || !(event.currentTarget as HTMLElement).contains(next)) navIntent.value = null;
}

const { hidden, scrolled } = useScrollHeader();

// A fresh page always starts with the bar visible.
watch(
  () => route.fullPath,
  () => {
    hidden.value = false;
  },
);

// Don't leave an open menu floating off-screen.
watch(hidden, (isHidden) => {
  if (isHidden) closeMenu();
});

const { data: avatarData } = await useFetch<{ avatarUrl: string | null }>("/api/sn/avatar", {
  key: () => `avatar-${auth.user.value?.id ?? "anon"}`,
  default: () => ({ avatarUrl: null }),
  headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
});

const avatarUrl = computed(() => avatarData.value?.avatarUrl ?? "");

function closeMenu() {
  if (userMenu.value) userMenu.value.open = false;
}

function onDocumentClick(e: MouseEvent) {
  if (!userMenu.value) return
  const target = e.target as HTMLElement | null
  if (!target) return
  if (!userMenu.value.contains(target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick)
})

async function handleLogout() {
  closeMenu();
  await auth.logout();
}
</script>
