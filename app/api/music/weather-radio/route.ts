import { NextRequest, NextResponse } from 'next/server'
import { buildWeatherRadio } from '../_mineradio'

export async function GET(request: NextRequest) {
  const params = {
    city: request.nextUrl.searchParams.get('city') || request.nextUrl.searchParams.get('q') || '',
    lat: request.nextUrl.searchParams.get('lat'),
    lon: request.nextUrl.searchParams.get('lon'),
    timezone: request.nextUrl.searchParams.get('timezone') || '',
    limit: Number(request.nextUrl.searchParams.get('limit') || 18),
  }

  try {
    return NextResponse.json(await buildWeatherRadio(params))
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'weather_radio_failed',
        radio: {
          title: '天气电台',
          subtitle: '天气暂时没有回来，可以先听默认歌单。',
          seedQueries: [],
          songs: [],
          updatedAt: Date.now(),
        },
      },
      { status: 500 },
    )
  }
}
