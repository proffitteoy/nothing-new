import { timingSafeEqual } from "node:crypto"
import { revalidatePath, revalidateTag } from "next/cache"
import { after } from "next/server"
import { putBlob } from "../../../lib/blob"
import {
  compilePaperSnapshot,
  readPaperReports,
  PAPER_REPORTS_PATH,
  PAPER_REPORTS_TAG,
} from "../../../lib/paper-reports-server"

export const runtime = "nodejs"
export const maxDuration = 60
const MAX_BYTES = 2_000_000

export async function GET(request?: Request) {
  try {
    const scope =
      request && new URL(request.url).searchParams.get("latest") === "1" ? "latest" : "all"
    return Response.json(
      { reports: await readPaperReports(scope) },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error(
      "Paper report read failed",
      error instanceof Error ? error.message : "Unknown error",
    )
    return Response.json(
      { error: "Paper reports unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    )
  }
}

export async function POST(request: Request) {
  const secret = process.env.PAPERS_SYNC_SECRET
  if (!secret) return Response.json({ error: "Paper sync is not configured" }, { status: 503 })
  const actual = Buffer.from(request.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected application/json" }, { status: 415 })
  }
  // Enforce the limit while streaming, including requests without Content-Length.
  const reader = request.body?.getReader()
  if (!reader) return Response.json({ error: "Empty body" }, { status: 400 })
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BYTES) {
      await reader.cancel()
      return Response.json({ error: "Payload too large" }, { status: 413 })
    }
    chunks.push(value)
  }
  let source: unknown
  let reportCount: number
  try {
    source = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    reportCount = (await compilePaperSnapshot(source)).length
  } catch {
    return Response.json({ error: "Invalid paper reports" }, { status: 400 })
  }
  try {
    await putBlob(PAPER_REPORTS_PATH, JSON.stringify(source), {
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60,
      allowOverwrite: true,
    })
  } catch (error) {
    console.error(
      "Paper report sync failed",
      error instanceof Error ? error.message : "Unknown error",
    )
    return Response.json({ error: "Paper report storage failed" }, { status: 502 })
  }
  revalidateTag(PAPER_REPORTS_TAG, { expire: 0 })
  revalidatePath("/papers")
  // Warm the rendered pages after invalidations commit. The API and RSC bundles
  // can have distinct unstable_cache keys, so warming only this bundle is insufficient.
  after(async () => {
    await Promise.allSettled(
      ["/papers"].map(async (path) => {
        try {
          const response = await fetch(new URL(path, request.url), {
            cache: "no-store",
            signal: AbortSignal.timeout(12_000),
          })
          if (!response.ok) throw new Error(`Page returned ${response.status}`)
          await response.arrayBuffer()
        } catch (error) {
          console.error(
            "Paper page warm failed",
            path,
            error instanceof Error ? error.message : "Unknown error",
          )
        }
      }),
    )
  })
  return Response.json({ success: true, reports: reportCount })
}
