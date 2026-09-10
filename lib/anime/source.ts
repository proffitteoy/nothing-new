import "server-only"

import { getBangumiCollections, getBangumiSubject } from "./bgm-client"
import { type BangumiCollection, normalizeBangumiCollection } from "./normalize"
import type { AnimeItem, AnimeStatus } from "./schema"

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
      `[anime/source] subject fallback ${id} failed:`,
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

export async function loadAnimeItemsFromBangumi(username: string) {
  const [watching, watched] = await Promise.all([
    loadCollection(username, "watching"),
    loadCollection(username, "watched"),
  ])

  const unique = new Map<number, AnimeItem>()
  for (const item of [...watching, ...watched]) unique.set(item.id, item)
  return [...unique.values()]
}
