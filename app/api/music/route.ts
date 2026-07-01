import { NextRequest, NextResponse } from 'next/server'
import { fetchNeteaseSongsByIds } from './_mineradio'

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)
  const results = await fetchNeteaseSongsByIds(songIds)

  return NextResponse.json(results)
}
