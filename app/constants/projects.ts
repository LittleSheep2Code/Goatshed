/**
 * GitHub repos behind the about page's project cards, `owner/name`. The page
 * links to them and `/api/github/stars` reads them, so the two lists cannot
 * drift and the endpoint stays a reader for these repos rather than a generic
 * GitHub proxy.
 */
export const PROJECT_REPOS = {
  solarNetwork: "Solsynth/Solian",
  solWatt: "Solsynth/SolWatt",
  persona: "Solsynth/Persynth",
  maidKit: "Solsynth/MaidKit",
} as const;

export type ProjectRepo = (typeof PROJECT_REPOS)[keyof typeof PROJECT_REPOS];
