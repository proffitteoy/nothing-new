import { NextResponse } from "next/server"
import { getBangumiCollections, getBangumiUsername } from "../../../lib/anime/bgm-client"
import { buildPublicCacheControl } from "../../../lib/anime/cache"
import { normalizeBangumiCollection } from "../../../lib/anime/normalize"
import { createAnimeSnapshot, readLatestAnimeSnapshot } from "../../../lib/anime/snapshot"
import type { AnimeItem } from "../../../lib/anime/schema"

async function createRealtimeFallback() {
  const username = await getBangumiUsername()
  const [watchingRaw, watchedRaw] = await Promise.all([
    getBangumiCollections(username, "watching"),
    getBangumiCollections(username, "watched"),
  ])

  const items: AnimeItem[] = []
  for (const collection of watchingRaw) {
    const item = normalizeBangumiCollection(collection, "watching")
    if (item) items.push({ ...item, cover: null })
  }
  for (const collection of watchedRaw) {
    const item = normalizeBangumiCollection(collection, "watched")
    if (item) items.push({ ...item, cover: null })
  }

  const unique = new Map(items.map((item) => [item.id, item]))
  return createAnimeSnapshot(username, [...unique.values()])
}

export async function GET() {
  try {
    const { snapshot } = await readLatestAnimeSnapshot()
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": buildPublicCacheControl(0, 300),
        "X-Anime-Source": "snapshot",
      },
    })
  } catch (snapshotError) {
    console.warn(
      "[api/anime] snapshot unavailable, using realtime fallback:",
      snapshotError instanceof Error ? snapshotError.message : "unknown error",
    )
  }

  try {
    const snapshot = await createRealtimeFallback()
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": buildPublicCacheControl(0, 600),
        "X-Anime-Source": "proxy",
      },
    })
  } catch (error) {
    console.error(
      "[api/anime] fallback failed:",
      error instanceof Error ? error.message : "unknown error",
    )
    return NextResponse.json({ error: "Anime data is temporarily unavailable" }, { status: 503 })
  }
}
