import "server-only"

import { readLatestAnimeSnapshot } from "../../lib/anime/snapshot"
import { ANIME_BATCH_SIZE, type AnimeItem } from "../../lib/anime/schema"

export type AnimeCollectionSlice = {
  items: AnimeItem[]
  total: number
  nextOffset: number
}

export type AnimeShelfState =
  | {
      status: "ready"
      username: string
      watching: AnimeCollectionSlice
      watched: AnimeCollectionSlice
    }
  | {
      status: "error"
      reason: "snapshot-unavailable"
    }

function toSlice(items: AnimeItem[]): AnimeCollectionSlice {
  return {
    items: items.slice(0, ANIME_BATCH_SIZE),
    total: items.length,
    nextOffset: Math.min(items.length, ANIME_BATCH_SIZE),
  }
}

export async function getAnimeShelf(): Promise<AnimeShelfState> {
  try {
    const { snapshot } = await readLatestAnimeSnapshot()
    return {
      status: "ready",
      username: snapshot.username,
      watching: toSlice(snapshot.items.filter((item) => item.status === "watching")),
      watched: toSlice(snapshot.items.filter((item) => item.status === "watched")),
    }
  } catch (error) {
    console.warn(
      "[anime/home] snapshot unavailable:",
      error instanceof Error ? error.message : "unknown error",
    )
    return { status: "error", reason: "snapshot-unavailable" }
  }
}
