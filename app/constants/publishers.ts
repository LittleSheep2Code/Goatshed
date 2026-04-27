export const PUBLISHERS = [
  "littlesheep",
  "littlesheep0v0",
  "littlesheepuwu",
] as const;

export type PublisherName = (typeof PUBLISHERS)[number];

export function isPublisherName(value: string): value is PublisherName {
  return PUBLISHERS.includes(value as PublisherName);
}
