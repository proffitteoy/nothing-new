import "server-only"

import { createHash } from "node:crypto"
import { unstable_cache } from "next/cache"
import { fetchBlob, getBlobUrl } from "./blob"
import { compilePaperReports } from "./papers"
import seedReports from "../data/tda-reports.json"

export const PAPER_REPORTS_PATH = "papers/reports.json"
export const PAPER_REPORTS_TAG = "paper-reports"

// Keep latest-first compilation independent from the archive. Every API GET still reads Blob.
const compiledSnapshots: Partial<
  Record<
    "all" | "latest",
    {
      version: string
      result: ReturnType<typeof compilePaperReports>
    }
  >
> = {}

export function compilePaperSnapshot(source: unknown, scope: "all" | "latest" = "all") {
  const payload =
    scope === "latest" && Array.isArray(source)
      ? [...source].sort((a, b) => String(b?.path).localeCompare(String(a?.path))).slice(0, 1)
      : source
  const version = createHash("sha256").update(JSON.stringify(payload)).digest("hex")
  if (compiledSnapshots[scope]?.version === version) return compiledSnapshots[scope]!.result
  const entry = { version, result: compilePaperReports(payload) }
  compiledSnapshots[scope] = entry
  void entry.result.catch(() => {
    if (compiledSnapshots[scope] === entry) delete compiledSnapshots[scope]
  })
  return entry.result
}

export async function readPaperReports(scope: "all" | "latest" = "all") {
  let source: unknown = seedReports
  if (
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  ) {
    const response = await fetchBlob(PAPER_REPORTS_PATH, { useCache: false })
    if (response.ok) source = await response.json()
    else if (response.status !== 404) throw new Error(`Blob returned ${response.status}`)
  }
  return compilePaperSnapshot(source, scope)
}

export async function getInitialPaperReports() {
  try {
    const configured =
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
    const scope = configured ? getBlobUrl(PAPER_REPORTS_PATH) : "seed"
    // This project uses the route-cache model, without Cache Components.
    // Include the source store so builds for different environments cannot share its reports.
    return await unstable_cache(
      async () => ({ reports: await readPaperReports("latest"), updatedAt: Date.now() }),
      ["paper-reports-initial", scope],
      { revalidate: 60, tags: [PAPER_REPORTS_TAG] },
    )()
  } catch (error) {
    console.error(
      "Initial paper report read failed",
      error instanceof Error ? error.message : "Unknown error",
    )
    // Keep failures out of the shared cache; the browser can immediately retry this fallback.
    return { reports: await compilePaperSnapshot(seedReports, "latest"), updatedAt: 0 }
  }
}
