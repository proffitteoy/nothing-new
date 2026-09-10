import { ANIME_CACHE } from "./cache"

type ProxyTarget = {
  path: string
  cacheSeconds: number
}

const COLLECTION_QUERY_KEYS = new Set(["subject_type", "type", "limit", "offset"])

export function resolveBangumiProxyTarget(
  segments: readonly string[],
  searchParams: URLSearchParams,
): ProxyTarget | null {
  if (segments.length === 2 && segments[0] === "subjects" && /^\d+$/.test(segments[1])) {
    return {
      path: `/subjects/${segments[1]}`,
      cacheSeconds: ANIME_CACHE.subjectsSeconds,
    }
  }

  if (segments.length === 3 && segments[0] === "users" && segments[2] === "collections") {
    const username = segments[1]?.trim()
    if (!username || username.includes("/")) return null

    const upstreamQuery = new URLSearchParams()
    for (const [key, value] of searchParams) {
      if (COLLECTION_QUERY_KEYS.has(key)) upstreamQuery.append(key, value)
    }

    const query = upstreamQuery.toString()
    return {
      path: `/users/${encodeURIComponent(username)}/collections${query ? `?${query}` : ""}`,
      cacheSeconds: ANIME_CACHE.collectionsSeconds,
    }
  }

  return null
}
