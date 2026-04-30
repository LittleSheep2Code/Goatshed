import type { Post } from "~/types/post";

export function getPostIdentifier(post: Post): string {
  const publisherName = post.publisher?.name || "littlesheep";
  const identifier = post.slug || post.id;
  return `${publisherName}/${identifier}`;
}

export function getPostIdForApi(post: Post): string {
  if (post.slug && post.publisher?.name) {
    return `${post.publisher.name}/${post.slug}`;
  }
  return post.id;
}
