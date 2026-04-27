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
