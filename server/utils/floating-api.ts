import { snakeToCamel } from "../../app/utils/case";

interface ApiFetchOptions extends RequestInit {
  token?: string;
}

export async function floatingFetch<T>(
  event: Parameters<typeof useRuntimeConfig>[0],
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const config = useRuntimeConfig(event);
  const baseUrl = config.public.apiBaseUrl;
  const headers = new Headers(options.headers || {});

  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  if (response.status === 204) {
    return null as T;
  }

  const data = (await response.json()) as unknown;
  return snakeToCamel<T>(data);
}

export async function floatingFetchWithTotal<T>(
  event: Parameters<typeof useRuntimeConfig>[0],
  path: string,
  options: ApiFetchOptions = {},
): Promise<{ data: T; total: number }> {
  const config = useRuntimeConfig(event);
  const headers = new Headers(options.headers || {});

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${config.public.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const total = Number.parseInt(response.headers.get("x-total") || "0", 10);
  const raw = (await response.json()) as unknown;
  return { data: snakeToCamel<T>(raw), total };
}
