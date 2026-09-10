import "server-only"

const VERCEL_BLOB_API = "https://vercel.com/api/blob/"
const VERCEL_BLOB_API_VERSION = "12"
const ANIME_BLOB_ACCESS = "private" as const

type BlobPutResult = {
  url: string
  pathname: string
  contentType: string
  etag: string
}

type BlobAuth = {
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
    return { token: oidcToken, storeId: normalizeStoreId(oidcStoreId) }
  }

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (readWriteToken) {
    const storeId = storeIdFromReadWriteToken(readWriteToken)
    if (!storeId) throw new Error("BLOB_READ_WRITE_TOKEN does not contain a Blob store id")
    return { token: readWriteToken, storeId }
  }

  throw new Error(
    "Vercel Blob is not configured. Connect a Blob store or provide BLOB_STORE_ID with VERCEL_OIDC_TOKEN / BLOB_READ_WRITE_TOKEN.",
  )
}

export function getAnimeBlobUrl(pathname: string) {
  const cleanPath = pathname.replace(/^\/+/, "")
  const { storeId } = getBlobAuth()
  return `https://${storeId}.${ANIME_BLOB_ACCESS}.blob.vercel-storage.com/${cleanPath}`
}

export function getAnimePublicAssetPath(pathname: string) {
  const cleanPath = pathname.replace(/^\/+/, "").replace(/^anime\//, "")
  return `/anime/blob/${cleanPath}`
}

export async function putAnimeBlob(
  pathname: string,
  body: string | ArrayBuffer,
  options: {
    contentType: string
    cacheControlMaxAge: number
    allowOverwrite?: boolean
  },
): Promise<BlobPutResult> {
  const { token, storeId } = getBlobAuth()
  const url = new URL(VERCEL_BLOB_API)
  url.searchParams.set("pathname", pathname)

  const response = await fetch(url, {
    method: "PUT",
    body,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-version": VERCEL_BLOB_API_VERSION,
      "x-api-blob-request-id": `${storeId}:${Date.now()}:${crypto.randomUUID()}`,
      "x-api-blob-request-attempt": "0",
      "x-vercel-blob-store-id": storeId,
      "x-vercel-blob-access": ANIME_BLOB_ACCESS,
      "x-add-random-suffix": "0",
      "x-allow-overwrite": options.allowOverwrite ? "1" : "0",
      "x-content-type": options.contentType,
      "x-cache-control-max-age": String(options.cacheControlMaxAge),
    },
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(`Vercel Blob upload failed: ${response.status} ${message}`.trim())
  }

  return (await response.json()) as BlobPutResult
}

export async function fetchAnimeBlob(pathname: string) {
  const { token } = getBlobAuth()
  return fetch(getAnimeBlobUrl(pathname), {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
}

export async function readAnimeBlobJson<T>(pathname: string): Promise<T> {
  const response = await fetchAnimeBlob(pathname)
  if (!response.ok) {
    throw new Error(`Vercel Blob read failed: ${response.status} ${pathname}`)
  }
  return (await response.json()) as T
}

export async function readAnimeBlobText(pathname: string) {
  const response = await fetchAnimeBlob(pathname)
  if (!response.ok) {
    throw new Error(`Vercel Blob read failed: ${response.status} ${pathname}`)
  }
  return response.text()
}
