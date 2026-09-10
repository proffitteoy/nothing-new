import "server-only"

import { getBangumiCollections, getBangumiSubject, getBangumiUsername } from "./bgm-client"
import { syncAnimeCovers } from "./covers"
import {
  type BangumiCollection,
  normalizeBangumiCollection,
} from "./normalize"
import {
  createAnimeSnapshot,
  readLatestAnimeSnapshot,
  writeAnimeSnapshot,
} from "./snapshot"
import type { AnimeItem, AnimeStatus } from "./schema"

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

async function normalizeWithSubjectFallback(
  collection: BangumiCollection,
  status: AnimeStatus,
): Promise<AnimeItem | null> {
  const direct = normalizeBangumiCollection(collection, status)
  if (direct) return direct

  const id = collection.subject_id ?? collection.subject?.id
  if (!Number.isInteger(id)) return null

  try {
    const subject = await getBangumiSubject(id as number)
    return normalizeBangumiCollection({ ...collection, subject }, status)
  } catch (error) {
    console.error(
      `[anime/sync] subject fallback ${id} failed:`,
      error instanceof Error ? error.message : "unknown error",
    )
    return null
  }
}

async function loadCollection(username: string, status: AnimeStatus) {
  const raw = await getBangumiCollections(username, status)
  const output: AnimeItem[] = []

  for (const collection of raw) {
    const normalized = await normalizeWithSubjectFallback(collection, status)
    if (normalized) output.push(normalized)
  }

  return output
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

  const [watching, watched] = await Promise.all([
    loadCollection(username, "watching"),
    loadCollection(username, "watched"),
  ])

  const unique = new Map<number, AnimeItem>()
  for (const item of [...watching, ...watched]) unique.set(item.id, item)
  const normalizedItems = [...unique.values()]

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
