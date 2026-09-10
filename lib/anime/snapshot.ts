import "server-only"

import { createHash } from "node:crypto"
import { ANIME_CACHE } from "./cache"
import {
  getAnimePublicAssetPath,
  putAnimeBlob,
  readAnimeBlobJson,
  readAnimeBlobText,
} from "./blob"
import type { AnimeItem, AnimeLatestPointer, AnimeSnapshot } from "./schema"

const LATEST_PATH = "anime/latest.json"
const SNAPSHOT_VERSION = 1 as const

function validCoverUrl(value: string | null) {
  if (value === null) return true
  if (value.startsWith("/anime/blob/covers/")) return true
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

export function validateAnimeSnapshot(snapshot: AnimeSnapshot, previousCount = 0) {
  if (snapshot.version !== SNAPSHOT_VERSION) throw new Error("Unsupported anime snapshot version")
  if (!snapshot.username.trim()) throw new Error("Anime snapshot username is empty")
  if (snapshot.items.length === 0) throw new Error("Anime snapshot contains no items")
  if (previousCount > 0 && snapshot.items.length < previousCount * 0.7) {
    throw new Error(
      `Anime snapshot count dropped unexpectedly: ${previousCount} -> ${snapshot.items.length}`,
    )
  }

  const ids = new Set<number>()
  for (const item of snapshot.items) {
    if (!Number.isInteger(item.id) || item.id <= 0) throw new Error("Anime snapshot has invalid id")
    if (ids.has(item.id)) throw new Error(`Anime snapshot contains duplicate id ${item.id}`)
    ids.add(item.id)
    if (!item.name.trim()) throw new Error(`Anime ${item.id} has no name`)
    if (item.status !== "watching" && item.status !== "watched") {
      throw new Error(`Anime ${item.id} has invalid status`)
    }
    if (item.score !== undefined && (item.score < 1 || item.score > 10)) {
      throw new Error(`Anime ${item.id} has invalid score`)
    }
    if (!validCoverUrl(item.cover)) throw new Error(`Anime ${item.id} has invalid cover URL`)
  }
}

function snapshotVersion(serialized: string) {
  return createHash("sha256").update(serialized).digest("hex").slice(0, 12)
}

async function verifyUploadedSnapshot(pathname: string, expectedVersion: string) {
  const serialized = await readAnimeBlobText(pathname)
  if (snapshotVersion(serialized) !== expectedVersion) {
    throw new Error("Anime snapshot verification failed: content hash mismatch")
  }

  const snapshot = JSON.parse(serialized) as AnimeSnapshot
  validateAnimeSnapshot(snapshot)
}

export async function readAnimeLatestPointer() {
  return readAnimeBlobJson<AnimeLatestPointer>(LATEST_PATH)
}

export async function readLatestAnimeSnapshot() {
  const latest = await readAnimeLatestPointer()
  const pathname = `anime/snapshots/${latest.version}.json`
  const snapshot = await readAnimeBlobJson<AnimeSnapshot>(pathname)
  validateAnimeSnapshot(snapshot)
  return { latest, snapshot }
}

export async function writeAnimeSnapshot(snapshot: AnimeSnapshot, previousCount = 0) {
  validateAnimeSnapshot(snapshot, previousCount)

  const serialized = JSON.stringify(snapshot)
  const version = snapshotVersion(serialized)
  const pathname = `anime/snapshots/${version}.json`
  await putAnimeBlob(pathname, serialized, {
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: ANIME_CACHE.immutableSeconds,
  })

  await verifyUploadedSnapshot(pathname, version)

  const latest: AnimeLatestPointer = {
    version,
    snapshot: getAnimePublicAssetPath(pathname),
    updatedAt: snapshot.updatedAt,
    count: snapshot.items.length,
  }

  await putAnimeBlob(LATEST_PATH, JSON.stringify(latest), {
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: ANIME_CACHE.latestBrowserSeconds,
    allowOverwrite: true,
  })

  return latest
}

export function createAnimeSnapshot(username: string, items: AnimeItem[]): AnimeSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    username,
    items,
  }
}
