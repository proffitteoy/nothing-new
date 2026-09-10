export const ANIME_CACHE = {
  latestBrowserSeconds: 300,
  latestCdnSeconds: 1_800,
  immutableSeconds: 31_536_000,
  collectionsSeconds: 600,
  subjectsSeconds: 86_400,
  staleSeconds: 86_400,
} as const

export function buildPublicCacheControl(
  maxAge: number,
  sMaxAge: number,
  staleWhileRevalidate = ANIME_CACHE.staleSeconds,
) {
  return `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
}
