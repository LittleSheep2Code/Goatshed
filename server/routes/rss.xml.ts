import type { Post } from "~/types/post";

const SITE_URL = "https://littlesheep.me";
const SITE_TITLE = "Goatshed";
const SITE_DESCRIPTION = "littlesheep 的个人博客，记录 Web 开发、软件架构与技术思考。";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toUTCString();
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const response = await $fetch<{ posts: Post[]; total: number }>("/api/posts", {
    baseURL: config.public.apiBaseUrl,
    query: {
      pub: "littlesheep",
      type: 1,
      take: 20,
      offset: 0,
    },
  }).catch(() => ({ posts: [], total: 0 }));

  const posts = response.posts || [];

  const items = posts
    .filter((post) => post?.id && post?.title)
    .map((post) => {
      const postUrl = `${SITE_URL}/posts/${post.id}`;
      const pubDate = formatDate(post.publishedAt || post.createdAt);
      const description = post.description
        ? escapeXml(post.description)
        : "在 Goatshed 阅读这篇文章。";

      const imageUrl = post.picture?.url || (post.picture?.id ? `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.picture.id)}` : null);

      let content = `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>`;

      if (imageUrl) {
        content += `
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0"/>`;
      }

      if (post.tags?.length) {
        for (const tag of post.tags) {
          if (tag?.slug) {
            content += `
      <category>${escapeXml(tag.slug)}</category>`;
          }
        }
      }

      content += `
    </item>`;

      return content;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${formatDate(new Date().toISOString())}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  event.node.res.setHeader("Content-Type", "application/xml; charset=utf-8");
  event.node.res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");

  return rss;
});
