import "server-only"

import type { AnimeStatus } from "./schema"
import type { BangumiCollection, BangumiSubject } from "./normalize"

const BANGUMI_API_BASE = "https://api.bgm.tv/v0"
const BANGUMI_PAGE_SIZE = 50
const BANGUMI_TIMEOUT_MS = 8_000
const BANGUMI_RETRY_DELAYS_MS = [500, 1_500] as const
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

class BangumiHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = "BangumiHttpError"
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getAccessToken() {
  return process.env.BANGUMI_ACCESS_TOKEN?.trim() || null
}

export function getBangumiErrorStatus(error: unknown) {
  return error instanceof BangumiHttpError ? error.status : null
}

export async function bangumiRequest<T>(path: string): Promise<T> {
  const token = getAccessToken()
  let lastError: unknown

  for (let attempt = 0; attempt <= BANGUMI_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(BANGUMI_API_BASE + path, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "nothing-new/1.0 (https://github.com/proffitteoy/nothing-new)",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(BANGUMI_TIMEOUT_MS),
      })

      if (response.ok) return (await response.json()) as T

      const error = new BangumiHttpError(
        response.status,
        `Bangumi request failed: ${response.status} ${path}`,
      )
      if (!RETRYABLE_STATUS.has(response.status)) throw error
      lastError = error
    } catch (error) {
      if (error instanceof BangumiHttpError && !RETRYABLE_STATUS.has(error.status)) throw error
      lastError = error
    }

    const delay = BANGUMI_RETRY_DELAYS_MS[attempt]
    if (delay === undefined) break
    await sleep(delay)
  }

  throw lastError instanceof Error ? lastError : new Error(`Bangumi request failed: ${path}`)
}

type BangumiMe = {
  username?: string
}

type BangumiCollectionPage = {
  total: number
  limit: number
  offset: number
  data: BangumiCollection[]
}

export async function getBangumiUsername() {
  const configured = process.env.BANGUMI_USERNAME?.trim()
  if (configured) return configured

  if (!getAccessToken()) {
    throw new Error("BANGUMI_USERNAME or BANGUMI_ACCESS_TOKEN is required")
  }

  const me = await bangumiRequest<BangumiMe>("/me")
  const username = me.username?.trim()
  if (!username) throw new Error("Bangumi /me did not return a username")
  return username
}

function collectionType(status: AnimeStatus) {
  return status === "watching" ? 3 : 2
}

export async function getBangumiCollections(username: string, status: AnimeStatus) {
  const items: BangumiCollection[] = []

  for (let offset = 0; ; offset += BANGUMI_PAGE_SIZE) {
    const params = new URLSearchParams({
      subject_type: "2",
      type: String(collectionType(status)),
      limit: String(BANGUMI_PAGE_SIZE),
      offset: String(offset),
    })
    const page = await bangumiRequest<BangumiCollectionPage>(
      `/users/${encodeURIComponent(username)}/collections?${params}`,
    )
    items.push(...page.data)
    if (items.length >= page.total || page.data.length < BANGUMI_PAGE_SIZE) break
  }

  return items
}

export function getBangumiSubject(id: number) {
  return bangumiRequest<BangumiSubject>(`/subjects/${id}`)
}
