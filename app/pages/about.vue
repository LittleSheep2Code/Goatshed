<template>
  <main ref="root" class="page-shell about-page py-8">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <!-- identity card: whoami -->
      <!--
        `overflow-clip`, not `overflow-hidden`: hidden would make this panel a
        scroll container, and the hero grid's `view()` timeline would then track
        the panel instead of the document and never advance. For that same
        reason this is the one slide that opts out of the panel scrolling below.
      -->
      <section data-slide class="slide-identity">
        <div class="app-panel relative overflow-clip">
          <div class="hero-grid" aria-hidden="true" />

          <div class="hero-body relative flex flex-col gap-6 p-6 sm:p-8">
            <p class="cmd">
              guest@goatshed <span class="opacity-40">~</span>
              <span class="text-primary">$</span> whoami
            </p>

            <div
              class="grid justify-items-center gap-5 text-center sm:grid-cols-[auto_1fr] sm:items-center sm:justify-items-start sm:text-left"
            >
              <div class="avatar-ring">
                <UnLazyImage
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  :alt="displayName"
                  :blurhash="avatarBlurhash"
                  class="h-24 w-24 rounded-2xl object-cover"
                />
                <div
                  v-else
                  class="flex h-24 w-24 items-center justify-center rounded-2xl bg-base-200 text-2xl font-bold"
                >
                  {{ initials }}
                </div>
              </div>

              <div class="min-w-0">
                <h1 class="hero-name">
                  <span class="name-cycle">
                    <span>ラムです</span>
                    <span>LittleSheep</span>
                    <span>阳绛</span>
                    <span>小羊</span>
                  </span>
                </h1>
                <p class="hero-role">
                  高中生 / 开发者 /
                  <span class="text-primary">Solsynth</span>
                </p>
                <p class="hero-tagline">
                  高级全干工程师 · 城市做题小家 · VOCALOID 品鉴者
                </p>
              </div>
            </div>

            <blockquote class="quote">
              <p>写代码是热爱，写到身体都崩坏。</p>
              <cite>LittleSheep @ 2026</cite>
            </blockquote>

            <dl class="facts">
              <div class="fact">
                <dt>年龄</dt>
                <dd>{{ age }} 岁</dd>
              </div>
              <div class="fact">
                <dt>现居</dt>
                <dd>深圳</dd>
              </div>
              <div class="fact">
                <dt>码龄</dt>
                <dd>7–8 年</dd>
              </div>
              <div class="fact">
                <dt>生日</dt>
                <dd>11/27</dd>
              </div>
            </dl>

            <div class="flex flex-wrap justify-center gap-2 sm:justify-start">
              <NuxtLink to="/posts/littlesheep" class="btn btn-sm btn-primary">
                读博客
              </NuxtLink>
              <NuxtLink
                to="/moments/littlesheep0v0"
                class="btn btn-sm btn-outline"
              >
                看动态
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- summary -->
      <section data-slide>
        <div class="app-panel p-6 sm:p-8">
          <header class="section-head" data-reveal="head">
            <span class="key">summary</span>
            <h2>自述</h2>
            <span class="rule" />
          </header>

          <div class="copy">
            <p data-reveal>
              写代码大概七八年了。从 Solar Network
              起家，把网关、社区、网盘、聊天和账号系统一路自己做下来，现在 Solsynth
              的东西基本都跑在上面。
            </p>
            <p data-reveal :style="{ '--reveal-delay': revealDelay(1, 80) }">
              高中在读，白天做题，晚上折腾服务器。挺怀念没有 AI
              之前手写代码的日子，但没有 AI 我也维护不动这么多项目，想想挺矛盾。
            </p>
          </div>
        </div>
      </section>

      <!-- projects -->
      <section data-slide>
        <div class="app-panel p-6 sm:p-8">
          <header class="section-head" data-reveal="head">
            <span class="key">projects</span>
            <h2>在做的东西</h2>
            <span class="rule" />
          </header>

          <div class="projects">
            <article
              v-for="(project, index) in projects"
              :key="project.letter"
              class="project"
              :class="{ 'project-wide': project.wide }"
              data-reveal="card"
              :style="{ '--reveal-delay': revealDelay(index, 70) }"
            >
              <div class="project-head">
                <span class="letter">{{ project.letter }}</span>
                <h3>{{ project.name }}</h3>
                <span class="project-status">{{ project.status }}</span>
              </div>
              <p class="project-desc">{{ project.desc }}</p>
              <ul v-if="project.stack.length" class="chips">
                <li
                  v-for="(tech, chipIndex) in project.stack"
                  :key="tech"
                  class="chip"
                  data-reveal="chip"
                  :style="{
                    '--reveal-delay': revealDelay(chipIndex, 35, 6, 140),
                  }"
                >
                  {{ tech }}
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <!-- stack -->
      <section data-slide>
        <div class="app-panel p-6 sm:p-8">
          <header class="section-head" data-reveal="head">
            <span class="key">stack</span>
            <h2>技术栈</h2>
            <span class="rule" />
          </header>

          <div class="tiers">
            <div
              v-for="(tier, index) in stackTiers"
              :key="tier.label"
              class="tier"
              data-reveal
              :style="{ '--reveal-delay': revealDelay(index, 80) }"
            >
              <span class="tier-label">{{ tier.label }}</span>
              <ul class="chips">
                <li
                  v-for="(item, chipIndex) in tier.items"
                  :key="item"
                  class="chip"
                  :class="{ 'chip-refuse': tier.tone === 'refuse' }"
                  data-reveal="chip"
                  :style="{
                    '--reveal-delay': revealDelay(chipIndex, 30, 8, 100),
                  }"
                >
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- q&a -->
      <section data-slide>
        <div class="app-panel p-6 sm:p-8">
          <header class="section-head" data-reveal="head">
            <span class="key">q&amp;a</span>
            <h2>一問一答</h2>
            <span class="rule" />
          </header>

          <ol class="qa">
            <li
              v-for="(item, index) in qa"
              :key="item.q"
              class="qa-row"
              data-reveal="qa"
              :style="{ '--reveal-delay': revealDelay(index, 45, 9) }"
            >
              <span class="qa-mark">Q</span>
              <p class="qa-q">{{ item.q }}</p>
              <span class="qa-mark qa-mark-a">A</span>
              <p class="qa-a">{{ item.a }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- metadata -->
      <section data-slide>
        <div class="app-panel p-6 sm:p-8">
          <header class="section-head" data-reveal="head">
            <span class="key">meta</span>
            <h2>元数据</h2>
            <span class="rule" />
          </header>

          <div class="metadata-grid">
            <div
              v-for="(item, index) in metadata"
              :key="item.key"
              class="metadata-item"
              data-reveal="code"
              :style="{ '--reveal-delay': revealDelay(index, 110) }"
            >
              <span class="metadata-key">{{ item.key }}</span>
              <Shiki
                :lang="item.lang"
                :highlight-options="highlightOpts"
                :code="item.code"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- links -->
      <section data-slide>
        <div class="app-panel p-6 sm:p-8">
          <header class="section-head" data-reveal="head">
            <span class="key">links</span>
            <h2>逛逛别处</h2>
            <span class="rule" />
          </header>

          <div class="link-grid">
            <NuxtLink
              v-for="(link, index) in links"
              :key="link.to"
              :to="link.to"
              class="link-card"
              data-reveal
              :style="{ '--reveal-delay': revealDelay(index, 60) }"
            >
              <component :is="link.icon" class="link-icon" aria-hidden="true" />
              <span>{{ link.label }}</span>
            </NuxtLink>
          </div>

          <p class="mt-6 text-center text-xs text-base-content/50">
            <a href="https://solsynth.dev/zh/icp/202600004" target="_blank">
              羝 ICP 备 202600004 号
            </a>
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { FileText, Heart, House, NotebookText, Ticket } from "lucide-vue-next";
import type { Publisher } from "~/types/publisher";

const root = ref<HTMLElement | null>(null);

/** Staggered reveal delay: `step` per index, held flat past `cap` entries. */
function revealDelay(index: number, step = 45, cap = 8, offset = 0) {
  return `${offset + Math.min(index, cap) * step}ms`;
}

useScrollReveal(root);
useSlidePager(root);

const config = useRuntimeConfig();
const { data: publisher } = await useFetch<Publisher>(
  "/api/publishers/littlesheep",
  { default: () => null },
);

const displayName = computed(
  () => publisher.value?.nick || publisher.value?.name || "littlesheep",
);

const avatarUrl = computed(() => {
  const picture = publisher.value?.picture;
  if (!picture?.id) return "";
  return (
    picture.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(picture.id)}`
  );
});

const avatarBlurhash = computed(
  () => publisher.value?.picture?.blurhash || undefined,
);

const initials = computed(() => displayName.value.slice(0, 2).toUpperCase());

const age = computed(() => {
  const birthDate = new Date(2010, 10, 27);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    years--;
  }
  return years;
});

const projects = [
  {
    letter: "A",
    name: "Solar Network",
    status: "运营中",
    desc: "我的主力产品，也是 Solsynth 其他东西跑的地基：Blade 网关撑起微服务，上面长着社区、网盘、聊天和 Solarpass 账号系统。",
    stack: ["Go", "C#", "PostgreSQL", "Flutter", "Vue"],
    wide: true,
  },
  {
    letter: "B",
    name: "SolWatt",
    status: "客户端即将发布",
    desc: "给 Solar Network 配的一整套工作区：Ideask 待办、ElecPostsal 邮箱，还有网盘。邮箱能拿到 @solarpass.one 地址，也能绑自己的域名。",
    stack: ["Go", "Flutter"],
    wide: false,
  },
  {
    letter: "C",
    name: "Persona",
    status: "即将发布",
    desc: "Solar Network 的 AI。和手上的聊天 App 差不多，区别是 System Prompt 特调过，还能靠 MCP 和 Solar Network 插件直接替你干活。",
    stack: ["Go", "Flutter"],
    wide: false,
  },
  {
    letter: "D",
    name: "MaidKit",
    status: "3.0 已发布",
    desc: "本来是写给自己管服务器用的小工具，结果无心插柳，成了我 GitHub 上最受欢迎的项目。",
    stack: ["Go", "Flutter"],
    wide: false,
  },
  {
    letter: "?",
    name: "The Human Archive Project",
    status: "???",
    desc: "???",
    stack: [],
    wide: false,
  },
];

const stackTiers = [
  {
    label: "熟练",
    tone: "solid",
    items: [
      "Flutter",
      "Dart",
      "Go",
      "C#",
      "Vue",
      "Node.js",
      "TypeScript",
      "Tailwind CSS",
    ],
  },
  {
    label: "了解",
    tone: "solid",
    items: ["React", "React Native", "C/C++", "Python"],
  },
  { label: "不学", tone: "refuse", items: ["Rust"] },
];

const qa = [
  { q: "叫什么？", a: "小羊です。想正式一点，可以叫阳绛。" },
  {
    q: "什么势的 VTB？",
    a: "文字式 VTB，主要在 GitHub 和 Solar Network 活动（确信）。",
  },
  { q: "哪里人？", a: "中华羊国人，现居深圳。" },
  { q: "喜欢干什么？", a: "写代码。" },
  { q: "擅长什么？", a: "也是写代码。" },
  {
    q: "最喜欢吃什么？",
    a: "麦克唐纳德。喝的喜欢冰冰凉凉带气的褐色小甜水。",
  },
  { q: "最喜欢的游戏？", a: "Red Dead Redemption 2。" },
  { q: "喜欢的音乐？", a: "VOCALOID 和 J-Pop，P 主里喜欢 DECO*27。" },
  {
    q: "人生最大的梦想？",
    a: "让太阳系的每个地方都能看到 Solsynth 的 wordmark。",
  },
  { q: "最怕什么？", a: "死亡。我还没活到那么通透。" },
];

const metadata = [
  { key: "language", lang: "js", code: "['zh-CN', 'zh-TW', 'en-US']" },
  {
    key: "abilities",
    lang: "js",
    code: `(tech) =>
  ['rust']
  .includes(tech)
    ? throw Exception('Go fuck youself')
    : useOrLearn(tech)`,
  },
  {
    key: "system_prompt",
    lang: "js",
    code: `'你是一个十分具有攻击性的人类\\n' +
'精通各个编程语言和框架'`,
  },
  { key: "time_zone", lang: "js", code: "'Asia/Taipei'" },
];

const links = [
  { to: "/", label: "主页", icon: House },
  { to: "/posts/littlesheep", label: "博客", icon: FileText },
  { to: "/moments/littlesheep0v0", label: "日常", icon: NotebookText },
  { to: "/donate", label: "打赏", icon: Heart },
  { to: "/store", label: "商店", icon: Ticket },
];

const highlightOpts = {
  themes: { light: "github-light", dark: "github-dark" },
};

useHead({
  title: "关于",
  meta: [
    {
      name: "description",
      content:
        "littlesheep（小羊）：Solar Network、MaidKit 的作者，高中在读，现居深圳。",
    },
    { property: "og:title", content: "关于 - Goatshed" },
    {
      property: "og:description",
      content:
        "littlesheep（小羊）：Solar Network、MaidKit 的作者，高中在读，现居深圳。",
    },
    { property: "og:type", content: "profile" },
    { property: "og:url", content: "https://littlesheep.me/about" },
  ],
  link: [{ rel: "canonical", href: "https://littlesheep.me/about" }],
  /*
    The scroll reveals ship hidden, so without scripting nothing would ever
    unhide them. Vue rejects side-effect tags (<style>, <script>) in templates,
    which is why this rides in the head instead. Reduced motion gets its own
    rule in the page's stylesheet.
  */
  noscript: [
    {
      innerHTML:
        "<style>[data-reveal],[data-reveal] *{opacity:1 !important;transform:none !important;clip-path:none !important}</style>",
    },
  ],
});
</script>

<style scoped>
.about-page {
  /* Solar Network's brand blue-violet, the one color the owner actually claims. */
  --color-solar: #7577ba;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* --- hero ---------------------------------------------------------------- */

/* Overshoots the panel so the scroll parallax can drift it without exposing an edge. */
.hero-grid {
  position: absolute;
  inset: -4rem 0;
  background-image:
    linear-gradient(var(--color-base-200) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-base-200) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.5;
}

.cmd {
  margin: 0;
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

.avatar-ring {
  padding: 4px;
  border-radius: 1.15rem;
  background: linear-gradient(
    140deg,
    color-mix(in oklab, var(--color-solar) 70%, transparent),
    color-mix(in oklab, var(--color-primary) 55%, transparent)
  );
}

.hero-name {
  margin: 0;
  font-size: clamp(1.75rem, 1.2rem + 2.2vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

/*
  All four call-signs share one grid cell, so the block is as wide as the
  longest name and exactly one line tall. Nothing clips: the glyph ink is about
  1.35em (the kana resolve through a CJK fallback with taller metrics than
  Nunito), so a fixed-height masked row would shave the names and let the
  neighbouring rows bleed through.
*/
.name-cycle {
  display: grid;
}

.name-cycle > span {
  grid-area: 1 / 1;
}

/* Only the first name is on, so reduce-motion (and no-JS) still shows one. */
.name-cycle > span:nth-child(n + 2) {
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .name-cycle > span {
    animation: name-swap 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  .name-cycle > span:nth-child(2) {
    animation-delay: 3s;
  }

  .name-cycle > span:nth-child(3) {
    animation-delay: 6s;
  }

  .name-cycle > span:nth-child(4) {
    animation-delay: 9s;
  }
}

/* One name per 3s slot; each hands over across the 0.36s on either side of the boundary. */
@keyframes name-swap {
  0% {
    opacity: 0;
    transform: translateY(0.35em);
  }
  3%,
  25% {
    opacity: 1;
    transform: none;
  }
  28%,
  100% {
    opacity: 0;
    transform: translateY(-0.35em);
  }
}

.hero-role {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.hero-tagline {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

.quote {
  margin: 0;
  padding: 0.85rem 1.25rem;
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-box) var(--radius-box) 0;
  background: color-mix(in oklab, var(--color-base-200) 60%, transparent);
  font-style: italic;
}

.quote p {
  margin: 0;
  line-height: 1.4;
}

.quote cite {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  font-style: normal;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
  margin: 0;
  padding-top: 1.1rem;
  border-top: 1px solid
    color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

@media (width >= 40rem) {
  .facts {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .fact + .fact {
    padding-left: 1rem;
    border-left: 1px solid
      color-mix(in oklab, var(--color-base-300) 70%, transparent);
  }
}

.fact dt {
  font-family: var(--mono);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.fact dd {
  margin: 0.2rem 0 0;
  font-size: 0.95rem;
  font-weight: 600;
}

/* --- section chrome ------------------------------------------------------ */

/*
  Eyebrow over title, hairline trailing the title: two grid rows, the lower one
  a content-sized title plus a rule that takes whatever is left. The quotes come
  from `::before` / `::after`, so the markup stays plain text.
*/
.section-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "key key"
    "title rule";
  align-items: baseline;
  gap: 0.1rem 0.85rem;
  margin-bottom: 1.1rem;
}

.key {
  grid-area: key;
  font-family: var(--mono);
  font-size: 0.72rem;
  color: color-mix(
    in oklab,
    var(--color-primary) 75%,
    var(--color-base-content)
  );
}

.key::before {
  content: '"';
  opacity: 0.5;
}

.key::after {
  content: '"';
  opacity: 0.5;
}

.section-head h2 {
  grid-area: title;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.rule {
  grid-area: rule;
  align-self: center;
  height: 1px;
  background: color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

/* Drawn in by the head's reveal; at rest it is an empty line. */
.section-head .rule {
  transform: scaleX(0);
  transform-origin: left;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.8;
  color: color-mix(in oklab, var(--color-base-content) 88%, transparent);
}

.copy p {
  margin: 0;
}

/* --- projects ------------------------------------------------------------ */

.projects {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

@media (width >= 40rem) {
  .projects {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-wide {
    grid-column: 1 / -1;
  }
}

.project {
  padding: 1.1rem 1.15rem;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 75%, transparent);
  border-radius: var(--radius-box);
  background: color-mix(in oklab, var(--color-base-200) 40%, transparent);
}

.project-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.project-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.5rem;
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 600;
  background: color-mix(in oklab, var(--color-solar) 20%, transparent);
  color: color-mix(in oklab, var(--color-solar) 80%, var(--color-base-content));
}

/* Not `.status`: daisyUI already ships one as a fixed-size dot component. */
.project-status {
  margin-left: auto;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 0.66rem;
  white-space: nowrap;
  background: color-mix(in oklab, var(--color-base-300) 45%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
}

.project-desc {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  line-height: 1.7;
  color: color-mix(in oklab, var(--color-base-content) 80%, transparent);
}

/* --- chips --------------------------------------------------------------- */

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.chip {
  padding: 0.15rem 0.5rem;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 85%, transparent);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 0.68rem;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
}

.chip-refuse {
  border-color: color-mix(in oklab, var(--color-error) 45%, transparent);
  color: color-mix(in oklab, var(--color-error) 80%, var(--color-base-content));
  text-decoration: line-through;
  text-decoration-color: color-mix(in oklab, var(--color-error) 50%, transparent);
}

/* --- stack --------------------------------------------------------------- */

.tiers {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tier {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr);
  gap: 1rem;
  align-items: baseline;
}

.tier .chips {
  margin: 0;
}

.tier-label {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
}

/* --- q&a ----------------------------------------------------------------- */

.qa {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.qa-row {
  display: grid;
  grid-template-columns: 0.9rem minmax(0, 1fr);
  gap: 0.15rem 0.7rem;
}

.qa-mark {
  font-family: var(--mono);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.6;
  color: color-mix(in oklab, var(--color-primary) 80%, transparent);
}

.qa-mark-a {
  color: color-mix(in oklab, var(--color-solar) 85%, var(--color-base-content));
}

.qa-q {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.6;
}

.qa-a {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: color-mix(in oklab, var(--color-base-content) 82%, transparent);
}

/* --- metadata ------------------------------------------------------------ */

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.metadata-key {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

.metadata-key::before {
  content: '"';
  opacity: 0.5;
}

.metadata-key::after {
  content: '":';
  opacity: 0.5;
}

.metadata-item pre {
  margin: 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 70%, transparent);
  border-radius: 0.75rem;
  overflow-x: auto;
}

.metadata-item pre,
.metadata-item :deep(pre code) {
  font-family: var(--mono);
  font-size: 0.72rem;
  line-height: 1.6;
}

/* Shiki emits one `.line` per source line; without this they collapse to a single row. */
.metadata-item :deep(.line) {
  display: block;
  min-height: 1.2em;
}

/* --- links --------------------------------------------------------------- */

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 80%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in oklab, var(--color-base-200) 40%, transparent);
  color: inherit;
  text-decoration: none;
}

.link-card:hover {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  color: var(--color-primary);
}

.link-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-primary);
}

.link-card span {
  font-size: 0.875rem;
  font-weight: 500;
}

/* --- slide mode ---------------------------------------------------------- */

/*
  Every panel gets a screen of its own, at every size. The row is only a frame:
  the card inside keeps its own height and padding and is centred in what is
  left, so a short panel does not stretch into a full-height slab.

  `safe center` is what lets this hold on a phone, where a panel is often taller
  than the screen: plain `center` would push its top above the scrollport, out of
  reach.
*/
.about-page {
  padding-block: 0;
}

/* Rows sit flush; the air between cards comes from their own padding. */
.about-page > div {
  gap: 0;
}

.about-page [data-slide] {
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  min-height: calc(100dvh - var(--app-bar-height));
  padding-block: 2rem;
  scroll-snap-align: start;
}

/*
  A panel taller than a screen scrolls inside itself rather than pushing the row
  taller, so every stop stays one screen and `useSlidePager` can hand the wheel
  to the panel until it reaches its end.

  That needs a definite height: with only a minimum, the row is content-sized
  and the panel's `max-height` has nothing to measure against. The identity
  panel is excluded from both rules — it has to stay a clip box for the hero
  grid's `view()` timeline, so its row keeps growing and the pager hands its
  wheel back to the browser instead.
*/
.about-page [data-slide]:not(.slide-identity) {
  height: calc(100dvh - var(--app-bar-height));
}

.about-page [data-slide]:not(.slide-identity) > .app-panel {
  max-height: 100%;
  overflow-y: auto;
}

/*
  Snapping is native only where the panels fit a screen. Everywhere else the
  scroller is left alone: native snapping drags a deliberately small movement
  back to where it started, which reads as a flash, and the wheel pager in
  `useSlidePager` is what pages those sizes instead. `scroll-padding-top` stays
  at every size so paging aligns rows under the app bar.

  `html:has(...)` targets the scrollport itself, so these rules stop applying the
  moment this page's markup is gone, even though the stylesheet is not scoped.
*/
:global(html:has(.about-page)) {
  scroll-padding-top: var(--app-bar-height);
}

/*
  Where the panels do fit a screen, the deck turns strict: one flick, one panel.
  The gate is set by the tallest card — the projects grid, ~612px, which leaves
  ~20px of slack at the smallest size allowed here.
*/
@media (min-width: 64rem) and (min-height: 48rem) {
  :global(html:has(.about-page)) {
    scroll-snap-type: y mandatory;
  }

  /* One flick, one panel: nothing may rest between them. */
  .about-page [data-slide] {
    scroll-snap-stop: always;
  }

  /* Ten stacked Q&A rows outgrow the row; in two columns they fit with air. */
  .about-page [data-slide] .qa {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 2rem;
  }
}

/* --- scroll motion ------------------------------------------------------- */

/*
  Reveals: elements ship hidden and are played in by `.is-revealed`, which the
  page adds on intersection. The hidden state is plain CSS so the two audiences
  that never get that class — reduced motion, and scripting off (see the page's
  <noscript>) — are covered without JavaScript. Animations rather than
  transitions, so hover transitions on the same elements survive.
*/
[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 18px, 0);
}

[data-reveal].is-revealed {
  animation: reveal-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--reveal-delay, 0ms);
}

[data-reveal="chip"] {
  opacity: 0;
  transform: translate3d(0, 10px, 0) scale(0.94);
}

[data-reveal="chip"].is-revealed {
  animation-name: reveal-pop;
  animation-duration: 0.5s;
}

[data-reveal="qa"] {
  opacity: 0;
  transform: translate3d(-14px, 10px, 0);
}

[data-reveal="qa"].is-revealed {
  animation-name: reveal-slide;
}

/* Code blocks wipe in from the left rather than rising. */
[data-reveal="code"] > * {
  clip-path: inset(0 100% 0 0);
}

/*
  The clip sits on the children, not on the element itself: clipping the observed
  element would zero its intersection rect and the observer would never fire for it.
*/
[data-reveal="code"].is-revealed > * {
  animation: reveal-wipe 0.7s cubic-bezier(0.16, 1, 0.3, 1)
    var(--reveal-delay, 0ms) both;
}

/* Pieces that ride along with the element carrying the reveal. */
.project .letter {
  opacity: 0;
}

.project.is-revealed .letter {
  animation: letter-pop 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) 0.15s both;
}

.section-head.is-revealed .rule {
  animation: rule-draw 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
}

@keyframes reveal-rise {
  from {
    opacity: 0;
    transform: translate3d(0, 18px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes reveal-pop {
  from {
    opacity: 0;
    transform: translate3d(0, 10px, 0) scale(0.94);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes reveal-slide {
  from {
    opacity: 0;
    transform: translate3d(-14px, 10px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes reveal-wipe {
  from {
    opacity: 0;
    clip-path: inset(0 100% 0 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

@keyframes letter-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rule-draw {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* The hero card is above the fold, so it arrives on load rather than on scroll. */
@media (prefers-reduced-motion: no-preference) {
  .hero-body {
    animation: hero-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /*
    Where scroll-driven timelines exist, the grid keeps drifting as the card
    leaves the viewport, which reads as depth behind the copy. Longhands on
    purpose: the `animation` shorthand would reset `animation-timeline`.
  */
  @supports (animation-timeline: view()) {
    .hero-grid {
      animation-name: hero-grid-drift;
      animation-duration: auto;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: cover 55% cover 100%;
    }
  }
}

@keyframes hero-in {
  from {
    opacity: 0;
    transform: translate3d(0, 14px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes hero-grid-drift {
  to {
    transform: translate3d(0, 4rem, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  [data-reveal] * {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
    animation: none !important;
  }
}
</style>
