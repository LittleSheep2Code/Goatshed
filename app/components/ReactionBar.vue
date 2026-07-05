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
                <span class="text-2xl">{{ opt.emoji }}</span>
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
      <span class="text-sm leading-none">{{ symbolToEmoji(reaction.symbol) }}</span>
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

const availableReactions = [
  { symbol: "thumb_up", emoji: "👍", label: "赞" },
  { symbol: "heart", emoji: "❤️", label: "爱心" },
  { symbol: "clap", emoji: "👏", label: "鼓掌" },
  { symbol: "party", emoji: "🎉", label: "庆祝" },
  { symbol: "laugh", emoji: "😂", label: "哈哈" },
  { symbol: "cry", emoji: "😢", label: "哭泣" },
  { symbol: "angry", emoji: "😠", label: "生气" },
  { symbol: "confuse", emoji: "😕", label: "困惑" },
  { symbol: "pray", emoji: "🙏", label: "祈祷" },
];

const displayReactions = computed(() => {
  const filtered = reactions.value.filter((r) => r.count > 0);
  if (showAll.value) return filtered;
  return filtered.slice(0, props.maxVisible);
});

function symbolToEmoji(symbol: string): string {
  const found = availableReactions.find((r) => r.symbol === symbol);
  return found?.emoji || "👍";
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
