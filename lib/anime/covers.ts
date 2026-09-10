import "server-only"

import { createHash } from "node:crypto"
import { ANIME_CACHE } from "./cache"
import { putPublicBlob, readPublicBlobJson } from "./blob"
import type { AnimeItem } from "./schema"

const COVER_MANIFEST_PATH = "anime/covers/manifest.json"
const COVER_CONCURRENCY = 6

type CoverRecord = {
  source: string
  blob: string
}

type CoverManifest = Record<string, CoverRecord>

export type CoverSyncResult = {
  items: AnimeItem[]
  downloaded: number
  reused: number
  failed: number
}

async function readCoverManifest(): Promise<CoverManifest> {
  try {
    return await readPublicBlobJson<CoverManifest>(COVER_MANIFEST_PATH)
  } catch {
    return {}
  }
}

function imageExtension(contentType: string) {
  if (contentType.includes("png")) return "png"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("avif")) return "avif"
  if (contentType.includes("gif")) return "gif"
  return "jpg"
}

async function mirrorCover(item: AnimeItem, previous?: CoverRecord) {
  const source = item.cover
  if (!source) return { item, record: undefined, state: "reused" as const }
  if (previous?.source === source) {
    return { item: { ...item, cover: previous.blob }, record: previous, state: "reused" as const }
  }

  try {
    const response = await fetch(source, {
      cache: "no-store",
      headers: { "User-Agent": "nothing-new/1.0 (https://github.com/proffitteoy/nothing-new)" },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`cover request failed: ${response.status}`)

    const bytes = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"
    const hash = createHash("sha256").update(Buffer.from(bytes)).digest("hex").slice(0, 12)
    const pathname = `anime/covers/${item.id}-${hash}.${imageExtension(contentType)}`
    const stored = await putPublicBlob(pathname, bytes, {
      contentType,
      cacheControlMaxAge: ANIME_CACHE.immutableSeconds,
      allowOverwrite: true,
    })
    const record = { source, blob: stored.url }
    return { item: { ...item, cover: stored.url }, record, state: "downloaded" as const }
  } catch (error) {
    console.error(
      `[anime/sync] cover ${item.id} failed:`,
      error instanceof Error ? error.message : "unknown error",
    )
    if (previous) {
      return { item: { ...item, cover: previous.blob }, record: previous, state: "reused" as const }
    }
    return { item: { ...item, cover: null }, record: undefined, state: "failed" as const }
  }
}

export async function syncAnimeCovers(items: AnimeItem[]): Promise<CoverSyncResult> {
  const previousManifest = await readCoverManifest()
  const nextManifest: CoverManifest = {}
  const output = new Array<AnimeItem>(items.length)
  let cursor = 0
  let downloaded = 0
  let reused = 0
  let failed = 0

  async function worker() {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return

      const item = items[index]
      const result = await mirrorCover(item, previousManifest[String(item.id)])
      output[index] = result.item
      if (result.record) nextManifest[String(item.id)] = result.record
      if (result.state === "downloaded") downloaded += 1
      else if (result.state === "reused") reused += 1
      else failed += 1
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(COVER_CONCURRENCY, Math.max(items.length, 1)) }, () => worker()),
  )

  await putPublicBlob(COVER_MANIFEST_PATH, JSON.stringify(nextManifest), {
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: ANIME_CACHE.latestBrowserSeconds,
    allowOverwrite: true,
  })

  return { items: output, downloaded, reused, failed }
}
