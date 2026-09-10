import { NextResponse } from "next/server"
import { syncAnimeData } from "../../../../lib/anime/sync"

export const runtime = "nodejs"
export const maxDuration = 300

function authorized(request: Request, secret: string | undefined) {
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`
}

async function runSync() {
  try {
    return NextResponse.json(await syncAnimeData())
  } catch (error) {
    console.error(
      "[api/anime/sync] failed:",
      error instanceof Error ? error.message : "unknown error",
    )
    return NextResponse.json({ error: "Anime sync failed" }, { status: 502 })
  }
}

export async function GET(request: Request) {
  if (!authorized(request, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runSync()
}

export async function POST(request: Request) {
  if (!authorized(request, process.env.ANIME_SYNC_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runSync()
}
