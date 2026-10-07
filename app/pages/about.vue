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

                    <div
                        class="hero-body relative flex flex-col gap-5 p-6 sm:gap-6 sm:p-8"
                    >
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
                                <p
                                    class="hero-meta flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start"
                                >
                                    <span class="hero-handle"
                                        >@{{ handle }}</span
                                    >
                                </p>
                                <p class="hero-role">高中生 / 开发者</p>
                                <p class="hero-tagline">
                                    高级全干工程师 · 城市做题小家 · VOCALOID
                                    品鉴者
                                </p>
                            </div>
                        </div>

                        <blockquote class="quote rounded-xl">
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
                            <div class="fact">
                                <dt>语言</dt>
                                <dd>简体 · 繁体 · English</dd>
                            </div>
                            <div class="fact">
                                <dt>时区</dt>
                                <dd>Asia/Taipei</dd>
                            </div>
                        </dl>

                        <!--
                            Where else the owner lives: carriers they linked plus
                            their public email, straight from Solar Network.
                            Absent when it has none.
                        -->
                        <nav
                            v-if="connectLinks.length"
                            class="connect"
                            aria-label="社交与联系方式"
                        >
                            <a
                                v-for="link in connectLinks"
                                :key="link.provider"
                                class="connect-chip"
                                :href="link.url"
                                :aria-label="
                                    link.handle
                                        ? `${link.label} ${link.handle}`
                                        : undefined
                                "
                                :target="link.external ? '_blank' : undefined"
                                :rel="link.external ? 'me noopener' : undefined"
                            >
                                <ConnectionIcon
                                    :provider="link.provider"
                                    class="connect-icon"
                                />
                                <span class="connect-label">{{
                                    link.label
                                }}</span>
                                <span v-if="link.handle" class="connect-handle">
                                    {{ link.handle }}
                                </span>
                            </a>
                        </nav>
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
                        <p>
                            <span data-reveal>
                                大概十年前开始玩
                                Minecraft，单纯觉得「创造」的感觉很快乐。
                                后来接着这个契机了解到了 Mods
                                和插件的开发，走上了写代码这这条不归路。
                                后来电子阳痿了，但是所需的创造的快感已经能在写代码中取得了。
                            </span>

                            <span
                                data-reveal
                                :style="{
                                    '--reveal-delay': revealDelay(1, 80),
                                }"
                            >
                                之前打过一阵子 OI，蓝桥杯、CSP
                                都试过。但是感觉离自己想象中的差远了，遂决定没有现役就开始退役（这不重要）
                                专心写代码，做自己的东西。
                            </span>
                        </p>

                        <p>
                            <span
                                data-reveal
                                :style="{
                                    '--reveal-delay': revealDelay(1, 80 * 2),
                                }"
                            >
                                早期像个无头苍蝇一样到处挖坑，也没有什么拿得出手的作品，
                                就这样浪费了三、四年时光。不过好歹积累了一些经验出来。
                            </span>
                            <span
                                data-reveal
                                :style="{
                                    '--reveal-delay': revealDelay(1, 80 * 3),
                                }"
                            >
                                后来，不知道为什么脑子抽了想做个社交媒体，
                                于是就有了 Solar Network。
                            </span>
                        </p>

                        <NuxtLink
                            class="copy-link text-right"
                            to="/posts/littlesheep/littlesheep-self-introduction"
                            >了解更多？</NuxtLink
                        >
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
                            :key="project.name"
                            class="project"
                            :class="{ 'project-wide': project.wide }"
                            data-reveal="card"
                            :style="{
                                '--reveal-delay': revealDelay(index, 70),
                            }"
                        >
                            <div class="project-head">
                                <!--
                                    The project's own mark opens the card. Where
                                    it has none, the tile falls back to the
                                    letter, the way the corner falls back to the
                                    status label.
                                -->
                                <picture
                                    v-if="project.icon"
                                    class="project-icon"
                                >
                                    <source
                                        v-if="project.icon.dark"
                                        :srcset="project.icon.dark"
                                        media="(prefers-color-scheme: dark)"
                                    />
                                    <img
                                        :src="project.icon.light"
                                        alt=""
                                        width="24"
                                        height="24"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </picture>
                                <span v-else class="letter">{{
                                    project.letter
                                }}</span>
                                <h3>{{ project.name }}</h3>
                                <!--
                                    The repo badge takes the corner the status
                                    label used to hold: the mark always, the
                                    count only once the project has earned one.
                                -->
                                <a
                                    v-if="project.repo"
                                    class="project-repo"
                                    :href="`https://github.com/${project.repo}`"
                                    target="_blank"
                                    rel="noopener"
                                    :aria-label="`在 GitHub 上查看 ${project.repo}`"
                                >
                                    <ConnectionIcon
                                        provider="github"
                                        class="project-repo-icon"
                                    />
                                    <span
                                        v-if="project.stars"
                                        class="project-stars"
                                    >
                                        <Star class="project-star-icon" />
                                        {{ formatCount(project.stars) }}
                                    </span>
                                </a>
                                <span v-else class="project-status">{{
                                    project.status
                                }}</span>
                            </div>
                            <p class="project-desc">{{ project.desc }}</p>
                            <ul v-if="project.stack.length" class="chips">
                                <li
                                    v-for="(tech, chipIndex) in project.stack"
                                    :key="tech"
                                    class="chip"
                                    data-reveal="chip"
                                    :style="{
                                        '--reveal-delay': revealDelay(
                                            chipIndex,
                                            35,
                                            6,
                                            140,
                                        ),
                                    }"
                                >
                                    {{ tech }}
                                </li>
                            </ul>
                        </article>
                    </div>
                </div>
            </section>

            <!-- skills -->
            <section data-slide>
                <div class="app-panel p-6 sm:p-8">
                    <header class="section-head" data-reveal="head">
                        <span class="key">skills</span>
                        <h2>技能栈</h2>
                        <span class="rule" />
                    </header>

                    <div class="tiers">
                        <div
                            v-for="(tier, index) in stackTiers"
                            :key="tier.label"
                            class="tier"
                            data-reveal
                            :style="{
                                '--reveal-delay': revealDelay(index, 80),
                            }"
                        >
                            <span class="tier-label">{{ tier.label }}</span>
                            <ul class="chips">
                                <li
                                    v-for="(item, chipIndex) in tier.items"
                                    :key="item"
                                    class="chip"
                                    :class="{
                                        'chip-refuse': tier.tone === 'refuse',
                                    }"
                                    data-reveal="chip"
                                    :style="{
                                        '--reveal-delay': revealDelay(
                                            chipIndex,
                                            30,
                                            8,
                                            100,
                                        ),
                                    }"
                                >
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <!--
        music: live Last.fm readout. The card is the section's headline (playing
        now, or the freshest scrobble), the log below it is what scrobbling
        actually leaves behind, and the chart encodes playcounts as bar lengths
        so the top of the list is legible at a glance.
      -->
            <section v-if="music" data-slide>
                <div class="app-panel p-6 sm:p-8">
                    <header class="section-head" data-reveal="head">
                        <span class="key">music</span>
                        <h2>在听什么</h2>
                        <span class="rule" />
                    </header>

                    <div class="music">
                        <div class="music-log">
                            <article
                                v-if="leadTrack"
                                class="track-card"
                                data-reveal
                            >
                                <img
                                    v-if="leadTrack.art"
                                    :src="leadTrack.art"
                                    alt=""
                                    class="track-art"
                                />
                                <span
                                    v-else
                                    class="track-art track-art-empty"
                                    aria-hidden="true"
                                >
                                    <Music />
                                </span>

                                <div class="track-body">
                                    <p
                                        class="track-state"
                                        :class="{
                                            'track-state-live':
                                                leadTrack.nowPlaying,
                                        }"
                                    >
                                        {{
                                            leadTrack.nowPlaying
                                                ? "NOW PLAYING"
                                                : "上次在听"
                                        }}
                                        <span class="track-when">
                                            {{
                                                formatRelativeTime(
                                                    leadTrack.playedAt ?? "",
                                                )
                                            }}
                                        </span>
                                    </p>
                                    <a
                                        class="track-name"
                                        :href="leadTrack.url"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        {{ leadTrack.name }}
                                    </a>
                                    <p class="track-artist">
                                        {{ leadTrack.artist }}
                                        <template v-if="leadTrack.album">
                                            · {{ leadTrack.album }}</template
                                        >
                                    </p>
                                </div>
                            </article>

                            <template v-if="ledger.length">
                                <p class="log-head">最近听的</p>
                                <ol class="ledger">
                                    <li
                                        v-for="(track, index) in ledger"
                                        :key="track.url + track.playedAt"
                                        class="ledger-row"
                                        data-reveal
                                        :style="{
                                            '--reveal-delay': revealDelay(
                                                index,
                                                40,
                                                6,
                                            ),
                                        }"
                                    >
                                        <img
                                            v-if="track.art"
                                            :src="track.art"
                                            alt=""
                                            class="ledger-art"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <span
                                            v-else
                                            class="ledger-art ledger-art-empty"
                                            aria-hidden="true"
                                        />
                                        <span class="ledger-text">
                                            <a
                                                class="ledger-title"
                                                :href="track.url"
                                                target="_blank"
                                                rel="noopener"
                                            >
                                                {{ track.name }}
                                            </a>
                                            <span class="ledger-artist">{{
                                                track.artist
                                            }}</span>
                                        </span>
                                        <time
                                            class="ledger-time"
                                            :datetime="
                                                track.playedAt ?? undefined
                                            "
                                        >
                                            {{
                                                formatRelativeTime(
                                                    track.playedAt ?? "",
                                                )
                                            }}
                                        </time>
                                    </li>
                                </ol>
                            </template>
                            <template v-if="music.genres.length">
                                <p class="log-head">
                                    常听曲风
                                </p>
                                <ul class="chips genre-chips">
                                    <li
                                        v-for="genre in music.genres"
                                        :key="genre.name"
                                        class="chip"
                                    >
                                        <a
                                            :href="genre.url"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ genre.name }}
                                            <span class="chip-count">{{
                                                genre.artists
                                            }}</span>
                                        </a>
                                    </li>
                                </ul>
                            </template>
                        </div>

                        <div class="chart" data-reveal>
                            <div class="chart-head">
                                <p class="log-head">排行</p>
                                <div
                                    class="chart-switch"
                                    role="group"
                                    aria-label="统计范围"
                                >
                                    <button
                                        v-for="option in periods"
                                        :key="option.period"
                                        type="button"
                                        class="chart-tab"
                                        :class="{
                                            'chart-tab-active':
                                                option.period === activePeriod,
                                        }"
                                        :aria-pressed="
                                            option.period === activePeriod
                                        "
                                        @click="activePeriod = option.period"
                                    >
                                        {{ option.label }}
                                    </button>
                                </div>
                            </div>

                            <ol v-if="chart?.tracks.length" class="chart-list">
                                <li
                                    v-for="(track, index) in chart.tracks"
                                    :key="activePeriod + track.url"
                                    class="chart-row"
                                    :style="{
                                        '--bar-delay': `${index * 45}ms`,
                                    }"
                                >
                                    <span class="chart-rank">{{
                                        String(index + 1).padStart(2, "0")
                                    }}</span>
                                    <img
                                        v-if="track.art"
                                        :src="track.art"
                                        alt=""
                                        class="chart-art"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <span
                                        v-else
                                        class="chart-art chart-art-empty"
                                        aria-hidden="true"
                                    />
                                    <span class="chart-title">
                                        <a
                                            class="chart-name"
                                            :href="track.url"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ track.name }}
                                        </a>
                                        <span class="chart-artist">{{
                                            track.artist
                                        }}</span>
                                    </span>
                                    <span class="chart-plays">{{
                                        formatCount(track.playcount ?? 0)
                                    }}</span>
                                    <span class="chart-bar">
                                        <span
                                            class="chart-bar-fill"
                                            :style="{
                                                width: `${((track.playcount ?? 0) / maxPlaycount) * 100}%`,
                                            }"
                                        />
                                    </span>
                                </li>
                            </ol>

                            <template v-if="chart?.artists.length">
                                <p class="log-head chart-artists-head">
                                    常听艺人
                                </p>
                                <ul class="chips chart-artists">
                                    <li
                                        v-for="artist in chart.artists"
                                        :key="artist.name"
                                        class="chip"
                                    >
                                        <a
                                            :href="artist.url"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ artist.name }}
                                            <span class="chip-count">{{
                                                formatCount(artist.playcount)
                                            }}</span>
                                        </a>
                                    </li>
                                </ul>
                            </template>
                        </div>
                    </div>

                    <dl class="stat-row music-stats" data-reveal>
                        <div
                            v-for="item in musicStats"
                            :key="item.label"
                            class="stat"
                            :title="item.hint"
                        >
                            <dt>{{ item.label }}</dt>
                            <dd>{{ item.value }}</dd>
                        </div>
                    </dl>

                    <p class="music-foot">
                        数据来自
                        <a
                            :href="music.user.url"
                            target="_blank"
                            rel="noopener"
                        >
                            Last.fm · @{{ music.user.name }}
                        </a>
                        · 更新于
                        {{ formatRelativeTime(music.updatedAt) }}
                    </p>
                </div>
            </section>

            <!--
        guestbook: the replies on the account's own "about" post — what visitors
        left on this page over on Solar Network. Read-only: the board is that
        post's reply thread, and the list stays out of the site's search index
        the way the article comments do.
      -->
            <section data-slide>
                <div class="app-panel p-6 sm:p-8">
                    <header class="section-head" data-reveal="head">
                        <span class="key">guestbook</span>
                        <h2>留言板</h2>
                        <span class="rule" />
                    </header>

                    <!--
            Composer first, then what it feeds. Client-only, like the widgets
            on the post pages: the custom element talks to Stargate with the
            signed-in user's Solar token, and its `sign-in` slot hands a guest
            to the site's own login instead of a second Solarpass sign-in.
          -->
                    <ClientOnly>
                        <sk-reply-composer
                            :post="GUESTBOOK_POST"
                            class="guestbook-composer"
                            placeholder="写下你的留言…"
                            submit-label="发送"
                        >
                            <span slot="sign-in" class="guestbook-signin">
                                <button
                                    class="guestbook-signin-link"
                                    type="button"
                                    @click="login(route.fullPath)"
                                >
                                    登录
                                </button>
                                后留言
                            </span>
                        </sk-reply-composer>
                    </ClientOnly>

                    <ul
                        v-if="guestbook.comments.length"
                        class="guestbook"
                        data-pagefind-ignore
                    >
                        <li
                            v-for="(reply, index) in guestbook.comments"
                            :key="reply.id"
                            class="guestbook-reply"
                            data-reveal
                            :style="{
                                '--reveal-delay': revealDelay(index, 40, 6),
                            }"
                        >
                            <img
                                v-if="reply.author?.avatar"
                                :src="reply.author.avatar"
                                :alt="replyName(reply)"
                                class="guestbook-avatar"
                                loading="lazy"
                                decoding="async"
                            />
                            <span
                                v-else
                                class="guestbook-avatar guestbook-avatar-empty"
                                aria-hidden="true"
                            >
                                {{ replyInitial(reply) }}
                            </span>

                            <div class="guestbook-body">
                                <p class="guestbook-meta">
                                    <span class="guestbook-author">{{
                                        replyName(reply)
                                    }}</span>
                                    <time
                                        class="guestbook-time"
                                        :datetime="reply.createdAt"
                                    >
                                        {{
                                            formatRelativeTime(reply.createdAt)
                                        }}
                                    </time>
                                </p>
                                <p class="guestbook-content">
                                    {{ reply.content }}
                                </p>
                            </div>
                        </li>
                    </ul>

                    <p
                        v-else
                        class="guestbook-empty"
                        data-reveal
                        data-pagefind-ignore
                    >
                        还没有留言，来写下第一条吧。
                    </p>
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
                            :style="{
                                '--reveal-delay': revealDelay(index, 60),
                            }"
                        >
                            <component
                                :is="link.icon"
                                class="link-icon"
                                aria-hidden="true"
                            />
                            <span>{{ link.label }}</span>
                        </NuxtLink>
                    </div>

                    <p class="mt-6 text-center text-xs text-base-content/50">
                        <a
                            href="https://solsynth.dev/zh/icp/202600004"
                            target="_blank"
                        >
                            羝 ICP 备 202600004 号
                        </a>
                    </p>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import {
    BadgeCheck,
    Coffee,
    FileText,
    Heart,
    House,
    Music,
    NotebookText,
    Star,
} from "lucide-vue-next";
import { OWNER_PUBLISHER } from "~/constants/publishers";
import { PROJECT_REPOS, type ProjectRepo } from "~/constants/projects";
import type { AccountLink } from "~/types/account";
import type { Comment, CommentListResponse } from "~/types/comment";
import type { MusicPeriod, MusicSnapshot } from "~/types/music";
import type { Publisher, PublisherStats } from "~/types/publisher";
import { formatCount } from "~/utils/number";
import { formatRelativeTime } from "~/utils/time";

const root = ref<HTMLElement | null>(null);

/** Staggered reveal delay: `step` per index, held flat past `cap` entries. */
function revealDelay(index: number, step = 45, cap = 8, offset = 0) {
    return `${offset + Math.min(index, cap) * step}ms`;
}

useScrollReveal(root);
useSlidePager(root);

const config = useRuntimeConfig();
const { data: publisher } = await useFetch<Publisher>(
    `/api/publishers/${OWNER_PUBLISHER}`,
    { default: () => null },
);

/** Platform handle, i.e. the account the page is a profile of. */
const handle = computed(() => publisher.value?.name || OWNER_PUBLISHER);

/*
  External identities, from the account's own connections and contact. Fetched
  through the server so the email contact stays a server-side concern and the
  links are in the markup at first paint.
*/
const { data: accountLinks } = await useFetch<AccountLink[]>(
    `/api/accounts/${OWNER_PUBLISHER}/links`,
    { default: () => [] },
);

/** Mail is a hand-off rather than a page: same tab, no `rel="me"` claim. */
const connectLinks = computed(() =>
    accountLinks.value.map((link) => ({
        ...link,
        external: !link.url.startsWith("mailto:"),
    })),
);

/*
  The listening readout. Last.fm is the one upstream allowed to be absent —
  unconfigured key, rate limit, an account that never scrobbled — so a failed
  fetch yields null and the whole section drops out rather than standing there
  empty. The server keeps a ten-minute snapshot, which is what makes this cheap
  enough to await during SSR.
*/
const { data: music } = await useFetch<MusicSnapshot | null>("/api/music", {
    default: () => null,
});

/*
  Repo badges for the projects section. GitHub is decoration on a card that
  already stands on its own, so a failed fetch yields an empty map and the cards
  keep their mark without a number.
*/
const { data: githubStars } = await useFetch<Record<string, number>>(
    "/api/github/stars",
    { default: () => ({}) },
);

/*
  The message board reads the replies on the account's own "about" post — the
  Solar Network post this page is published as. Those live upstream, so a failed
  read leaves an empty board rather than a dead page, the way the music card
  drops out when Last.fm has nothing.
*/
const GUESTBOOK_POST = "01a114b8-6008-7d6f-b905-8283ddff29ff";

const { data: guestbook, refresh: refreshGuestbook } =
    await useFetch<CommentListResponse>(
        `/api/posts/${GUESTBOOK_POST}/comments`,
        { query: { take: 50 }, default: () => ({ comments: [], total: 0 }) },
    );

const route = useRoute();
const { login } = useAuth();

/*
  The board refreshes off the widget's own broadcast rather than polling. The
  composer announces a successful post on `window` — the same signal
  `sk-replies-list` listens to — so a new reply lands here without a reload.
  Spelled out rather than imported: the package's entry is the browser bundle
  the client-only plugin already loads, and this is the name it documents.
*/
const REPLY_POSTED_EVENT = "sunkenland:reply-posted";

async function onReplyPosted(event: Event) {
    const detail = (event as CustomEvent<{ postId?: string }>).detail;
    if (detail?.postId !== GUESTBOOK_POST) return;

    await refreshGuestbook();

    /*
      The reveal observer only ever saw the rows that existed at mount, so rows
      a refresh brings in have to be revealed by hand — left alone they would
      sit at the hidden state forever. `nextTick` first: the list has not
      patched yet when `refresh` resolves.
    */
    await nextTick();
    root.value
        ?.querySelectorAll<HTMLElement>(".guestbook-reply:not(.is-revealed)")
        .forEach((row) => row.classList.add("is-revealed"));
}

onMounted(() => window.addEventListener(REPLY_POSTED_EVENT, onReplyPosted));
onBeforeUnmount(() =>
    window.removeEventListener(REPLY_POSTED_EVENT, onReplyPosted),
);

/** A reply's author, with the same anonymous fallback the rest of the site uses. */
function replyName(reply: Comment): string {
    return reply.author?.nick || reply.author?.name || "匿名";
}

/** What the avatar tile shows when the author has no picture. */
function replyInitial(reply: Comment): string {
    return replyName(reply).charAt(0).toUpperCase();
}

/** Chart windows, in Last.fm's own period vocabulary. */
const periods: { period: MusicPeriod; label: string }[] = [
    { period: "7day", label: "一周" },
    { period: "1month", label: "一月" },
    { period: "overall", label: "全部" },
];

/*
  A month by default: long enough to be representative, short enough to still
  answer "what is he into lately". Every window arrived with the snapshot, so
  switching costs no request.
*/
const activePeriod = ref<MusicPeriod>("1month");

const chart = computed(
    () =>
        music.value?.charts.find(
            (entry) => entry.period === activePeriod.value,
        ) ?? null,
);

/** The card carries what is playing, or the freshest scrobble between tracks. */
const leadTrack = computed(
    () => music.value?.nowPlaying ?? music.value?.recent[0] ?? null,
);

/** The card already holds the lead track, so the log picks up after it. */
const ledger = computed(() => {
    const recent = music.value?.recent ?? [];
    return music.value?.nowPlaying ? recent : recent.slice(1);
});

/** Bar lengths are shares of the top track, so the chart reads as a ranking. */
const maxPlaycount = computed(() =>
    Math.max(
        1,
        ...(chart.value?.tracks ?? []).map((track) => track.playcount ?? 0),
    ),
);

const musicStats = computed(() => {
    const stats = music.value?.stats;
    if (!stats) return [];
    return [
        {
            label: "有记录的听过的",
            value: formatCount(stats.scrobbles),
            hint: "累计记录次数",
        },
        {
            label: "艺人",
            value: stats.artists === null ? "—" : formatCount(stats.artists),
            hint: "听过的不同艺人",
        },
        {
            label: "曲目",
            value: stats.tracks === null ? "—" : formatCount(stats.tracks),
            hint: "听过的不同曲目",
        },
        {
            label: "起点",
            value: stats.since
                ? String(new Date(stats.since).getFullYear())
                : "—",
            hint: "第一次 scrobble 的年份",
        },
    ];
});

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

interface ProjectCard {
    name: string;
    desc: string;
    stack: string[];
    wide: boolean;
    /**
     * The project's own app icon, from its repo: the light mark, plus the dark
     * one where the project ships a dark variant. Null for the card whose
     * project has an icon yet to be designed.
     */
    icon: { light: string; dark?: string } | null;
    /** Tile glyph, kept only for the card that has no icon to show. */
    letter: string | null;
    /** Public repo the card's badge links to; null where there is nothing to point at. */
    repo: ProjectRepo | null;
    /** Corner label, kept only for the cards that have no repo to link to. */
    status: string | null;
}

const projectCards: ProjectCard[] = [
    {
        name: "Solar Network",
        status: null,
        repo: PROJECT_REPOS.solarNetwork,
        icon: {
            light: "/projects/solar-network.webp",
            dark: "/projects/solar-network-dark.webp",
        },
        desc: "我的主力产品，也是 Solsynth 其他东西跑的地基：Blade 网关撑起微服务，上面长着社区、网盘、聊天和 Solarpass 账号系统。",
        stack: ["Go", "C#", "PostgreSQL", "Flutter", "Vue"],
        wide: true,
    },
    {
        name: "SolWatt",
        status: null,
        repo: PROJECT_REPOS.solWatt,
        icon: {
            light: "/projects/solwatt.webp",
            dark: "/projects/solwatt-dark.webp",
        },
        desc: "给 Solar Network 配的一整套工作区：Ideask 待办、ElecPostsal 邮箱，还有网盘。邮箱能拿到 @solarpass.one 地址，也能绑自己的域名。",
        stack: ["Go", "Flutter"],
        wide: false,
    },
    {
        name: "Persona",
        status: null,
        repo: PROJECT_REPOS.persona,
        // Persynth ships one icon only, so the same pink mark carries both themes.
        icon: { light: "/projects/persona.webp" },
        desc: "Solar Network 的 AI。和手上的聊天 App 差不多，区别是 System Prompt 特调过，还能靠 MCP 和 Solar Network 插件直接替你干活。",
        stack: ["Go", "Flutter"],
        wide: false,
    },
    {
        name: "MaidKit",
        status: null,
        repo: PROJECT_REPOS.maidKit,
        icon: {
            light: "/projects/maidkit.webp",
            dark: "/projects/maidkit-dark.webp",
        },
        desc: "本来是写给自己管服务器用的小工具，结果无心插柳，成了我 GitHub 上最受欢迎的项目。",
        stack: ["Go", "Flutter"],
        wide: false,
    },
    {
        name: "The Human Archive Project",
        status: "???",
        repo: null,
        icon: null,
        letter: "?",
        desc: "???",
        stack: [],
        wide: false,
    },
];

/** Star count under which the badge keeps the mark and drops the number. */
const STAR_DISPLAY_MIN = 100;

/*
  Cards plus the count their badge shows: what GitHub reports, or 0 — the mark
  alone — for a card with no repo and for a repo under `STAR_DISPLAY_MIN`.
*/
const projects = computed(() =>
    projectCards.map((card) => {
        const stars = card.repo ? (githubStars.value[card.repo] ?? 0) : 0;
        return { ...card, stars: stars >= STAR_DISPLAY_MIN ? stars : 0 };
    }),
);

/*
  Read top-down from what pays the bills to what keeps the body running: two
  tiers of code, then the non-code making (video is the other half of every
  project's public face), then the firmware nobody had to install. The comic
  tiers stay honest — every chip in them is something the owner does routinely.
  `tone: "refuse"` strikes a chip through and is spent on the one genuine
  refusal.
*/
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
    {
        label: "手艺",
        tone: "solid",
        items: [
            "视频剪辑",
            "Final Cut Pro",
            "Motion",
            "Pixelmator Pro",
            "Logic Pro",
            "Minecraft 建筑",
        ],
    },
    {
        label: "人类固件",
        tone: "solid",
        items: ["呼吸", "眨眼", "心跳", "消化", "打喷嚏", "睡眠", "发呆"],
    },
    { label: "不学", tone: "refuse", items: ["Rust"] },
];

/*
  Two entries that only land in the syntax they are written in, so they stay
  code rather than copy: the Rust refusal, hung on the skills card under the tier
  that names it, and the personality prompt, under the self-description it
  belongs to. The locales and the time zone that came with them read better as
  plain facts, and live on the identity card.
*/
const meta = {
    abilities: {
        lang: "js",
        code: `(tech) =>
  ['rust']
  .includes(tech)
    ? throw Exception('Go fuck youself')
    : useOrLearn(tech)`,
    },
    systemPrompt: {
        lang: "js",
        code: `'你是一个十分具有攻击性的人类\\n' +
:'精通各个编程语言和框架'`,
    },
};

const links = [
    { to: "/", label: "主页", icon: House },
    { to: "/posts/littlesheep", label: "博客", icon: FileText },
    { to: "/moments/littlesheep0v0", label: "日常", icon: NotebookText },
    { to: "/donate", label: "打赏", icon: Heart },
    { to: "/store", label: "支持", icon: Coffee },
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

/*
  Handle and verification share one line under the name. The handle falls back to
  the page's own publisher, so it is always there; the badge is dropped instead
  of rendering an empty pill when Solar Network reports no verification.
*/
.hero-meta {
    margin: 0.35rem 0 0;
}

.hero-handle {
    font-family: var(--mono);
    font-size: 0.76rem;
    color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

/*
  Labelled, not icon-only: a `title` tooltip is unreachable on touch, and the
  hint carries what the holder actually does.
*/
.hero-verified {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.08rem 0.45rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 600;
    white-space: nowrap;
    color: color-mix(
        in oklab,
        var(--color-primary) 85%,
        var(--color-base-content)
    );
    background: color-mix(in oklab, var(--color-primary) 12%, transparent);
}

.hero-verified svg {
    width: 0.9em;
    height: 0.9em;
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    /* Column dividers, measured from the row start so they hold on every row. */
    .fact:not(:nth-child(3n + 1)) {
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

/*
  External identities, closing the card the way `facts` opens it: a hairline and
  a wrapping strip. The marks are the only colour in the strip, so hover has
  somewhere to land.
*/
.connect {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding-top: 1.1rem;
    border-top: 1px solid
        color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

.connect-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.7rem;
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 80%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-base-200) 40%, transparent);
    color: inherit;
    text-decoration: none;
    transition:
        border-color 0.2s ease,
        color 0.2s ease;
}

.connect-chip:hover,
.connect-chip:focus-visible {
    border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
    color: var(--color-primary);
}

.connect-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
    transition: color 0.2s ease;
}

.connect-chip:hover .connect-icon,
.connect-chip:focus-visible .connect-icon {
    color: var(--color-primary);
}

.connect-label {
    font-size: 0.8rem;
    font-weight: 600;
}

/* The account name on that carrier: truncated, never wrapped. */
.connect-handle {
    max-width: 11rem;
    overflow: hidden;
    font-family: var(--mono);
    font-size: 0.7rem;
    color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
    text-overflow: ellipsis;
    white-space: nowrap;
}

/*
  Live numbers from Solar Network, on the far side of their own hairline so they
  read as a separate reading from the identity facts above. Their container is
  what animates them in: nothing here reveals on its own.
*/
.hero-stats {
    padding-top: 1.1rem;
    border-top: 1px solid
        color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

.hero-stats-head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 0 0 0.55rem;
    font-family: var(--mono);
    font-size: 0.66rem;
    letter-spacing: 0.06em;
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

/* One strip, four across at every size: a phone line of numbers, not a list. */
.stat-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 0;
}

.stat {
    min-width: 0;
    padding: 0.5rem 0.7rem;
    border-radius: 0.75rem;
    background: color-mix(in oklab, var(--color-base-200) 55%, transparent);
}

.stat dt {
    font-size: 0.66rem;
    letter-spacing: 0.04em;
    color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.stat dd {
    margin: 0.15rem 0 0;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
}

.stat-unit {
    margin-left: 0.15rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

/*
  A phone screen has to hold the whole identity card: below `sm` the reading
  trims to keep every slide one screen tall, which is what lets the deck page
  instead of scroll.
*/
@media (width < 40rem) {
    /*
      Six facts stack three deep here, so the grid tightens: the card's own
      height is what holds the whole reading inside one phone screen.
    */
    .facts {
        gap: 0.7rem 1rem;
    }

    /*
      The card has to hold one screen on a phone, so the strip tightens: no
      handles, and two columns — the same rhythm as the facts grid above — so
      the chips line up instead of wrapping raggedly.
    */
    .connect {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.35rem;
        padding-top: 0.6rem;
    }

    .connect-chip {
        gap: 0.3rem;
        padding: 0.28rem 0.55rem;
    }

    .connect-icon {
        width: 13px;
        height: 13px;
    }

    .connect-label {
        font-size: 0.72rem;
    }

    .connect-handle {
        display: none;
    }

    .hero-stats {
        padding-top: 0.7rem;
    }

    .hero-stats-head {
        margin-bottom: 0.4rem;
    }

    .stat-row {
        gap: 0.4rem;
    }

    .stat {
        padding: 0.4rem 0.6rem;
    }

    .stat dd {
        font-size: 1rem;
    }
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

/* The summary's one hand-off, sitting inside a revealed span so it colours itself. */
.copy-link {
    color: var(--color-primary);
    text-decoration: underline;
    text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
    text-underline-offset: 2px;
}

.copy-link:hover,
.copy-link:focus-visible {
    text-decoration-color: currentColor;
}

.copy-link:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 75%, transparent);
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
    color: color-mix(
        in oklab,
        var(--color-solar) 80%,
        var(--color-base-content)
    );
}

/*
  The project's own app icon, in the tile the letter used to hold. `contain`,
  not `cover`: the marks are the projects' own assets and several of them are
  wider than they are tall, so cropping would shave the artwork. The dark
  variant arrives through the `<source>` above, matching the theme's own
  `prefers-color-scheme` gate.
*/
.project-icon {
    display: block;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
}

.project-icon img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
    object-fit: contain;
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

/*
  The repo badge holds the corner slot `.project-status` used to: same pill, but
  a link. The mark always shows; the count is added by the template once the
  repo is past `STAR_DISPLAY_MIN`.
*/
.project-repo {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-family: var(--mono);
    font-size: 0.66rem;
    white-space: nowrap;
    background: color-mix(in oklab, var(--color-base-300) 45%, transparent);
    color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
    text-decoration: none;
    transition:
        background-color 0.2s ease,
        color 0.2s ease;
}

.project-repo:hover,
.project-repo:focus-visible {
    background: color-mix(in oklab, var(--color-primary) 14%, transparent);
    color: color-mix(
        in oklab,
        var(--color-primary) 85%,
        var(--color-base-content)
    );
}

.project-repo:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* Fixed rather than `em`: the mark anchors the badge instead of tracking the count. */
.project-repo-icon {
    width: 0.9rem;
    height: 0.9rem;
}

.project-stars {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-variant-numeric: tabular-nums;
}

/* Outlined like the page's other icons, filled just enough to read this small. */
.project-star-icon {
    width: 0.72rem;
    height: 0.72rem;
    fill: color-mix(in oklab, currentColor 30%, transparent);
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
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 85%, transparent);
    border-radius: 999px;
    font-family: var(--mono);
    font-size: 0.68rem;
    color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
}

.chip-refuse {
    border-color: color-mix(in oklab, var(--color-error) 45%, transparent);
    color: color-mix(
        in oklab,
        var(--color-error) 80%,
        var(--color-base-content)
    );
    text-decoration: line-through;
    text-decoration-color: color-mix(
        in oklab,
        var(--color-error) 50%,
        transparent
    );
}

/* --- skills -------------------------------------------------------------- */

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

/* --- music --------------------------------------------------------------- */

/*
  Log on the left, chart on the right, sharing one vertical rule: the chart's
  own left hairline is that rule, so the two read as one column pair rather
  than two boxes. Below `40rem` they stack and both trim rows, which is what
  keeps this panel one screen tall like every other slide.
*/
.music {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
}

.music-log {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
}

@media (width >= 40rem) {
    .music {
        grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
        gap: 0 1.5rem;
    }

    .chart {
        padding-left: 1.5rem;
        border-left: 1px solid
            color-mix(in oklab, var(--color-base-300) 70%, transparent);
    }
}

/*
  The section's headline: what is playing, or the last scrobble between tracks.
  The live dot is a state, so it is only drawn while Last.fm actually reports a
  track.
*/
.track-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem;
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 75%, transparent);
    border-radius: var(--radius-box);
    background: color-mix(in oklab, var(--color-base-200) 45%, transparent);
}

.track-art {
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 0.6rem;
    object-fit: cover;
}

.track-art-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in oklab, var(--color-base-300) 40%, transparent);
    color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.track-art-empty svg {
    width: 1.4rem;
    height: 1.4rem;
}

.track-body {
    min-width: 0;
}

.track-state {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.track-state-live {
    color: color-mix(
        in oklab,
        var(--color-solar) 85%,
        var(--color-base-content)
    );
}

.track-state-live::before {
    content: "";
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 999px;
    background: currentColor;
}

@media (prefers-reduced-motion: no-preference) {
    .track-state-live::before {
        animation: track-pulse 1.9s ease-in-out infinite;
    }
}

@keyframes track-pulse {
    50% {
        opacity: 0.3;
    }
}

.track-when {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
}

.track-name {
    display: block;
    margin-top: 0.15rem;
    overflow: hidden;
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.35;
    color: inherit;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.track-artist {
    margin: 0.1rem 0 0;
    overflow: hidden;
    font-size: 0.76rem;
    color: color-mix(in oklab, var(--color-base-content) 62%, transparent);
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Mono eyebrow over the log, the chart and the artists under it. */
.log-head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 0;
    font-family: var(--mono);
    font-size: 0.66rem;
    letter-spacing: 0.06em;
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.ledger {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
}

.ledger-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0 0.6rem;
    align-items: center;
    padding: 0.35rem 0;
}

.ledger-row + .ledger-row {
    border-top: 1px solid
        color-mix(in oklab, var(--color-base-300) 55%, transparent);
}

/*
  The scrobble feed carries real covers where Last.fm has them, so the log gets
  thumbnails for free. Tracks it has nothing for keep the same square empty
  rather than letting rows fall out of alignment.
*/
.ledger-art {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.4rem;
    object-fit: cover;
}

.ledger-art-empty {
    background: color-mix(in oklab, var(--color-base-300) 40%, transparent);
}

.ledger-text {
    min-width: 0;
}

.ledger-title {
    display: block;
    overflow: hidden;
    font-size: 0.78rem;
    font-weight: 600;
    color: inherit;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ledger-artist {
    display: block;
    overflow: hidden;
    font-size: 0.7rem;
    color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* The log's spine: one column, never wrapped, always comparable down the list. */
.ledger-time {
    font-family: var(--mono);
    font-size: 0.64rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.35rem;
}

.chart-switch {
    display: inline-flex;
    gap: 0.15rem;
    padding: 0.15rem;
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 80%, transparent);
    border-radius: 999px;
}

.chart-tab {
    padding: 0.2rem 0.6rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-family: var(--mono);
    font-size: 0.66rem;
    color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;
}

/* Hovering must not repaint the current window, so both rules carry the same pair. */
.chart-tab:hover,
.chart-tab.chart-tab-active {
    color: color-mix(
        in oklab,
        var(--color-solar) 88%,
        var(--color-base-content)
    );
}

.chart-tab.chart-tab-active {
    background: color-mix(in oklab, var(--color-solar) 18%, transparent);
}

.chart-tab:focus-visible,
.track-name:focus-visible,
.ledger-title:focus-visible,
.chart-name:focus-visible,
.chart-artists a:focus-visible,
.genre-chips a:focus-visible,
.music-foot a:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.chart-list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
}

/*
  Rank, cover, title, plays — then the bar under all four, spanning the row, so
  lengths compare down the list instead of inside each cell.
*/
.chart-row {
    display: grid;
    grid-template-columns: 1.1rem auto minmax(0, 1fr) auto;
    grid-template-areas:
        "rank art title plays"
        "bar bar bar bar";
    align-items: center;
    column-gap: 0.6rem;
    row-gap: 0.35rem;
    padding: 0.25rem 0 0.4rem;
}

.chart-rank {
    grid-area: rank;
    font-family: var(--mono);
    font-size: 0.66rem;
    font-variant-numeric: tabular-nums;
    color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

/* Covers come from `track.getInfo`; Last.fm has no album for some tracks. */
.chart-art {
    grid-area: art;
    width: 2rem;
    height: 2rem;
    border-radius: 0.4rem;
    object-fit: cover;
}

.chart-art-empty {
    background: color-mix(in oklab, var(--color-base-300) 40%, transparent);
}

.chart-title {
    grid-area: title;
    min-width: 0;
}

.chart-name {
    display: block;
    overflow: hidden;
    font-size: 0.8rem;
    font-weight: 600;
    color: inherit;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chart-artist {
    display: block;
    overflow: hidden;
    font-size: 0.7rem;
    color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chart-plays {
    grid-area: plays;
    font-family: var(--mono);
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
    color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

.chart-bar {
    grid-area: bar;
    overflow: hidden;
    height: 2px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-base-300) 60%, transparent);
}

/*
  Drawn on mount rather than on reveal: rows are keyed by period, so switching
  windows replays the draw, while a reveal-triggered animation would only ever
  run unseen behind the panel's own fade.
*/
.chart-bar-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
        90deg,
        var(--color-solar),
        var(--color-primary)
    );
    transform-origin: left center;
    animation: bar-draw 0.8s cubic-bezier(0.16, 1, 0.3, 1) var(--bar-delay, 0ms)
        both;
}

@keyframes bar-draw {
    from {
        transform: scaleX(0);
    }
}

.chart-artists-head {
    margin-top: 0.9rem;
}

.chart-artists {
    margin-top: 0.4rem;
}

.genre-chips {
    margin-top: 0.4rem;
}

.chart-artists a,
.genre-chips a {
    color: inherit;
    text-decoration: none;
}

.chip-count {
    margin-left: 0.35rem;
    opacity: 0.6;
}

/* The identity card's readout strip, reused on its own hairline. */
.music-stats {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid
        color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

.music-foot {
    margin: 0.75rem 0 0;
    font-size: 0.7rem;
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.music-foot a {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
    text-underline-offset: 2px;
}

.music-foot a:hover {
    color: var(--color-primary);
}

/*
  Tight screens hold less: a phone, and any window under 52rem tall — where the
  deck promises one screen per panel and this is its tallest panel. Each list
  ends earlier and the artist chips step aside there, since the genres below
  them carry the same "what does he listen to" reading. A taller window keeps
  the whole readout. The 630px this has to fit is the panel's maximum at the
  deck's own 48rem gate.
*/
@media (width < 40rem), (max-height: 53rem) {
    .ledger-row:nth-child(n + 4),
    .chart-row:nth-child(n + 6) {
        display: none;
    }

    .chart-artists-head,
    .chart-artists {
        display: none;
    }
}

@media (width < 40rem) {
    .track-art {
        width: 2.75rem;
        height: 2.75rem;
    }
}

/* --- guestbook ----------------------------------------------------------- */

/*
  The composer is a foreign widget: its own shadow styles, themed only through
  the `--sk-*` tokens the post pages map too. Everything it hands back — the
  sign-in slot — is light DOM and styled here like the rest of the panel.
*/
.guestbook-composer {
    --sk-font: var(--font-sans);
    --sk-base-100: var(--color-base-100);
    --sk-base-200: var(--color-base-200);
    --sk-base-300: var(--color-base-300);
    --sk-base-content: var(--color-base-content);
    --sk-primary: var(--color-primary);
    --sk-primary-content: var(--color-primary-content);
    --sk-radius: var(--radius-box);
    --sk-border: color-mix(in oklab, var(--color-base-300) 70%, transparent);
    margin-bottom: 0.75rem;
}

.guestbook-signin {
    display: block;
    width: 100%;
    font-size: 0.85rem;
    text-align: center;
    color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

/* A button, not an anchor: the slot is a call to the site's login route. */
.guestbook-signin-link {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--color-primary);
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
    text-underline-offset: 2px;
}

.guestbook-signin-link:hover,
.guestbook-signin-link:focus-visible {
    text-decoration-color: currentColor;
}

.guestbook-signin-link:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/*
  Other people's words, so the list is plain: one row per reply, hairlines
  between them, full content rather than the clamped preview the timeline cards
  use — a board that hid its messages would not be a board. The panel scrolls
  when the thread outgrows a screen; `useSlidePager` hands that wheel to it.
*/
.guestbook {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
}

.guestbook-reply {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0 0.75rem;
    padding: 0.7rem 0;
}

.guestbook-reply + .guestbook-reply {
    border-top: 1px solid
        color-mix(in oklab, var(--color-base-300) 55%, transparent);
}

.guestbook-avatar {
    width: 2.1rem;
    height: 2.1rem;
    flex-shrink: 0;
    border-radius: 999px;
    object-fit: cover;
}

.guestbook-avatar-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 0.8rem;
    font-weight: 600;
    background: color-mix(in oklab, var(--color-solar) 20%, transparent);
    color: color-mix(
        in oklab,
        var(--color-solar) 80%,
        var(--color-base-content)
    );
}

.guestbook-body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}

.guestbook-meta {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0;
    min-width: 0;
}

.guestbook-author {
    overflow: hidden;
    font-size: 0.82rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Right-aligned like the ledger's timestamps, so dates line up down the board. */
.guestbook-time {
    margin-left: auto;
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 0.64rem;
    font-variant-numeric: tabular-nums;
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.guestbook-content {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.7;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: color-mix(in oklab, var(--color-base-content) 82%, transparent);
}

.guestbook-empty {
    margin: 0;
    padding: 1.5rem 0;
    text-align: center;
    font-size: 0.85rem;
    color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
}

/* --- meta snippets ------------------------------------------------------- */

/*
  The two entries of the old metadata block that had to stay code (see `meta` in
  the script): hung off the bottom of the card each one describes, behind the
  same hairline the identity card uses for its own footers.
*/
.meta-snippet {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    margin-top: 1.15rem;
    padding-top: 1.15rem;
    border-top: 1px solid
        color-mix(in oklab, var(--color-base-300) 70%, transparent);
}

/* The key it carried in that block, quoted the way it was written there. */
.meta-key {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}

.meta-key::before {
    content: '"';
    opacity: 0.5;
}

.meta-key::after {
    content: '":';
    opacity: 0.5;
}

.meta-snippet pre {
    margin: 0;
    padding: 0.6rem 0.75rem;
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 70%, transparent);
    border-radius: 0.75rem;
    overflow-x: auto;
}

.meta-snippet pre,
.meta-snippet :deep(pre code) {
    font-family: var(--mono);
    font-size: 0.72rem;
    line-height: 1.6;
}

/* Shiki emits one `.line` per source line; without this they collapse to a single row. */
.meta-snippet :deep(.line) {
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
    border: 1px solid
        color-mix(in oklab, var(--color-base-300) 80%, transparent);
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
.project .letter,
.project .project-icon {
    opacity: 0;
}

.project.is-revealed .letter,
.project.is-revealed .project-icon {
    animation: mark-pop 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) 0.15s both;
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

@keyframes mark-pop {
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
