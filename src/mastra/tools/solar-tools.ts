import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const profileSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  nick: z.string().nullable().optional(),
  language: z.string().optional(),
  region: z.string().optional(),
  profile: z
    .object({
      bio: z.string().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      location: z.string().optional(),
      time_zone: z.string().optional(),
    })
    .partial()
    .passthrough()
    .optional(),
})
  .partial()
  .passthrough();

const postSummarySchema = z.object({
  id: z.string(),
  type: z.number().optional(),
  title: z.string().nullable().optional(),
  contentPreview: z.string(),
  publishedAt: z.string().optional(),
  repliesCount: z.number().optional(),
});

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function shortText(value: string, max = 220) {
  const compact = compactText(value);
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 3)}...`;
}

function normalizeBaseUrl(raw: string | undefined) {
  const fallback = "https://api.solian.app";
  const normalized = (raw || fallback).trim();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function logAgentQuery(event: string, detail: Record<string, unknown>) {
  const payload = {
    source: "soulCloneAgent",
    scope: "solar-tools",
    event,
    ...detail,
  };
  console.info("[agent-query]", JSON.stringify(payload));
}

export const solarGetProfileTool = createTool({
  id: "solar-get-profile",
  description: "Get Solar Network account profile by username",
  inputSchema: z.object({
    username: z.string().trim().min(1).optional(),
  }),
  outputSchema: z.object({
    username: z.string(),
    source: z.string(),
    fetchedAt: z.string(),
    profile: profileSchema,
  }),
  execute: async ({ username }, context) => {
    const requestContext = context.requestContext;
    const defaultUsername = requestContext?.get("solarUsername");
    const resolvedUsername = (username || defaultUsername || "littlesheep").trim();
    const baseUrl = normalizeBaseUrl(requestContext?.get("apiBaseUrl"));
    const requestUrl = `${baseUrl}/passport/accounts/${encodeURIComponent(resolvedUsername)}`;

    logAgentQuery("solarGetProfile.start", {
      username: resolvedUsername,
      url: requestUrl,
    });

    const startedAt = Date.now();

    const response = await fetch(requestUrl);
    if (!response.ok) {
      const detail = await response.text();
      logAgentQuery("solarGetProfile.error", {
        username: resolvedUsername,
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        detail: detail.slice(0, 240),
      });
      throw new Error(`Failed to fetch profile (${response.status}): ${detail || "unknown error"}`);
    }

    const profile = (await response.json()) as unknown;
    logAgentQuery("solarGetProfile.success", {
      username: resolvedUsername,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
    });

    return {
      username: resolvedUsername,
      source: "solar-network",
      fetchedAt: new Date().toISOString(),
      profile: profile as z.infer<typeof profileSchema>,
    };
  },
});

export const solarGetPostsTool = createTool({
  id: "solar-get-posts",
  description: "Get recent Solar Network posts or moments by username",
  inputSchema: z.object({
    username: z.string().trim().min(1).optional(),
    feedType: z.enum(["posts", "moments", "all"]).default("posts"),
    take: z.number().int().min(1).max(20).default(8),
    offset: z.number().int().min(0).default(0),
  }),
  outputSchema: z.object({
    username: z.string(),
    feedType: z.enum(["posts", "moments", "all"]),
    fetchedAt: z.string(),
    items: z.array(postSummarySchema),
  }),
  execute: async ({ username, feedType, take, offset }, context) => {
    const requestContext = context.requestContext;
    const defaultUsername = requestContext?.get("solarUsername");
    const resolvedUsername = (username || defaultUsername || "littlesheep").trim();
    const baseUrl = normalizeBaseUrl(requestContext?.get("apiBaseUrl"));

    logAgentQuery("solarGetPosts.start", {
      username: resolvedUsername,
      feedType,
      take,
      offset,
    });

    const fetchFeed = async (type: 0 | 1) => {
      const params = new URLSearchParams({
        take: String(take),
        offset: String(offset),
        pub: resolvedUsername,
        replies: "false",
        type: String(type),
        orderDesc: "true",
      });
      const requestUrl = `${baseUrl}/sphere/posts?${params.toString()}`;
      const startedAt = Date.now();

      logAgentQuery("solarGetPosts.fetch.start", {
        username: resolvedUsername,
        type,
        url: requestUrl,
      });

      const response = await fetch(requestUrl);
      if (!response.ok) {
        const detail = await response.text();
        logAgentQuery("solarGetPosts.fetch.error", {
          username: resolvedUsername,
          type,
          status: response.status,
          elapsedMs: Date.now() - startedAt,
          detail: detail.slice(0, 240),
        });
        throw new Error(`Failed to fetch feed (${response.status}): ${detail || "unknown error"}`);
      }
      const json = (await response.json()) as Array<Record<string, unknown>>;
      logAgentQuery("solarGetPosts.fetch.success", {
        username: resolvedUsername,
        type,
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        count: Array.isArray(json) ? json.length : 0,
      });
      return json;
    };

    let rawItems: Array<Record<string, unknown>> = [];
    if (feedType === "posts") {
      rawItems = await fetchFeed(1);
    } else if (feedType === "moments") {
      rawItems = await fetchFeed(0);
    } else {
      const [posts, moments] = await Promise.all([fetchFeed(1), fetchFeed(0)]);
      rawItems = [...posts, ...moments].sort((a, b) => {
        const at = new Date(String(a.published_at || a.publishedAt || 0)).getTime();
        const bt = new Date(String(b.published_at || b.publishedAt || 0)).getTime();
        return bt - at;
      });
    }

    const items = rawItems.slice(0, take).map((item) => {
      const content = typeof item.content === "string" ? item.content : "";
      return {
        id: String(item.id || ""),
        type: typeof item.type === "number" ? item.type : undefined,
        title: typeof item.title === "string" ? item.title : null,
        contentPreview: shortText(content),
        publishedAt:
          typeof item.published_at === "string"
            ? item.published_at
            : typeof item.publishedAt === "string"
              ? item.publishedAt
              : undefined,
        repliesCount:
          typeof item.replies_count === "number"
            ? item.replies_count
            : typeof item.repliesCount === "number"
              ? item.repliesCount
              : undefined,
      };
    });

    return {
      username: resolvedUsername,
      feedType,
      fetchedAt: new Date().toISOString(),
      items,
    };
  },
});
