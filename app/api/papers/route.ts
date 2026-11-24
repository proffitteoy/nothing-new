import { createHash, timingSafeEqual } from "node:crypto"
import { fetchBlob, putBlob } from "../../../lib/blob"
import { compilePaperReports } from "../../../lib/papers"
import seedReports from "../../../data/tda-reports.json"

export const runtime = "nodejs"
export const maxDuration = 60
const SNAPSHOT_PATH = "papers/reports.json"
const MAX_BYTES = 2_000_000

// Keep the latest issue independent of archive compilation. Every GET still reads Blob.
const compiledSnapshots: Partial<
  Record<"all" | "latest", { version: string; result: ReturnType<typeof compilePaperReports> }>
> = {}

function compileSnapshot(source: unknown, scope: "all" | "latest" = "all") {
  const payload =
    scope === "latest" && Array.isArray(source)
      ? [...source].sort((a, b) => String(b?.path).localeCompare(String(a?.path))).slice(0, 1)
      : source
  const version = createHash("sha256").update(JSON.stringify(payload)).digest("hex")
  const cached = compiledSnapshots[scope]
  if (cached?.version === version) return cached.result
  const entry = { version, result: compilePaperReports(payload) }
  compiledSnapshots[scope] = entry
  void entry.result.catch(() => {
    if (compiledSnapshots[scope] === entry) delete compiledSnapshots[scope]
  })
  return entry.result
}

export async function GET(request?: Request) {
  try {
    const scope =
      request && new URL(request.url).searchParams.get("latest") === "1" ? "latest" : "all"
    let source: unknown = seedReports
    if (
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
    ) {
      // Overwritten snapshots must bypass Blob's object cache after each Action run.
      const response = await fetchBlob(SNAPSHOT_PATH, { useCache: false })
      if (response.ok) source = await response.json()
      else if (response.status !== 404) throw new Error(`Blob returned ${response.status}`)
    }
    return Response.json(
      { reports: await compileSnapshot(source, scope) },
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
    reportCount = (await compileSnapshot(source)).length
  } catch {
    return Response.json({ error: "Invalid paper reports" }, { status: 400 })
  }
  try {
    await putBlob(SNAPSHOT_PATH, JSON.stringify(source), {
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60,
      allowOverwrite: true,
    })
    return Response.json({ success: true, reports: reportCount })
  } catch (error) {
    console.error(
      "Paper report sync failed",
      error instanceof Error ? error.message : "Unknown error",
    )
    return Response.json({ error: "Paper report storage failed" }, { status: 502 })
  }
}
