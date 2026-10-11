/** Emoji + label for one reaction symbol. */
export interface ReactionMeta {
  emoji: string;
  label: string;
}

/**
 * The reaction vocabulary Solar Network serves, keyed by symbol. The symbols
 * mirror the `sk-*` widgets' `AVAILABLE_REACTIONS`, so the site's own bar and
 * the widgets name the same reactions; the labels are the site's own copy.
 */
export const REACTIONS: Record<string, ReactionMeta> = {
  thumb_up: { emoji: "👍", label: "赞" },
  heart: { emoji: "❤️", label: "爱心" },
  clap: { emoji: "👏", label: "鼓掌" },
  laugh: { emoji: "😂", label: "哈哈" },
  party: { emoji: "🎉", label: "庆祝" },
  salute: { emoji: "🫡", label: "敬礼" },
  pray: { emoji: "🙏", label: "祈祷" },
  hello: { emoji: "👋", label: "你好" },
  shock: { emoji: "😱", label: "震惊" },
  confuse: { emoji: "🧐", label: "困惑" },
  cry: { emoji: "😭", label: "哭泣" },
  speechless: { emoji: "😶", label: "无语" },
  ridicule: { emoji: "😏", label: "嘲讽" },
  angry: { emoji: "😡", label: "生气" },
  thumb_down: { emoji: "👎", label: "不喜欢" },
};

/**
 * Sticker art for a reaction. `postinstall` copies the widget package's
 * `stickers/` into `public/stickers`, and the path matches the `stickerUrl`
 * template the widgets are configured with — so both draw the same image for a
 * symbol, and the emoji is only what a chip falls back to when this 404s.
 */
export function reactionStickerUrl(symbol: string): string {
  return `/stickers/${encodeURIComponent(symbol)}.webp`;
}
