import "server-only"

import { createHash } from "node:crypto"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { get as getVercelBlob } from "@vercel/blob"

const VERCEL_BLOB_API = "https://vercel.com/api/blob/"
const VERCEL_BLOB_API_VERSION = "12"
const BLOB_ACCESS = "private" as const
const BLOB_RETRY_DELAYS_MS = [0, 500, 1_500] as const
const writtenBlobs = new WeakMap<object, Map<string, Response>>()

function getContentKV() {
  try {
    const { env, ctx } = getCloudflareContext()
    const kv = (env as CloudflareEnv & { SITE_CONTENT?: CloudflareEnv["NEXT_INC_CACHE_KV"] })
      .SITE_CONTENT
    return kv ? { kv, ctx } : null
  } catch {
    return null
  }
}

export function hasBlobStorage() {
  return Boolean(
    getContentKV() ||
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  )
}

type BlobPutResult = {
  url: string
  pathname: string
  contentType: string
  etag: string
}

type BlobAuth = {
  kind: "oidc" | "read-write-token"
  token: string
  storeId: string
}

function normalizeStoreId(storeId: string) {
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId
}

function storeIdFromReadWriteToken(token: string) {
  const [, , , storeId] = token.split("_")
  return storeId ? normalizeStoreId(storeId) : null
}

function getBlobAuth(): BlobAuth {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim()
  const oidcStoreId = process.env.BLOB_STORE_ID?.trim()
  if (oidcToken && oidcStoreId) {
    return { kind: "oidc", token: oidcToken, storeId: normalizeStoreId(oidcStoreId) }
  }

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (readWriteToken) {
    const storeId = storeIdFromReadWriteToken(readWriteToken)
    if (!storeId) throw new Error("BLOB_READ_WRITE_TOKEN does not contain a Blob store id")
    return { kind: "read-write-token", token: readWriteToken, storeId }
  }

  throw new Error(
    "Vercel Blob is not configured. Connect a Blob store or provide BLOB_STORE_ID with VERCEL_OIDC_TOKEN / BLOB_READ_WRITE_TOKEN.",
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryableBlobStatus(status: number) {
  return status === 429 || status >= 500
}

function cleanBlobPath(pathname: string) {
  return pathname.replace(/^\/+/, "")
}

export function getBlobUrl(pathname: string) {
  const encodedPath = cleanBlobPath(pathname)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  if (getContentKV()) return `cloudflare-kv://SITE_CONTENT/${encodedPath}`
  const { storeId } = getBlobAuth()
  return `https://${storeId}.${BLOB_ACCESS}.blob.vercel-storage.com/${encodedPath}`
}

export async function putBlob(
  pathname: string,
  body: string | ArrayBuffer,
  options: {
    contentType: string
    cacheControlMaxAge: number
    allowOverwrite?: boolean
  },
): Promise<BlobPutResult> {
  const content = getContentKV()
  if (content) {
    const key = cleanBlobPath(pathname)
    if (!options.allowOverwrite && (await content.kv.get(key)) !== null) {
      throw new Error(`Content already exists: ${key}`)
    }
    const bytes = typeof body === "string" ? body : new Uint8Array(body)
    const etag = `"${createHash("sha256").update(bytes).digest("hex")}"`
    const metadata = {
      contentType: options.contentType,
      etag,
      cacheControlMaxAge: options.cacheControlMaxAge,
    }
    await content.kv.put(key, body, { metadata })
    // KV is eventually consistent. Snapshot verification must read this request's own write.
    let written = writtenBlobs.get(content.ctx)
    if (!written) writtenBlobs.set(content.ctx, (written = new Map()))
    written.set(
      key,
      new Response(body, {
        headers: {
          "Content-Type": options.contentType,
          ETag: etag,
          "Cache-Control": `private, max-age=${options.cacheControlMaxAge}`,
        },
      }),
    )
    return { url: getBlobUrl(key), pathname: key, contentType: options.contentType, etag }
  }
  const { token, storeId } = getBlobAuth()
  const url = new URL(VERCEL_BLOB_API)
  url.searchParams.set("pathname", cleanBlobPath(pathname))
  let lastError = "unknown error"

  for (let attempt = 0; attempt < BLOB_RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = BLOB_RETRY_DELAYS_MS[attempt]
    if (delay > 0) await sleep(delay)

    try {
      const response = await fetch(url, {
        method: "PUT",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-version": VERCEL_BLOB_API_VERSION,
          "x-api-blob-request-id": `${storeId}:${Date.now()}:${crypto.randomUUID()}`,
          "x-api-blob-request-attempt": String(attempt),
          "x-vercel-blob-store-id": storeId,
          "x-vercel-blob-access": BLOB_ACCESS,
          "x-add-random-suffix": "0",
          "x-allow-overwrite": options.allowOverwrite ? "1" : "0",
          "x-content-type": options.contentType,
          "x-cache-control-max-age": String(options.cacheControlMaxAge),
        },
        signal: AbortSignal.timeout(20_000),
      })

      if (response.ok) return (await response.json()) as BlobPutResult

      const message = await response.text().catch(() => "")
      lastError = `${response.status} ${message}`.trim()
      if (!retryableBlobStatus(response.status) || attempt === BLOB_RETRY_DELAYS_MS.length - 1) {
        throw new Error(`Vercel Blob upload failed: ${lastError}`)
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Vercel Blob upload failed:")) {
        throw error
      }
      lastError = error instanceof Error ? error.message : "unknown error"
      if (attempt === BLOB_RETRY_DELAYS_MS.length - 1) {
        throw new Error(`Vercel Blob upload failed after retries: ${lastError}`)
      }
    }
  }

  throw new Error(`Vercel Blob upload failed: ${lastError}`)
}

export async function fetchBlob(
  pathname: string,
  options: { ifNoneMatch?: string; useCache?: boolean } = {},
) {
  const content = getContentKV()
  if (content) {
    const key = cleanBlobPath(pathname)
    let response = writtenBlobs.get(content.ctx)?.get(key)?.clone()
    if (!response) {
      const stored = await content.kv.getWithMetadata<{
        contentType: string
        etag: string
        cacheControlMaxAge: number
      }>(key, { type: "arrayBuffer", cacheTtl: 60 })
      if (stored.value === null) return new Response(null, { status: 404 })
      response = new Response(stored.value, {
        headers: {
          "Content-Type": stored.metadata?.contentType ?? "application/octet-stream",
          ETag: stored.metadata?.etag ?? "",
          "Cache-Control": `private, max-age=${stored.metadata?.cacheControlMaxAge ?? 0}`,
        },
      })
    }
    if (options.ifNoneMatch && options.ifNoneMatch === response.headers.get("etag")) {
      return new Response(null, { status: 304, headers: response.headers })
    }
    return response
  }
  const auth = getBlobAuth()
  const credentials =
    auth.kind === "oidc" ? { oidcToken: auth.token, storeId: auth.storeId } : { token: auth.token }
  const result = await getVercelBlob(cleanBlobPath(pathname), {
    access: BLOB_ACCESS,
    useCache: options.useCache ?? true,
    ifNoneMatch: options.ifNoneMatch,
    abortSignal: AbortSignal.timeout(10_000),
    ...credentials,
  })

  if (!result) return new Response(null, { status: 404 })

  const headers = new Headers(Array.from(result.headers.entries()))
  if (result.blob.etag) headers.set("ETag", result.blob.etag)
  if (result.blob.contentType) headers.set("Content-Type", result.blob.contentType)
  return new Response(result.stream, { status: result.statusCode, headers })
}

export async function readBlobJson<T>(pathname: string): Promise<T> {
  const response = await fetchBlob(pathname)
  if (!response.ok) {
    throw new Error(`Vercel Blob read failed: ${response.status} ${pathname}`)
  }
  return (await response.json()) as T
}

export async function readBlobText(pathname: string) {
  const response = await fetchBlob(pathname)
  if (!response.ok) {
    throw new Error(`Vercel Blob read failed: ${response.status} ${pathname}`)
  }
  return response.text()
}
