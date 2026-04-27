export interface AccountProfile {
  bio?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  timeZone?: string;
}

export interface Account {
  id: string;
  name: string;
  nick?: string;
  language?: string;
  region?: string;
  profile?: AccountProfile;
  createdAt?: string;
  updatedAt?: string;
}
