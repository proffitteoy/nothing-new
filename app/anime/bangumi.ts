import "server-only"
import { unstable_cache } from "next/cache"

const BANGUMI_API_BASE = "https://api.bgm.tv/v0"
const FIRST_SCREEN_LIMIT = 5
const PAGE_SIZE = 10
const CACHE_SECONDS = 30 * 60

export type AnimeShelfStatus = "watching" | "watched"

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
  limit: number
  offset: number
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

export type AnimeCollectionSlice = {
  items: AnimeEntry[]
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
      reason: "missing-token" | "request-failed"
    }

class MissingBangumiTokenError extends Error {}

function getToken() {
  const token = process.env.BANGUMI_ACCESS_TOKEN?.trim()
  if (!token) throw new MissingBangumiTokenError("BANGUMI_ACCESS_TOKEN is missing")
  return token
}

async function bangumiFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${BANGUMI_API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "nothing-new.icu/1.0 (https://nothing-new.icu)",
    },
    next: {
      revalidate: CACHE_SECONDS,
      tags: ["bangumi-anime-api"],
    },
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

function getCollectionType(status: AnimeShelfStatus): 2 | 3 {
  return status === "watching" ? 3 : 2
}

async function getUsername(token: string) {
  const user = await bangumiFetch<BangumiUser>("/me", token)
  return user.username
}

export async function getAnimeCollectionPage(
  status: AnimeShelfStatus,
  offset = 0,
  limit = PAGE_SIZE,
): Promise<AnimeCollectionSlice> {
  const token = getToken()
  const username = await getUsername(token)
  const safeOffset = Math.max(0, Math.floor(offset))
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)))
  const params = new URLSearchParams({
    subject_type: "2",
    type: String(getCollectionType(status)),
    limit: String(safeLimit),
    offset: String(safeOffset),
  })
  const page = await bangumiFetch<BangumiCollectionPage>(
    `/users/${encodeURIComponent(username)}/collections?${params}`,
    token,
  )

  return {
    items: page.data.map(toAnimeEntry).filter((entry): entry is AnimeEntry => entry !== null),
    total: page.total,
    nextOffset: page.offset + page.data.length,
  }
}

async function loadFirstScreen() {
  const token = getToken()
  const username = await getUsername(token)
  const [watching, watched] = await Promise.all([
    getAnimeCollectionPage("watching", 0, FIRST_SCREEN_LIMIT),
    getAnimeCollectionPage("watched", 0, FIRST_SCREEN_LIMIT),
  ])

  return { status: "ready" as const, username, watching, watched }
}

const getCachedFirstScreen = unstable_cache(
  loadFirstScreen,
  ["bangumi-anime-first-screen-v2"],
  {
    revalidate: CACHE_SECONDS,
    tags: ["bangumi-anime-first-screen"],
  },
)

export async function getAnimeShelf(): Promise<AnimeShelfState> {
  try {
    return await getCachedFirstScreen()
  } catch (error) {
    if (error instanceof MissingBangumiTokenError) {
      return { status: "error", reason: "missing-token" }
    }

    console.error(
      "[Bangumi] failed to load anime collections:",
      error instanceof Error ? error.message : "unknown error",
    )
    return { status: "error", reason: "request-failed" }
  }
}
