import { NextRequest, NextResponse } from "next/server"
import { bangumiRequest } from "../../../../../lib/anime/bgm-client"
import { buildPublicCacheControl } from "../../../../../lib/anime/cache"
import { resolveBangumiProxyTarget } from "../../../../../lib/anime/proxy"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const target = resolveBangumiProxyTarget(path, request.nextUrl.searchParams)

  if (!target) {
    return NextResponse.json({ error: "Bangumi endpoint is not allowed" }, { status: 404 })
  }

  try {
    const data = await bangumiRequest<unknown>(target.path)
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": buildPublicCacheControl(0, target.cacheSeconds),
      },
    })
  } catch (error) {
    console.error(
      `[api/bgm] ${target.path} failed:`,
      error instanceof Error ? error.message : "unknown error",
    )
    return NextResponse.json({ error: "Bangumi upstream request failed" }, { status: 502 })
  }
}
