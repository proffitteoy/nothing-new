import { NextResponse } from "next/server"
import { buildLatestPointerCacheHeaders } from "../../../lib/anime/cache"
import { readAnimeLatestPointer } from "../../../lib/anime/snapshot"

export const runtime = "nodejs"

export async function GET() {
  try {
    const latest = await readAnimeLatestPointer()
    return NextResponse.json(latest, {
      headers: buildLatestPointerCacheHeaders(),
    })
  } catch (error) {
    console.error(
      "[anime/latest.json] latest pointer unavailable:",
      error instanceof Error ? error.message : "unknown error",
    )
    return NextResponse.json(
      { error: "Anime snapshot pointer is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
