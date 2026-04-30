import type { Post, PostListResponse } from "~/types/post";
import type { PublisherName } from "~/constants/publishers";

interface ApiFetchOptions {
  query?: Record<string, string | number | boolean>;
}

function snakeToCamel<T>(data: unknown): T {
  if (Array.isArray(data)) {
    return data.map((item) => snakeToCamel(item)) as T;
  }
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
        snakeToCamel(value),
      ]),
    ) as T;
  }
  return data as T;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
  const url = new URL(`${baseUrl}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);

  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json();
  return snakeToCamel<T>(data);
}

export async function fetchPostsDirect(params: {
  pub: PublisherName;
  type?: number;
  take?: number;
  offset?: number;
}): Promise<PostListResponse> {
  const url = buildUrl("/sphere/posts", {
    pub: params.pub,
    type: params.type ?? 1,
    take: params.take ?? 12,
    offset: params.offset ?? 0,
    replies: false,
    orderDesc: true,
  });

  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  const total = Number.parseInt(response.headers.get("x-total") || "0", 10);
  const raw = await response.json();
  const posts = snakeToCamel<Post[]>(raw);

  return { posts, total: total || posts.length };
}

export async function fetchPostDirect(id: string): Promise<Post> {
  return apiFetch<Post>(`/sphere/posts/${encodeURIComponent(id)}`);
}

export async function fetchPrevPostDirect(id: string): Promise<Post | null> {
  return apiFetch<Post | null>(`/sphere/posts/${encodeURIComponent(id)}/prev`);
}

export async function fetchNextPostDirect(id: string): Promise<Post | null> {
  return apiFetch<Post | null>(`/sphere/posts/${encodeURIComponent(id)}/next`);
}
