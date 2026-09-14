import { buildImmutableCacheHeaders } from "../../../../lib/anime/cache"
import { fetchAnimeBlob } from "../../../../lib/anime/blob"
import { buildBlobResponse } from "../../../../lib/blob-response"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const SNAPSHOT_PATTERN = /^snapshots\/[a-f0-9]{12}\.json$/
const COVER_PATTERN = /^covers\/\d+-[a-f0-9]{12}\.(?:jpg|png|webp|avif|gif)$/

export const runtime = "nodejs"

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params
  const relativePath = path.join("/")
  if (!SNAPSHOT_PATTERN.test(relativePath) && !COVER_PATTERN.test(relativePath)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const upstream = await fetchAnimeBlob(`anime/${relativePath}`, {
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    const immutableHeaders = buildImmutableCacheHeaders()
    return buildBlobResponse(upstream, {
      browser: immutableHeaders["Cache-Control"],
      cdn: immutableHeaders["CDN-Cache-Control"],
    })
  } catch (error) {
    console.error(
      "[anime/blob] asset read failed:",
      error instanceof Error ? error.message : "unknown error",
    )
    return new Response("Blob asset temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
