import type { AnimeLatestPointer, AnimeSnapshot } from "./schema"
import { ANIME_CACHE } from "./cache"

function isSnapshot(value: unknown): value is AnimeSnapshot {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<AnimeSnapshot>
  return (
    candidate.version === 1 &&
    typeof candidate.username === "string" &&
    Array.isArray(candidate.items)
  )
}

async function fetchSnapshot(signal: AbortSignal) {
  try {
    const latestResponse = await fetch("/anime/latest.json", { signal })
    if (!latestResponse.ok) throw new Error(`latest.json returned ${latestResponse.status}`)
    const latest = (await latestResponse.json()) as AnimeLatestPointer
    const snapshotResponse = await fetch(latest.snapshot, {
      cache: "force-cache",
      signal,
    })
    if (!snapshotResponse.ok) throw new Error(`snapshot returned ${snapshotResponse.status}`)
    const snapshot = await snapshotResponse.json()
    if (!isSnapshot(snapshot)) throw new Error("snapshot schema is invalid")
    return snapshot
  } catch (error) {
    if (signal.aborted) throw error
    console.warn(
      "[AnimeShelf] snapshot load failed, falling back to the Vercel API:",
      error instanceof Error ? error.message : "unknown error",
    )
  }

  const fallbackResponse = await fetch("/api/anime", {
    cache: "no-cache",
    signal,
  })
  if (!fallbackResponse.ok) throw new Error(`fallback API returned ${fallbackResponse.status}`)
  const fallback = await fallbackResponse.json()
  if (!isSnapshot(fallback)) throw new Error("fallback snapshot schema is invalid")
  return fallback
}

// A single metadata request serves startup, the home count and the shelf.
// Keep the same freshness window as latest.json; failures are never cached.
let pending: Promise<AnimeSnapshot> | null = null
let snapshot: AnimeSnapshot | null = null
let expiresAt = 0
export function getCachedAnimeSnapshot() {
  return Date.now() < expiresAt ? snapshot : null
}
export function loadAnimeSnapshot(): Promise<AnimeSnapshot> {
  const cached = getCachedAnimeSnapshot()
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  pending = fetchSnapshot(AbortSignal.timeout(12000))
    .then((data) => {
      snapshot = data
      expiresAt = Date.now() + ANIME_CACHE.latestBrowserSeconds * 1000
      return data
    })
    .finally(() => {
      pending = null
    })
  return pending
}
