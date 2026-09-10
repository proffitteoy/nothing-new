import type { AnimeItem, AnimeStatus } from "./schema"

export type BangumiSubject = {
  id?: number
  name?: string
  name_cn?: string
  date?: string
  images?: {
    large?: string
    common?: string
    medium?: string
  }
  tags?: Array<{ name?: string }>
}

export type BangumiCollection = {
  subject_id?: number
  rate?: number
  subject?: BangumiSubject
}

export function normalizeAnimeScore(rate: number | undefined) {
  return typeof rate === "number" && rate >= 1 && rate <= 10 ? rate : undefined
}

export function normalizeBangumiCollection(
  collection: BangumiCollection,
  status: AnimeStatus,
): AnimeItem | null {
  const subject = collection.subject
  const id = collection.subject_id ?? subject?.id
  const name = subject?.name?.trim()

  if (!Number.isInteger(id) || !name) return null

  const nameCn = subject?.name_cn?.trim()
  const tags = subject?.tags
    ?.map((tag) => tag.name?.trim())
    .filter((tag): tag is string => Boolean(tag))

  return {
    id: id as number,
    name,
    ...(nameCn ? { nameCn } : {}),
    ...(normalizeAnimeScore(collection.rate) !== undefined
      ? { score: normalizeAnimeScore(collection.rate) }
      : {}),
    status,
    ...(subject?.date ? { airDate: subject.date } : {}),
    cover: subject?.images?.large ?? subject?.images?.common ?? subject?.images?.medium ?? null,
    ...(tags && tags.length > 0 ? { tags } : {}),
  }
}
