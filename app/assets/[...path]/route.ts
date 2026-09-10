import { fetchBlob } from "../../../lib/blob"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const ROOT_IMAGE_PATHS = new Set([
  "about-cover.png",
  "avatar.jpg",
  "background.png",
  "profile-studio.png",
])
const IMAGE_EXTENSION = /\.(?:avif|gif|ico|jpe?g|png|webp)$/iu
const IMAGE_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800"

export const runtime = "nodejs"

function isAllowedImagePath(pathname: string) {
  if (
    !pathname ||
    pathname.includes("\\") ||
    pathname.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
    !IMAGE_EXTENSION.test(pathname)
  ) {
    return false
  }

  return (
    ROOT_IMAGE_PATHS.has(pathname) ||
    pathname.startsWith("chatter-covers/") ||
    pathname.startsWith("quartz-assets/content/")
  )
}

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params
  const relativePath = path.join("/")
  if (!isAllowedImagePath(relativePath)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const upstream = await fetchBlob(`images/${relativePath}`)
    if (!upstream.ok) {
      return new Response("Not found", {
        status: upstream.status === 404 ? 404 : 502,
        headers: { "Cache-Control": "no-store" },
      })
    }

    const headers = new Headers({
      "Cache-Control": IMAGE_CACHE_CONTROL,
      "CDN-Cache-Control": IMAGE_CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    })
    const contentType = upstream.headers.get("content-type")
    const etag = upstream.headers.get("etag")
    if (contentType) headers.set("Content-Type", contentType)
    if (etag) headers.set("ETag", etag)

    return new Response(upstream.body, { status: 200, headers })
  } catch (error) {
    console.error(
      "[assets/blob] image read failed:",
      error instanceof Error ? error.message : "unknown error",
    )
    return new Response("Blob asset temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
