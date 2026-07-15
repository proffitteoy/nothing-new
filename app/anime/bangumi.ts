import "server-only"

const BANGUMI_API_BASE = "https://api.bgm.tv/v0"
const PAGE_SIZE = 50
const CACHE_SECONDS = 30 * 60

type BangumiImages = {
  large?: string
  common?: string
  medium?: string
  small?: string
  grid?: string
}

type BangumiSubject = {
  id: number
  name: string
  name_cn: string
  images?: BangumiImages
}

type BangumiCollection = {
  subject_id: number
  subject?: BangumiSubject
}

type BangumiCollectionPage = {
  total: number
  data: BangumiCollection[]
}

type BangumiUser = {
  username: string
}

export type AnimeEntry = {
  id: number
  title: string
  cover: string | null
}

export type AnimeShelfState =
  | {
      status: "ready"
      username: string
      watching: AnimeEntry[]
      watched: AnimeEntry[]
    }
  | {
      status: "error"
      reason: "missing-token" | "request-failed"
    }

async function bangumiFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${BANGUMI_API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "nothing-new.icu/1.0 (https://nothing-new.icu)",
    },
    next: { revalidate: CACHE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Bangumi API request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

function normalizeCover(images?: BangumiImages) {
  const cover = images?.large || images?.common || images?.medium || images?.grid
  return cover ? cover.replace(/^http:\/\//, "https://") : null
}

function toAnimeEntry(collection: BangumiCollection): AnimeEntry | null {
  const { subject } = collection
  if (!subject) return null

  const title = subject.name_cn.trim() || subject.name.trim()
  if (!title) return null

  return {
    id: subject.id || collection.subject_id,
    title,
    cover: normalizeCover(subject.images),
  }
}

async function getCollectionPage(
  token: string,
  username: string,
  collectionType: 2 | 3,
  offset: number,
) {
  const params = new URLSearchParams({
    subject_type: "2",
    type: String(collectionType),
    limit: String(PAGE_SIZE),
    offset: String(offset),
  })

  return bangumiFetch<BangumiCollectionPage>(
    `/users/${encodeURIComponent(username)}/collections?${params}`,
    token,
  )
}

async function getAllCollections(token: string, username: string, collectionType: 2 | 3) {
  const firstPage = await getCollectionPage(token, username, collectionType, 0)
  const remainingOffsets = Array.from(
    { length: Math.max(0, Math.ceil(firstPage.total / PAGE_SIZE) - 1) },
    (_, index) => (index + 1) * PAGE_SIZE,
  )
  const remainingPages = await Promise.all(
    remainingOffsets.map((offset) => getCollectionPage(token, username, collectionType, offset)),
  )

  return [firstPage, ...remainingPages]
    .flatMap((page) => page.data)
    .map(toAnimeEntry)
    .filter((entry): entry is AnimeEntry => entry !== null)
}

export async function getAnimeShelf(): Promise<AnimeShelfState> {
  const token = process.env.BANGUMI_ACCESS_TOKEN?.trim()
  if (!token) {
    return { status: "error", reason: "missing-token" }
  }

  try {
    const { username } = await bangumiFetch<BangumiUser>("/me", token)
    const [watching, watched] = await Promise.all([
      getAllCollections(token, username, 3),
      getAllCollections(token, username, 2),
    ])

    return { status: "ready", username, watching, watched }
  } catch (error) {
    console.error(
      "[Bangumi] failed to load anime collections:",
      error instanceof Error ? error.message : "unknown error",
    )
    return { status: "error", reason: "request-failed" }
  }
}
