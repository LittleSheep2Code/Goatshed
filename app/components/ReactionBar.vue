<template>
  <div class="flex items-center gap-1.5 flex-wrap">
    <ClientOnly>
      <PopoverRoot v-if="authenticated" v-model:open="pickerOpen">
        <PopoverTrigger
          class="btn btn-glass btn-xs gap-1 h-7 px-2"
        >
          <SmilePlus class="h-3.5 w-3.5" />
          <span class="text-xs">React</span>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            class="bg-base-100 rounded-2xl border border-base-300/40 shadow-xl p-4 z-50"
            :side-offset="8"
            align="center"
            :collision-padding="16"
          >
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="opt in availableReactions"
                :key="opt.symbol"
                class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-base-200 transition-colors"
                @click.stop="addReaction(opt.symbol)"
              >
                <img
                  v-if="!missingStickers.has(opt.symbol)"
                  :src="reactionStickerUrl(opt.symbol)"
                  :alt="opt.label"
                  class="h-8 w-8 object-contain"
                  loading="lazy"
                  decoding="async"
                  @error="onStickerError(opt.symbol)"
                />
                <span v-else class="text-2xl">{{ opt.emoji }}</span>
                <span class="text-xs font-medium text-base-content/70">
                  {{ opt.label }}
                </span>
              </button>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </ClientOnly>

    <button
      v-for="reaction in displayReactions"
      :key="reaction.symbol"
      class="inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium transition-colors"
      :class="reaction.reacted
        ? 'bg-primary/20 text-primary border border-primary/30'
        : 'bg-base-200 text-base-content/70 border border-base-300 hover:bg-base-300'"
      :disabled="toggling"
      @click.stop="toggleReaction(reaction)"
    >
      <img
        v-if="!missingStickers.has(reaction.symbol)"
        :src="reactionStickerUrl(reaction.symbol)"
        :alt="reaction.label"
        class="h-4 w-4 object-contain"
        loading="lazy"
        decoding="async"
        @error="onStickerError(reaction.symbol)"
      />
      <span v-else class="text-sm leading-none">{{ reaction.emoji }}</span>
      <span>{{ reaction.count }}</span>
    </button>

    <button
      v-if="reactions.length > maxVisible"
      class="inline-flex items-center h-7 px-2 rounded-full text-xs font-medium bg-base-200 text-base-content/70 border border-base-300 hover:bg-base-300"
      @click.stop="showAll = !showAll"
    >
      +{{ reactions.length - maxVisible }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ReactionSummary } from "~/types/comment";
import { REACTIONS, reactionStickerUrl, type ReactionMeta } from "~/utils/reactions";
import { SmilePlus } from "lucide-vue-next";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";

const props = withDefaults(
  defineProps<{
    postId: string;
    maxVisible?: number;
  }>(),
  {
    maxVisible: 5,
  },
);

const { authenticated } = useAuth();

const reactions = ref<ReactionSummary[]>([]);
const total = ref(0);
const toggling = ref(false);
const pickerOpen = ref(false);
const showAll = ref(false);

/** What the picker offers and in what order — a subset of what the API can serve. */
const PICKER_SYMBOLS = [
  "thumb_up",
  "heart",
  "clap",
  "party",
  "laugh",
  "cry",
  "angry",
  "confuse",
  "pray",
];

/**
 * Symbols whose sticker failed to load — an unknown symbol, or a build whose
 * `public/stickers` copy never ran. Those chips fall back to their emoji.
 */
const missingStickers = ref(new Set<string>());

/** A reaction's emoji + label, standing in for symbols the site does not name. */
function metaFor(symbol: string): ReactionMeta {
  return REACTIONS[symbol] ?? { emoji: "❓", label: symbol };
}

const availableReactions = PICKER_SYMBOLS.map((symbol) => ({
  symbol,
  ...metaFor(symbol),
}));

const displayReactions = computed(() =>
  reactions.value
    .filter((reaction) => reaction.count > 0)
    .slice(0, showAll.value ? undefined : props.maxVisible)
    .map((reaction) => ({ ...reaction, ...metaFor(reaction.symbol) })),
);

function onStickerError(symbol: string) {
  missingStickers.value = new Set(missingStickers.value).add(symbol);
}

async function fetchReactions() {
  try {
    const data = await $fetch<{ reactions: ReactionSummary[]; total: number }>(
      `/api/posts/${props.postId}/reactions`,
    );
    reactions.value = data.reactions;
    total.value = data.total;
  } catch (e) {
    console.error("Failed to fetch reactions:", e);
  }
}

async function toggleReaction(reaction: ReactionSummary) {
  if (!authenticated.value || toggling.value) return;
  toggling.value = true;

  if (reaction.reacted) {
    await removeReaction(reaction.symbol);
  } else {
    await addReaction(reaction.symbol);
  }

  toggling.value = false;
}

async function addReaction(symbol: string) {
  try {
    const data = await $fetch<{ reactions: ReactionSummary[]; total: number }>(
      `/api/posts/${props.postId}/reactions`,
      { method: "POST", body: { symbol } },
    );
    reactions.value = data.reactions;
    total.value = data.total;
    pickerOpen.value = false;
  } catch (e: unknown) {
    const err = e as { statusCode?: number };
    if (err.statusCode === 409) {
      await fetchReactions();
    } else if (err.statusCode !== 401 && err.statusCode !== 403) {
      console.error("Failed to add reaction:", e);
    }
  }
}

async function removeReaction(symbol: string) {
  try {
    const data = await $fetch<{ reactions: ReactionSummary[]; total: number }>(
      `/api/posts/${props.postId}/reactions/${symbol}`,
      { method: "DELETE" },
    );
    reactions.value = data.reactions;
    total.value = data.total;
  } catch (e) {
    console.error("Failed to remove reaction:", e);
  }
}

onMounted(() => {
  fetchReactions();
});
</script>
