import { NextResponse } from "next/server"
import {
  animeErrorMessage,
  logAnimeError,
  logAnimeInfo,
} from "../../../../lib/anime/observability"
import { syncAnimeData } from "../../../../lib/anime/sync"

export const runtime = "nodejs"
export const maxDuration = 300

function authorized(request: Request, secret: string | undefined) {
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`
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
