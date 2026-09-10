import "server-only"

import { getBangumiUsername } from "./bgm-client"
import { syncAnimeCovers } from "./covers"
import {
  createAnimeSnapshot,
  readLatestAnimeSnapshot,
  writeAnimeSnapshot,
} from "./snapshot"
import { loadAnimeItemsFromBangumi } from "./source"
import type { AnimeItem } from "./schema"

export type AnimeSyncMetrics = {
  success: true
  startedAt: string
  finishedAt: string
  duration: number
  oldCount: number
  newCount: number
  changedCount: number
  coverDownloaded: number
  coverReused: number
  coverFailed: number
  snapshotVersion: string
}

function countChanges(previous: AnimeItem[], current: AnimeItem[]) {
  const oldById = new Map(previous.map((item) => [item.id, JSON.stringify(item)]))
  let changes = 0

  for (const item of current) {
    if (oldById.get(item.id) !== JSON.stringify(item)) changes += 1
    oldById.delete(item.id)
  }

  return changes + oldById.size
}

export async function syncAnimeData(): Promise<AnimeSyncMetrics> {
  const started = Date.now()
  const startedAt = new Date(started).toISOString()
  const username = await getBangumiUsername()

  let previousItems: AnimeItem[] = []
  try {
    previousItems = (await readLatestAnimeSnapshot()).snapshot.items
  } catch {
    // First sync or an unavailable pointer is allowed. A valid latest pointer is never deleted here.
  }

  const normalizedItems = await loadAnimeItemsFromBangumi(username)
  const coverSync = await syncAnimeCovers(normalizedItems)
  const snapshot = createAnimeSnapshot(username, coverSync.items)
  const latest = await writeAnimeSnapshot(snapshot, previousItems.length)

  const finished = Date.now()
  const metrics: AnimeSyncMetrics = {
    success: true,
    startedAt,
    finishedAt: new Date(finished).toISOString(),
    duration: finished - started,
    oldCount: previousItems.length,
    newCount: snapshot.items.length,
    changedCount: countChanges(previousItems, snapshot.items),
    coverDownloaded: coverSync.downloaded,
    coverReused: coverSync.reused,
    coverFailed: coverSync.failed,
    snapshotVersion: latest.version,
  }

  console.info("[anime/sync] completed", metrics)
  return metrics
}
