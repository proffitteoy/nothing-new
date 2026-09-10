import { NextRequest, NextResponse } from "next/server"
import {
  bangumiRequest,
  getBangumiErrorStatus,
} from "../../../../lib/anime/bgm-client"
import { buildPublicCacheControl } from "../../../../lib/anime/cache"
import {
  animeErrorMessage,
  logAnimeError,
  logAnimeInfo,
} from "../../../../lib/anime/observability"
import { resolveBangumiProxyTarget } from "../../../../lib/anime/proxy"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const started = Date.now()
  const { path } = await context.params
  const target = resolveBangumiProxyTarget(path, request.nextUrl.searchParams)

  if (!target) {
    logAnimeInfo("proxy.rejected", {
      endpoint: request.nextUrl.pathname,
      status: 404,
      duration: Date.now() - started,
      cacheStatus: "bypass",
      upstreamStatus: null,
    })
    return NextResponse.json({ error: "Bangumi endpoint is not allowed" }, { status: 404 })
  }

  try {
    const data = await bangumiRequest<unknown>(target.path)
    logAnimeInfo("proxy.completed", {
      endpoint: target.path,
      status: 200,
      duration: Date.now() - started,
      cacheStatus: "origin",
      upstreamStatus: 200,
      cacheSeconds: target.cacheSeconds,
    })
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": buildPublicCacheControl(0, target.cacheSeconds),
      },
    })
  } catch (error) {
    logAnimeError("proxy.failed", {
      endpoint: target.path,
      status: 502,
      duration: Date.now() - started,
      cacheStatus: "origin",
      upstreamStatus: getBangumiErrorStatus(error),
      error: animeErrorMessage(error),
    })
    return NextResponse.json({ error: "Bangumi upstream request failed" }, { status: 502 })
  }
}
