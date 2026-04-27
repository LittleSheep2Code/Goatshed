export interface SessionUser {
  id: string;
  name: string;
  nick: string | null;
  username: string | null;
}

export interface SessionData {
  user: SessionUser;
  expiresAt: number;
}
