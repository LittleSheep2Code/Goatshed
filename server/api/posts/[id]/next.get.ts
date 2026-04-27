import type { Post } from "../../../../app/types/post";
import { floatingFetch } from "../../../utils/floating-api";
import { readSession } from "../../../utils/session";

const LOCKED_PUBLISHERS = new Set(["littlesheepuwu"]);

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const currentPost = await floatingFetch<Post>(event, `/sphere/posts/${encodeURIComponent(id)}`);

  if (!currentPost?.publishedAt || !currentPost?.publisher?.name) {
    return null;
  }

  if (LOCKED_PUBLISHERS.has(currentPost.publisher.name)) {
    const session = readSession(event);
    if (!session) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized: this post requires authentication",
      });
    }
  }

  const params = new URLSearchParams({
    pub: currentPost.publisher.name,
    type: String(currentPost.type ?? 1),
    take: "1",
    offset: "0",
    orderDesc: "false",
    publishedAfter: currentPost.publishedAt,
  });

  const result = await floatingFetch<Post[]>(event, `/sphere/posts?${params.toString()}`);
  return result[0] || null;
});
