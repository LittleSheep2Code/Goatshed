<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-xl">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-8 text-center">
                <Coffee class="mx-auto h-12 w-12 text-primary" />
                <h1 class="mt-4 text-3xl font-black">感谢你的支持</h1>
                <p class="mt-3 text-sm text-base-content/60">
                    小羊的商店已经下线了，谢谢一路以来的支持。
                </p>
                <p class="mt-1 text-sm text-base-content/60">
                    如果你愿意请小羊喝杯咖啡，可以通过爱发电继续支持。
                </p>

                <a
                    href="https://ifdian.net/@littlesheep"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-primary mt-6 gap-2"
                >
                    <HeartHandshake class="h-4 w-4" />
                    前往爱发电
                </a>

                <p class="mt-4 text-xs text-base-content/40">
                    ifdian.net/@littlesheep
                </p>
            </div>

            <p class="mt-6 text-center text-sm">
                <NuxtLink to="/donate" class="text-primary hover:underline">
                    查看打赏排行榜
                </NuxtLink>
            </p>
        </div>
    </main>
</template>

<script setup lang="ts">
import { Coffee, HeartHandshake } from "lucide-vue-next";

useHead({
    title: "支持小羊",
    meta: [
        { name: "description", content: "支持小羊 - 通过爱发电请小羊喝杯咖啡" },
    ],
});

defineOgImage("UniOgImage", {
    title: "支持小羊",
    description: "通过爱发电请小羊喝杯咖啡，帮这个博客继续写下去。",
    eyebrow: "支持",
});
</script>
