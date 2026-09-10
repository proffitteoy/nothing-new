import { NextResponse } from "next/server"
import { getBangumiUsername } from "../../../lib/anime/bgm-client"
import { buildPublicCacheControl } from "../../../lib/anime/cache"
import { createAnimeSnapshot, readLatestAnimeSnapshot } from "../../../lib/anime/snapshot"
import { loadAnimeItemsFromBangumi } from "../../../lib/anime/source"

async function createRealtimeFallback() {
  const username = await getBangumiUsername()
  const items = await loadAnimeItemsFromBangumi(username)

  // Realtime fallback keeps the browser independent from lain.bgm.tv.
  // Mirrored Blob covers are attached by the authenticated sync path.
  return createAnimeSnapshot(
    username,
    items.map((item) => ({ ...item, cover: null })),
  )
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
