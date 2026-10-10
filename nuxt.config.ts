import tailwindcss from "@tailwindcss/vite";

const nitroDataDir = process.env.NITRO_DATA_DIR?.trim() || ".data";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@pinia/nuxt",
    "@nuxt/image",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "nuxt-og-image",
    "nuxt-shiki",
    "@unlazy/nuxt",
  ],
  shiki: {
    dynamic: true,
    bundledLangs: ["cpp", "rust", "go", "python", "typescript", "javascript"],
    bundledThemes: ["github-light", "github-dark", "ayu-light", "ayu-mirage"],
  },
  experimental: {
    viewTransition: true,
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith("sk-"),
    },
  },
  css: ["~/assets/css/main.css"],
  /*
    Fonts are self-hosted so the OG renderer (which only reads globally emitted
    `@font-face` rules) and the site resolve the same files. Latin is Nunito,
    the family the site's `--font-sans` already names; CJK is a single-file
    Noto Sans SC, because Google's sliced CJK subsets would mean hundreds of
    files per OG render.
  */
  fonts: {
    families: [
      {
        name: "Nunito",
        src: "/fonts/Nunito-Regular.woff2",
        weight: 400,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-Medium.woff2",
        weight: 500,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-SemiBold.woff2",
        weight: 600,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-Bold.woff2",
        weight: 700,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-ExtraBold.woff2",
        weight: 800,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-Black.woff2",
        weight: 900,
        style: "normal",
        global: true,
      },
      {
        name: "Noto Sans SC",
        src: "/fonts/NotoSansSC-Regular.woff2",
        weight: 400,
        style: "normal",
        global: true,
      },
      {
        name: "Noto Sans SC",
        src: "/fonts/NotoSansSC-Bold.woff2",
        weight: 700,
        style: "normal",
        global: true,
      },
    ],
  },
  site: {
    url: "https://littlesheep.me",
    name: "Goatshed 山羊寒舍",
    description:
      "LittleSheep's personal blog powered by Solar Network. About tech, programming, and life.",
  },
  ogImage: {
    enabled: true,
    defaults: {
      // 1.91:1, the ratio every unfurler crops to; templates are laid out for it.
      width: 1200,
      height: 630,
    },
    security: {
      renderTimeout: 60000,
      /*
        Drive-file variants are rendered by the API on first request (~5s cold
        for a camera original), so the 3s default drops the card artwork and
        silently falls back to the plain panel.
      */
      imageFetchTimeout: 15000,
    },
  },
  app: {
    head: {
      title: "Goatshed",
      titleTemplate: "%s | Goatshed",
      htmlAttrs: {
        lang: "zh-CN",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "欢迎来到小羊之家 ( *｀ω´)",
        },
        {
          name: "keywords",
          content: "littlesheep, blog, developer, Solar Network",
        },
        { name: "author", content: "littlesheep" },
        { name: "theme-color", content: "#f0f0f0" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Goatshed" },
        {
          property: "og:title",
          content: "Goatshed 山羊寒舍",
        },
        {
          property: "og:description",
          content: "欢迎来到小羊之家 ( *｀ω´)",
        },
        /*
          `og:image` and the Twitter image tags are injected per page by
          nuxt-og-image; the static default here pointed at a file that never
          existed.
        */
        { property: "og:url", content: "https://littlesheep.me" },
        { property: "og:locale", content: "zh_CN" },
        {
          name: "twitter:title",
          content: "Goatshed 山羊寒舍",
        },
        {
          name: "twitter:description",
          content: "欢迎来到小羊之家 ( *｀ω´)",
        },
      ],
      script: [
        {
          defer: true,
          src: "https://cloud.umami.is/script.js",
          "data-website-id": "43beabf3-549a-44ac-add8-8d64229c01e5",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          // Noto Sans SC is self-hosted (see `fonts` above) so the OG renderer
          // gets whole-font files; it is deliberately not requested twice.
          href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500;600&display=swap",
        },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "canonical", href: "https://littlesheep.me" },
      ],
    },
  },
  runtimeConfig: {
    /** Last.fm key for the about page's music section; empty disables it. */
    lastfmApiKey: "",
    public: {
      apiBaseUrl: "https://api.solian.app",
      oauthProviderName: "Solarpass",
      /** Last.fm account the about page's music section reads. */
      lastfmUser: "LittleSheepOvO",
    },
  },
  nitro: {
    storage: {
      data: {
        driver: "fs",
        base: nitroDataDir,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
