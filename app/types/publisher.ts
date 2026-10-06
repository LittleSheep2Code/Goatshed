import type { MediaFile } from "./post";

export interface Publisher {
  id: string;
  name: string;
  nick: string | null;
  bio: string | null;
  picture?: MediaFile | null;
  background?: MediaFile | null;
  attachments?: MediaFile[];
  verification: {
    title: string | null;
  } | null;
}

/** Aggregate content stats for a publisher, from `/sphere/publishers/{name}/stats`. */
export interface PublisherStats {
  postsCount: number;
  wordsCount: number;
  attachmentsCount: number;
  daysPostedCount: number;
  longestStreakDays: number;
  firstPostedAt: string | null;
  lastPostedAt: string | null;
}
