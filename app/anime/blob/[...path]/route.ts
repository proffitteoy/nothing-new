import { buildImmutableCacheHeaders } from "../../../../lib/anime/cache"
import { fetchAnimeBlob } from "../../../../lib/anime/blob"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const SNAPSHOT_PATTERN = /^snapshots\/[a-f0-9]{12}\.json$/
const COVER_PATTERN = /^covers\/\d+-[a-f0-9]{12}\.(?:jpg|png|webp|avif|gif)$/

export const runtime = "nodejs"

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params
  const relativePath = path.join("/")
  if (!SNAPSHOT_PATTERN.test(relativePath) && !COVER_PATTERN.test(relativePath)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const upstream = await fetchAnimeBlob(`anime/${relativePath}`)
    if (!upstream.ok) {
      return new Response("Not found", {
        status: upstream.status === 404 ? 404 : 502,
        headers: { "Cache-Control": "no-store" },
      })
    }

    const headers = new Headers(buildImmutableCacheHeaders())
    const contentType = upstream.headers.get("content-type")
    const etag = upstream.headers.get("etag")
    if (contentType) headers.set("Content-Type", contentType)
    if (etag) headers.set("ETag", etag)

    return new Response(upstream.body, { status: 200, headers })
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
