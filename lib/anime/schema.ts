export type AnimeStatus = "watching" | "watched"

export type AnimeItem = {
  id: number
  name: string
  nameCn?: string
  score?: number
  status: AnimeStatus
  airDate?: string
  cover: string | null
  tags?: string[]
}

export type AnimeSnapshot = {
  version: 1
  updatedAt: string
  username: string
  items: AnimeItem[]
}

export type AnimeLatestPointer = {
  version: string
  snapshot: string
  updatedAt: string
  count: number
}

export type AnimeCollectionSlice = {
  items: AnimeItem[]
  total: number
  nextOffset: number
}

export const ANIME_BATCH_SIZE = 30

export function getAnimeTitle(item: AnimeItem) {
  return item.nameCn?.trim() || item.name
}

export function isAnimeStatus(value: string | null): value is AnimeStatus {
  return value === "watching" || value === "watched"
}
