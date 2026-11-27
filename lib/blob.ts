import "server-only"

import { createHash } from "node:crypto"
import { getCloudflareContext } from "@opennextjs/cloudflare"

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
  return getContentKV() !== null
}

type BlobPutResult = {
  url: string
  pathname: string
  contentType: string
  etag: string
}

function cleanBlobPath(pathname: string) {
  return pathname.replace(/^\/+/, "")
}

export function getBlobUrl(pathname: string) {
  const encodedPath = cleanBlobPath(pathname)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `cloudflare-kv://SITE_CONTENT/${encodedPath}`
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
  if (!content) throw new Error("Cloudflare SITE_CONTENT storage is not bound")
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
  // A snapshot must verify its own write without carrying responses across requests.
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

export async function fetchBlob(pathname: string, options: { ifNoneMatch?: string } = {}) {
  const content = getContentKV()
  if (!content) throw new Error("Cloudflare SITE_CONTENT storage is not bound")
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

export async function readBlobJson<T>(pathname: string): Promise<T> {
  const response = await fetchBlob(pathname)
  if (!response.ok) {
    throw new Error(`Site content read failed: ${response.status} ${pathname}`)
  }
  return (await response.json()) as T
}

export async function readBlobText(pathname: string) {
  const response = await fetchBlob(pathname)
  if (!response.ok) {
    throw new Error(`Site content read failed: ${response.status} ${pathname}`)
  }
  return response.text()
}
