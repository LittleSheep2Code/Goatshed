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

async function apiFetchWithTotal<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);

  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  const raw = await response.json();
  return snakeToCamel<T>(raw);
}

export function useApi() {
  return {
    fetchPosts: (params: {
      pub: PublisherName;
      type?: number;
      take?: number;
      offset?: number;
    }) =>
      apiFetchWithTotal<PostListResponse>("/sphere/posts", {
        query: {
          pub: params.pub,
          type: params.type ?? 1,
          take: params.take ?? 12,
          offset: params.offset ?? 0,
          replies: false,
          orderDesc: true,
        },
      }),

    fetchPost: (id: string) =>
      apiFetch<Post>(`/sphere/posts/${encodeURIComponent(id)}`),

    fetchPrevPost: (id: string) =>
      apiFetch<Post | null>(`/sphere/posts/${encodeURIComponent(id)}/prev`),

    fetchNextPost: (id: string) =>
      apiFetch<Post | null>(`/sphere/posts/${encodeURIComponent(id)}/next`),
  };
}
