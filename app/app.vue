<template>
  <div class="min-h-screen bg-base-100">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#038fec" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

useHead({
  htmlAttrs: {
    lang: "zh-CN",
  },
  link: [
    /*
      Artwork is fetched straight from the drive API, and every page's LCP element
      is one of those images, so the DNS + TLS handshake should not wait for the
      first `<img>` to be parsed. Plain preconnect rather than CORS: these are
      `<img>` requests, which are not cross-origin fetches.
    */
    { rel: "preconnect", href: config.public.apiBaseUrl },
  ],
});
</script>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(root) {
  animation-name: blur-out;
}

::view-transition-new(root) {
  animation-name: blur-in;
}

::view-transition-old(breadcrumb),
::view-transition-new(breadcrumb) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(breadcrumb) {
  animation-name: breadcrumb-out;
}

::view-transition-new(breadcrumb) {
  animation-name: breadcrumb-in;
}

::view-transition-old(post-card),
::view-transition-new(post-card) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(post-card) {
  animation-name: post-card-out;
}

::view-transition-new(post-card) {
  animation-name: post-card-in;
}

@keyframes blur-out {
  from {
    opacity: 1;
    filter: blur(0);
  }
  to {
    opacity: 0;
    filter: blur(8px);
  }
}

@keyframes blur-in {
  from {
    opacity: 0;
    filter: blur(8px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes breadcrumb-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-12px);
  }
}

@keyframes breadcrumb-in {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes post-card-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}

@keyframes post-card-in {
  from {
    opacity: 0;
    transform: scale(1.02);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
