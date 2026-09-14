import { fetchBlob } from "../../../lib/blob"
import { buildBlobResponse, SITE_IMAGE_CACHE_POLICY } from "../../../lib/blob-response"

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

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params
  const relativePath = path.join("/")
  if (!isAllowedImagePath(relativePath)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const upstream = await fetchBlob(`images/${relativePath}`, {
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    return buildBlobResponse(upstream, SITE_IMAGE_CACHE_POLICY)
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
