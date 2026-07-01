import { NextRequest, NextResponse } from 'next/server'
import { searchNeteaseSongs } from '../_mineradio'

export async function GET(request: NextRequest) {
  const keywords = request.nextUrl.searchParams.get('keywords') || request.nextUrl.searchParams.get('q') || ''
  const limit = Number(request.nextUrl.searchParams.get('limit') || 16)

  if (!keywords.trim()) {
    return NextResponse.json({ songs: [] })
  }

  try {
    const songs = await searchNeteaseSongs(keywords, limit)
    return NextResponse.json({ songs })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'search_failed',
        songs: [],
      },
      { status: 500 },
    )
  }
}
