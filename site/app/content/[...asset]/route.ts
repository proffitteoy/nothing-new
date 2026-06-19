import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

const CONTENT_ROOT = resolveContentRoot()

const mimeMap: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".pdf": "application/pdf",
}

type RouteContext = {
  params: Promise<{
    asset: string[]
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { asset } = await context.params
  const relativePath = asset.join("/")
  const resolvedPath = path.resolve(CONTENT_ROOT, relativePath)
  const relativeToRoot = path.relative(CONTENT_ROOT, resolvedPath)

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return new Response("Not Found", { status: 404 })
  }

  try {
    const file = await fs.readFile(resolvedPath)
    const contentType = mimeMap[path.extname(resolvedPath).toLowerCase()] ?? "application/octet-stream"
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not Found", { status: 404 })
  }
}

function resolveContentRoot() {
  const candidates = [
    process.env.CONTENT_ROOT,
    path.resolve(process.cwd(), "content"),
    path.resolve(process.cwd(), "..", "content"),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0] ?? path.resolve(process.cwd(), "content")
}
