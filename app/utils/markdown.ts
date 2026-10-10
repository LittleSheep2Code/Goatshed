import MarkdownIt from "markdown-it";
import { fromHighlighter } from "@shikijs/markdown-it";
import { createHighlighter } from "shiki";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

const SOLIAN_FILE_PREFIX = "solian://files/";
const DRIVE_FILE_PREFIX = "https://api.solian.app/drive/files/";

/** `https://solian.app/posts/<uuid>` — the URL a Solar post is shared as. */
const SOLIAN_POST_LINK =
  /^https?:\/\/(?:www\.)?solian\.app\/posts\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})\/?$/i;

/**
 * The slice of a markdown-it token this module reads. The package ships no
 * declarations, so the shapes handed to rules are spelled out here.
 */
interface MarkdownToken {
  type: string;
  content: string;
  children: MarkdownToken[] | null;
  attrGet(name: string): string | null;
}

interface PostEmbedToken extends MarkdownToken {
  block?: boolean;
  meta?: { id: string; href: string };
}

interface MarkdownCoreState {
  env: Record<string, unknown>;
  tokens: PostEmbedToken[];
  Token: new (type: string, tag: string, nesting: number) => PostEmbedToken;
}

/**
 * Turn single newlines into markdown hard breaks so plain-text fields (bios,
 * moment bodies) keep their line structure when rendered.
 */
export function withSoftBreaks(input: string): string {
  return input.replace(/\r?\n/g, "  \n");
}

function transformSolianFileUrl(url: string): string {
  if (!url.startsWith(SOLIAN_FILE_PREFIX)) return url;
  const filePath = url.slice(SOLIAN_FILE_PREFIX.length);
  return `${DRIVE_FILE_PREFIX}${filePath}`;
}

const defaultNormalizeLink = md.normalizeLink.bind(md);
md.normalizeLink = (url) => defaultNormalizeLink(transformSolianFileUrl(url));

let shikiReady: Promise<void> | null = null;
let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;
const loadedLanguages = new Set<string>(["plaintext"]);
const failedLanguages = new Set<string>();

const LANGUAGE_ALIASES: Record<string, string> = {
  shell: "bash",
  sh: "bash",
  yml: "yaml",
  js: "javascript",
  ts: "typescript",
  md: "markdown",
  text: "plaintext",
  conf: "ini",
  config: "ini",
  cfg: "ini",
};

function normalizeLanguage(input: string): string {
  const key = input.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || key;
}

function detectFenceLanguages(content: string): string[] {
  const matches = content.matchAll(/^```([\w#+.-]+)/gm);
  const result = new Set<string>();
  for (const match of matches) {
    const raw = match[1];
    if (!raw) continue;
    result.add(normalizeLanguage(raw));
  }
  return [...result];
}

function ensureShiki() {
  if (!shikiReady) {
    shikiReady = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["plaintext"],
    }).then((highlighter) => {
      highlighterInstance = highlighter;
      md.use(
        fromHighlighter(highlighter, {
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultLanguage: "plaintext",
        }),
      );
    });
  }
  return shikiReady;
}

async function ensureLanguagesForContent(content: string) {
  await ensureShiki();
  if (!highlighterInstance) return;

  const languages = detectFenceLanguages(content);
  for (const lang of languages) {
    if (loadedLanguages.has(lang) || failedLanguages.has(lang)) continue;
    try {
      await highlighterInstance.loadLanguage(lang);
      loadedLanguages.add(lang);
    } catch {
      failedLanguages.add(lang);
    }
  }
}

/**
 * A paragraph holding nothing but a Solar post URL is the one place a bare
 * `sk-post` widget reads better than a link — the embedded card the quoted post
 * deserves. Only a standalone URL qualifies: one inside a sentence, or a link
 * the author labelled (`[看看这篇](…)`), keeps its text.
 */
function matchStandalonePostLink(
  inline: MarkdownToken,
): { id: string; href: string } | null {
  const children = inline.children;
  if (!children || children.length !== 3) return null;

  const [open, text, close] = children;
  if (open?.type !== "link_open" || close?.type !== "link_close") return null;
  if (text?.type !== "text") return null;

  const href = open.attrGet("href");
  if (!href) return null;

  const match = SOLIAN_POST_LINK.exec(href);
  if (!match?.[1] || text.content.trim() !== href) return null;

  return { id: match[1], href };
}

function embedStandalonePostLinks(state: MarkdownCoreState) {
  if (!state.env?.embedPosts) return;

  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const inline = tokens[i + 1];
    const close = tokens[i + 2];
    if (
      tokens[i]?.type !== "paragraph_open" ||
      inline?.type !== "inline" ||
      close?.type !== "paragraph_close"
    ) {
      continue;
    }

    const embed = matchStandalonePostLink(inline);
    if (!embed) continue;

    const token = new state.Token("post_embed", "", 0);
    token.block = true;
    token.meta = embed;
    // The paragraph's three tokens become the one embed token.
    tokens.splice(i, 3, token);
  }
}

md.core.ruler.push("post_embed", embedStandalonePostLinks);

md.renderer.rules.post_embed = (tokens, idx) => {
  const embed = (tokens[idx] as PostEmbedToken | undefined)?.meta;
  if (!embed) return "";

  const href = md.utils.escapeHtml(embed.href);
  /*
    The link is the element's light DOM: a client that never upgrades the custom
    element — the widget's chunk blocked or failed — still reads it as a link,
    and shadow-DOM slotting drops it once the card renders.
  */
  return (
    `<div class="post-embed" data-pagefind-ignore>` +
    `<sk-post post="${md.utils.escapeHtml(embed.id)}" url="${href}" detail>` +
    `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${href}</a>` +
    `</sk-post></div>\n`
  );
};

const defaultLinkOpen = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer nofollow");
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

export interface MarkdownRenderOptions {
  /**
   * Render a paragraph that is only a Solar Network post link as an embedded
   * `sk-post` widget instead of a link. Off by default: profiles and timeline
   * cards render through this same function, where a second post card inside
   * the card is wrong.
   */
  embedPosts?: boolean;
}

export async function renderMarkdown(
  content: string,
  options: MarkdownRenderOptions = {},
): Promise<string> {
  try {
    await ensureLanguagesForContent(content || "");
    return md.render(content || "", { embedPosts: options.embedPosts === true });
  } catch (e) {
    console.error("[markdown] Render failed, falling back without highlighting:", e);
    const plainMd = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      breaks: true,
    });
    return plainMd.render(content || "");
  }
}
