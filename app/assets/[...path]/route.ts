import { getCloudflareContext } from "@opennextjs/cloudflare"
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

async function fetchStaticImage(request: Request, path: string[]): Promise<Response> {
  const { env } = getCloudflareContext()
  const assets = (env as CloudflareEnv & { ASSETS?: { fetch: typeof fetch } }).ASSETS
  if (!assets) return new Response(null, { status: 404 })

  const url = new URL("/" + path.map(encodeURIComponent).join("/"), request.url)
  const headers = new Headers()
  const validator = request.headers.get("if-none-match")
  if (validator) headers.set("If-None-Match", validator)
  const response = await assets.fetch(new Request(url, { headers }))
  if (response.ok && !response.headers.get("content-type")?.startsWith("image/")) {
    return new Response(null, { status: 404 })
  }
  return response
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
    // Current public bundles cover the same paths without depending on the old image store.
    const resource = upstream.status === 404 ? await fetchStaticImage(request, path) : upstream
    return buildBlobResponse(resource, SITE_IMAGE_CACHE_POLICY)
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
