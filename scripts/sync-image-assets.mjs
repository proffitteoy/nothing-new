#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { globby } from "globby"

const VERCEL_BLOB_API = "https://vercel.com/api/blob/"
const VERCEL_BLOB_API_VERSION = "12"
const BLOB_ACCESS = "private"
const MANIFEST_PATH = "images/manifest.json"
const UPLOAD_CONCURRENCY = 4
const RETRY_DELAYS_MS = [0, 500, 1_500]
const IMAGE_GLOBS = [
  "about-cover.png",
  "avatar.jpg",
  "background.png",
  "profile-studio.png",
  "chatter-covers/**/*.{avif,gif,ico,jpeg,jpg,png,webp}",
  "quartz-assets/content/**/*.{avif,gif,ico,jpeg,jpg,png,webp}",
]
const CONTENT_TYPES = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

function normalizeStoreId(storeId) {
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId
}

function storeIdFromReadWriteToken(token) {
  const [, , , storeId] = token.split("_")
  return storeId ? normalizeStoreId(storeId) : null
}

function getBlobAuth() {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim()
  const oidcStoreId = process.env.BLOB_STORE_ID?.trim()
  if (oidcToken && oidcStoreId) {
    return { token: oidcToken, storeId: normalizeStoreId(oidcStoreId) }
  }
  if (oidcToken || oidcStoreId) {
    throw new Error("Vercel Blob OIDC requires both VERCEL_OIDC_TOKEN and BLOB_STORE_ID")
  }

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!readWriteToken) return null
  const storeId = storeIdFromReadWriteToken(readWriteToken)
  if (!storeId) throw new Error("BLOB_READ_WRITE_TOKEN does not contain a Blob store id")
  return { token: readWriteToken, storeId }
}

function blobUrl(auth, pathname) {
  const encodedPath = pathname
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `https://${auth.storeId}.${BLOB_ACCESS}.blob.vercel-storage.com/${encodedPath}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function putBlob(auth, pathname, body, contentType) {
  const url = new URL(VERCEL_BLOB_API)
  url.searchParams.set("pathname", pathname)
  let lastError = "unknown error"

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = RETRY_DELAYS_MS[attempt]
    if (delay > 0) await sleep(delay)

    try {
      const response = await fetch(url, {
        method: "PUT",
        body,
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "x-api-version": VERCEL_BLOB_API_VERSION,
          "x-api-blob-request-id": `${auth.storeId}:${Date.now()}:${randomUUID()}`,
          "x-api-blob-request-attempt": String(attempt),
          "x-vercel-blob-store-id": auth.storeId,
          "x-vercel-blob-access": BLOB_ACCESS,
          "x-add-random-suffix": "0",
          "x-allow-overwrite": "1",
          "x-content-type": contentType,
          "x-cache-control-max-age": "86400",
        },
        signal: AbortSignal.timeout(30_000),
      })

      if (response.ok) return
      const message = await response.text().catch(() => "")
      lastError = `${response.status} ${message}`.trim()
      if (
        (response.status !== 429 && response.status < 500) ||
        attempt === RETRY_DELAYS_MS.length - 1
      ) {
        throw new Error(`Vercel Blob upload failed: ${lastError}`)
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Vercel Blob upload failed:")) {
        throw error
      }
      lastError = error instanceof Error ? error.message : "unknown error"
      if (attempt === RETRY_DELAYS_MS.length - 1) {
        throw new Error(`Vercel Blob upload failed after retries: ${lastError}`)
      }
    }
  }
}

async function readManifest(auth) {
  const response = await fetch(blobUrl(auth, MANIFEST_PATH), {
    cache: "no-store",
    headers: { Authorization: `Bearer ${auth.token}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (response.status === 404) return { version: 1, assets: {} }
  if (!response.ok) {
    throw new Error(`Vercel Blob manifest read failed: ${response.status}`)
  }
  return response.json()
}

async function collectAssets(rootDir) {
  const publicRoot = path.resolve(rootDir, "public")
  const filePaths = await globby(IMAGE_GLOBS, {
    absolute: true,
    cwd: publicRoot,
    onlyFiles: true,
  })

  return Promise.all(
    filePaths
      .sort((left, right) => left.localeCompare(right, "zh-CN"))
      .map(async (filePath) => {
        const bytes = await fs.readFile(filePath)
        const publicPath = toPosix(path.relative(publicRoot, filePath))
        const contentType = CONTENT_TYPES[path.extname(filePath).toLocaleLowerCase("en-US")]
        return {
          blobPath: `images/${publicPath}`,
          bytes,
          contentType,
          publicPath,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          size: bytes.byteLength,
        }
      }),
  )
}

async function uploadChangedAssets(auth, assets) {
  let cursor = 0
  async function worker() {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= assets.length) return
      const asset = assets[index]
      await putBlob(auth, asset.blobPath, asset.bytes, asset.contentType)
      console.log(`[image-assets] 已上传: /${asset.publicPath}`)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, Math.max(assets.length, 1)) }, () =>
      worker(),
    ),
  )
}

export async function syncImageAssets({
  rootDir = process.cwd(),
  dryRun = false,
  check = false,
} = {}) {
  const assets = await collectAssets(rootDir)
  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)
  const auth = getBlobAuth()

  if (!auth) {
    if (check) throw new Error("未配置 Vercel Blob，无法检查远端图片")
    console.log(
      `[image-assets] 未配置 Blob，${dryRun ? "仅盘点" : "跳过同步"}: ${assets.length} 张，${totalBytes} bytes`,
    )
    return { assetCount: assets.length, changedCount: 0, removedCount: 0, skipped: true }
  }

  const previousManifest = await readManifest(auth)
  const changedAssets = assets.filter(
    (asset) => previousManifest.assets?.[asset.publicPath]?.sha256 !== asset.sha256,
  )
  const currentPaths = new Set(assets.map((asset) => asset.publicPath))
  const removedPaths = Object.keys(previousManifest.assets ?? {}).filter(
    (publicPath) => !currentPaths.has(publicPath),
  )

  if (check) {
    if (changedAssets.length > 0 || removedPaths.length > 0) {
      throw new Error(
        `Blob 图片未同步：待上传 ${changedAssets.length}，清单待移除 ${removedPaths.length}`,
      )
    }
    console.log(`[image-assets] check: ${assets.length} 张图片与 Blob 清单一致`)
    return { assetCount: assets.length, changedCount: 0, removedCount: 0, skipped: false }
  }

  if (dryRun) {
    console.log(
      `[image-assets] dry-run: 共 ${assets.length} 张，待上传 ${changedAssets.length}，清单待移除 ${removedPaths.length}`,
    )
    return {
      assetCount: assets.length,
      changedCount: changedAssets.length,
      removedCount: removedPaths.length,
      skipped: false,
    }
  }

  await uploadChangedAssets(auth, changedAssets)
  if (changedAssets.length > 0 || removedPaths.length > 0) {
    const manifest = {
      version: 1,
      assets: Object.fromEntries(
        assets.map((asset) => [
          asset.publicPath,
          { contentType: asset.contentType, sha256: asset.sha256, size: asset.size },
        ]),
      ),
    }
    await putBlob(auth, MANIFEST_PATH, JSON.stringify(manifest), "application/json; charset=utf-8")
  }

  console.log(
    `[image-assets] 完成: 共 ${assets.length} 张，上传 ${changedAssets.length}，清单移除 ${removedPaths.length}`,
  )
  return {
    assetCount: assets.length,
    changedCount: changedAssets.length,
    removedCount: removedPaths.length,
    skipped: false,
  }
}

function toPosix(value) {
  return value.replaceAll(path.sep, "/")
}

const directRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (directRun) {
  const args = new Set(process.argv.slice(2))
  await syncImageAssets({
    check: args.has("--check"),
    dryRun: args.has("--dry-run"),
  })
}
