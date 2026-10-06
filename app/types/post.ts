export interface MediaFile {
  id: string;
  name?: string | null;
  url?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  /** BlurHash string returned by Solar Network drive files, used for image placeholders. */
  blurhash?: string | null;
}

export interface Publisher {
  id: string;
  name: string;
  nick: string | null;
  bio: string | null;
  picture?: MediaFile | null;
  background?: MediaFile | null;
  attachments?: MediaFile[];
  verification: {
    type: number;
    title: string | null;
    description: string | null;
    verifiedBy: string | null;
  } | null;
}

export interface PostTag {
  id: string;
  slug: string;
  name: string;
}

/**
 * Rich preview the Solar Network resolver stores on a post's meta when its
 * content links somewhere unfurlable (or holds a poll). Keys arrive camelCased
 * because `snFetch` normalises the wire payload.
 */
export interface PostEmbed {
  type?: string | null;
  url?: string | null;
  uri?: string | null;
  href?: string | null;
  title?: string | null;
  description?: string | null;
  author?: string | null;
  siteName?: string | null;
  faviconUrl?: string | null;
  imageUrl?: string | null;
  contentType?: string | null;
  publishedDate?: string | null;
}

export interface PostMeta {
  embeds?: (PostEmbed | null)[] | null;
  [key: string]: unknown;
}

export interface Post {
  id: string;
  slug?: string | null;
  type?: number;
  title: string | null;
  description: string | null;
  content: string;
  picture?: MediaFile | null;
  background?: MediaFile | null;
  attachments?: MediaFile[];
  publishedAt: string;
  viewsUnique: number;
  viewsTotal: number;
  repliesCount: number;
  /** Reaction symbol → total count, as tracked by the upstream API. */
  reactionsCount?: Record<string, number> | null;
  /** Reaction symbol → whether the current session reacted. */
  reactionsMade?: Record<string, boolean> | null;
  boostCount?: number;
  /** 0 public, 1 friends, 2 unlisted, 3 private. */
  visibility?: number;
  isBookmarked?: boolean;
  meta?: PostMeta | null;
  isTruncated: boolean;
  publisher: Publisher;
  tags: PostTag[];
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
}
