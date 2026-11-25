import type { PaperReport } from "./papers"

type Scope = "latest" | "all"
const caches: Partial<
  Record<
    Scope,
    {
      reports: PaperReport[] | null
      serialized: string
      expiresAt: number
      updatedAt: number
      pending: Promise<PaperReport[]> | null
    }
  >
> = {}

function isReports(value: unknown): value is PaperReport[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (report) =>
        report &&
        typeof report.date === "string" &&
        typeof report.introduction === "string" &&
        typeof report.conclusion === "string" &&
        Array.isArray(report.papers) &&
        report.papers.length > 0 &&
        report.papers.every(
          (paper: PaperReport["papers"][number]) =>
            paper &&
            typeof paper.title === "string" &&
            typeof paper.priority === "string" &&
            typeof paper.html === "string" &&
            (paper.url === null || typeof paper.url === "string") &&
            (paper.authors === undefined ||
              (Array.isArray(paper.authors) &&
                paper.authors.every((author) => typeof author === "string"))) &&
            (paper.year === undefined || typeof paper.year === "string"),
        ),
    )
  )
}

// Keep each successful scope readable while it is checked in the background.
export function getCachedPaperReports(scope: Scope = "latest"): PaperReport[] | null {
  return caches[scope]?.reports ?? null
}

export function loadPaperReports(
  initialReports?: PaperReport[],
  initialUpdatedAt = 0,
  scope: Scope = "latest",
): Promise<PaperReport[]> {
  const state = (caches[scope] ??= {
    reports: null,
    serialized: "",
    expiresAt: 0,
    updatedAt: 0,
    pending: null,
  })
  if (initialReports && initialUpdatedAt > state.updatedAt) {
    const serialized = JSON.stringify(initialReports)
    state.reports =
      state.reports && state.serialized === serialized ? state.reports : initialReports
    state.serialized = serialized
    state.updatedAt = initialUpdatedAt
    state.expiresAt = initialUpdatedAt + 60_000
    if (scope === "latest" && caches.all && initialUpdatedAt > caches.all.updatedAt)
      caches.all.expiresAt = 0
  }
  if (state.reports && Date.now() < state.expiresAt) return Promise.resolve(state.reports)
  if (state.pending) return state.pending
  const startedAt = Date.now()
  // Consumers stop their own updates on unmount; they never abort a shared request.
  state.pending = fetch(scope === "latest" ? "/api/papers?latest=1" : "/api/papers", {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Paper reports unavailable")
      const data = (await response.json()) as { reports?: unknown } | null
      if (!isReports(data?.reports)) throw new Error("Invalid paper reports")
      if (state.reports && state.updatedAt > startedAt) return state.reports
      const serialized = JSON.stringify(data.reports)
      if (scope === "latest" && state.serialized !== serialized && caches.all)
        caches.all.expiresAt = 0
      state.reports =
        state.reports && state.serialized === serialized ? state.reports : data.reports
      state.serialized = serialized
      state.updatedAt = Date.now()
      state.expiresAt = state.updatedAt + 60_000
      return state.reports
    })
    .finally(() => {
      state.pending = null
    })
  return state.pending
}
