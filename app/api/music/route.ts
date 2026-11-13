import { NextRequest, NextResponse } from "next/server"
import { fetchNeteaseSongsByIds } from "./_mineradio"

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids")
  if (!ids) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 })
  }

  const songIds = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
  // Limit the submitted batch before deduplication, preserving the first occurrence order.
  if (songIds.length === 0 || songIds.length > 32) {
    return NextResponse.json({ error: "Expected between 1 and 32 song IDs" }, { status: 400 })
  }
  if (songIds.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) {
    return NextResponse.json({ error: "Song IDs must be positive safe integers" }, { status: 400 })
  }
  const results = await fetchNeteaseSongsByIds([...new Set(songIds)])

  return NextResponse.json(results)
}
