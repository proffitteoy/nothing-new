import { NextResponse } from "next/server"
import {
  getAnimeCollectionPage,
  type AnimeShelfStatus,
} from "../../anime/bangumi"

const PAGE_SIZE = 10
const CACHE_SECONDS = 30 * 60

function isShelfStatus(value: string | null): value is AnimeShelfStatus {
  return value === "watching" || value === "watched"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const offsetValue = Number(searchParams.get("offset") || "0")

  if (!isShelfStatus(status) || !Number.isInteger(offsetValue) || offsetValue < 0) {
    return NextResponse.json({ error: "invalid pagination parameters" }, { status: 400 })
  }

  try {
    const page = await getAnimeCollectionPage(status, offsetValue, PAGE_SIZE)
    return NextResponse.json(page, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    })
  } catch (error) {
    console.error(
      "[Bangumi] failed to load a collection page:",
      error instanceof Error ? error.message : "unknown error",
    )
    return NextResponse.json({ error: "Bangumi is temporarily unavailable" }, { status: 502 })
  }
}
