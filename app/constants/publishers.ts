export const PUBLISHERS = [
  "littlesheep",
  "littlesheep0v0",
  "littlesheepuwu",
] as const;

export type PublisherName = (typeof PUBLISHERS)[number];

/** The publisher the blog itself belongs to; used for the site's branding and author card. */
export const OWNER_PUBLISHER: PublisherName = "littlesheep";

export const PUBLISHER_META: Record<
  PublisherName,
  { description: string; locked: boolean }
> = {
  littlesheep: {
    description: "技术博客",
    locked: false,
  },
  littlesheep0v0: {
    description: "生活随记",
    locked: false,
  },
  littlesheepuwu: {
    description: "私密生活随记",
    locked: true,
  },
};

export function isPublisherName(value: string): value is PublisherName {
  return PUBLISHERS.includes(value as PublisherName);
}
