import { NextResponse } from "next/server"
import { fetchAnimeBlob } from "../../../../lib/anime/blob"
import {
  animeErrorMessage,
  logAnimeError,
  logAnimeInfo,
} from "../../../../lib/anime/observability"
import { readLatestAnimeSnapshot } from "../../../../lib/anime/snapshot"
import { syncAnimeData } from "../../../../lib/anime/sync"

export const runtime = "nodejs"
export const maxDuration = 300

function authorized(request: Request, secret: string | undefined) {
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`
}

function previewBootstrapAllowed(request: Request) {
  const url = new URL(request.url)
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feat/anime-snapshot-pipeline" &&
    url.searchParams.get("bootstrap") === "1"
  )
}

async function verifyPreviewPipeline() {
  const { latest, snapshot } = await readLatestAnimeSnapshot()
  const cover = snapshot.items.find((item) => item.cover?.startsWith("/anime/blob/covers/"))?.cover
  if (!cover) throw new Error("No mirrored cover is available for verification")

  const blobPath = `anime/${cover.replace(/^\/anime\/blob\//, "")}`
  const coverResponse = await fetchAnimeBlob(blobPath)
  if (!coverResponse.ok) throw new Error(`Mirrored cover verification failed: ${coverResponse.status}`)

  const contentType = coverResponse.headers.get("content-type") || ""
  if (!contentType.startsWith("image/")) {
    throw new Error(`Mirrored cover has invalid content type: ${contentType || "missing"}`)
  }

  return NextResponse.json({
    success: true,
    snapshotVersion: latest.version,
    snapshotPath: latest.snapshot,
    count: snapshot.items.length,
    coverPath: cover,
    coverStatus: coverResponse.status,
    coverContentType: contentType,
  })
}

async function runSync() {
  const started = Date.now()
  const startedAt = new Date(started).toISOString()

  logAnimeInfo("sync.started", { startedAt })

  try {
    return NextResponse.json(await syncAnimeData())
  } catch (error) {
    const finished = Date.now()
    const failure = {
      success: false,
      startedAt,
      finishedAt: new Date(finished).toISOString(),
      duration: finished - started,
      error: animeErrorMessage(error),
    }
    logAnimeError("sync.failed", failure)
    return NextResponse.json({ error: "Anime sync failed" }, { status: 502 })
  }
}

export async function GET(request: Request) {
  if (previewBootstrapAllowed(request)) {
    const url = new URL(request.url)
    logAnimeInfo("sync.preview-bootstrap", { method: "GET", verify: url.searchParams.get("verify") === "1" })
    if (url.searchParams.get("verify") === "1") {
      try {
        return await verifyPreviewPipeline()
      } catch (error) {
        logAnimeError("sync.preview-verify-failed", { error: animeErrorMessage(error) })
        return NextResponse.json({ error: "Anime preview verification failed" }, { status: 502 })
      }
    }
    return runSync()
  }
  if (!authorized(request, process.env.CRON_SECRET)) {
    logAnimeInfo("sync.rejected", { method: "GET", status: 401 })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runSync()
}

export async function POST(request: Request) {
  if (!authorized(request, process.env.ANIME_SYNC_SECRET)) {
    logAnimeInfo("sync.rejected", { method: "POST", status: 401 })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runSync()
}
