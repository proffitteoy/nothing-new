import assert from "node:assert/strict"
import test from "node:test"
import type { PaperReport } from "./papers"
import { getCachedPaperReports, loadPaperReports } from "./paper-reports-client"

test("paper preloading shares requests, expires after 60s, and retains the last success", async (t) => {
  let now = 1000
  let calls = 0
  let controller = new AbortController()
  let respond: (response: Response) => void = () => {}
  t.mock.method(Date, "now", () => now)
  t.mock.method(AbortSignal, "timeout", (milliseconds: number) => {
    assert.equal(milliseconds, 12_000)
    controller = new AbortController()
    return controller.signal
  })
  t.mock.method(globalThis, "fetch", (url: string, options: RequestInit) => {
    assert.ok(url === "/api/papers?latest=1" || url === "/api/papers")
    assert.equal(options.cache, "no-store")
    assert.equal(options.signal, controller.signal)
    calls++
    return new Promise<Response>((resolve, reject) => {
      respond = resolve
      options.signal?.addEventListener("abort", () => reject(options.signal?.reason), {
        once: true,
      })
    })
  })
  const source: PaperReport[] = [
    {
      date: "2026-11-23",
      introduction: "",
      conclusion: "",
      papers: [{ title: "A paper", priority: "高", html: "<p>Summary</p>", url: null }],
    },
  ]

  assert.equal(getCachedPaperReports(), null)
  const startup = loadPaperReports()
  assert.equal(loadPaperReports(), startup, "sidebar and page join the startup request")
  respond(Response.json({ reports: source }))
  const first = await startup
  assert.equal(calls, 1)
  assert.equal(getCachedPaperReports(), first)

  now += 59_999
  assert.equal(await loadPaperReports(), first)
  assert.equal(calls, 1, "fresh cache does not re-fetch")
  now++
  const refresh = loadPaperReports()
  assert.equal(loadPaperReports(), refresh)
  assert.equal(getCachedPaperReports(), first, "expired data remains readable during refresh")
  respond(Response.json({ reports: source }))
  assert.equal(await refresh, first, "unchanged reports keep their reference and mounted graph")
  assert.equal(calls, 2)

  now += 60_000
  const changed = loadPaperReports()
  respond(Response.json({ reports: [{ ...source[0], introduction: "Updated" }] }))
  const latest = await changed
  assert.notEqual(latest, first)
  assert.equal(latest[0].introduction, "Updated")

  now += 60_000
  for (const response of [
    new Response(null, { status: 502 }),
    new Response("{broken JSON"),
    Response.json(null),
    Response.json({ reports: [] }),
    Response.json({ reports: [{ date: "2026-11-23", papers: [] }] }),
    Response.json({ reports: [{ ...source[0], papers: [{ title: "Missing body" }] }] }),
  ]) {
    const failed = loadPaperReports()
    assert.equal(loadPaperReports(), failed)
    respond(response)
    await assert.rejects(failed)
    assert.equal(getCachedPaperReports(), latest, "failure does not replace the last success")
  }

  const timedOut = loadPaperReports()
  controller.abort(new DOMException("Request timed out", "TimeoutError"))
  await assert.rejects(timedOut, { name: "TimeoutError" })
  assert.equal(getCachedPaperReports(), latest)
  const retry = loadPaperReports()
  assert.notEqual(retry, timedOut, "failed requests never remain cached")
  respond(Response.json({ reports: [{ ...source[0], introduction: "Updated" }] }))
  assert.equal(await retry, latest)
  const completedCalls = calls
  assert.equal(await loadPaperReports(), latest)
  assert.equal(calls, completedCalls, "a successful retry starts a new freshness window")

  now += 60_000
  const prepared: PaperReport[] = [{ ...source[0], introduction: "Prepared on the server" }]
  assert.equal(await loadPaperReports(prepared, now), prepared)
  assert.equal(calls, completedCalls, "fresh server-prepared reports need no browser request")

  now += 60_000
  const olderRequest = loadPaperReports()
  now++
  const newerPrepared: PaperReport[] = [{ ...source[0], introduction: "Newer prepared issue" }]
  assert.equal(await loadPaperReports(newerPrepared, now), newerPrepared)
  respond(Response.json({ reports: prepared }))
  assert.equal(
    await olderRequest,
    newerPrepared,
    "an earlier request cannot overwrite the prepared version",
  )
  assert.equal(
    await loadPaperReports(prepared, now - 1),
    newerPrepared,
    "old route payloads cannot replace a fresher browser cache",
  )
  const latestBeforeArchive = getCachedPaperReports()
  const archive = loadPaperReports(undefined, 0, "all")
  assert.equal(loadPaperReports(undefined, 0, "all"), archive)
  respond(Response.json({ reports: [...newerPrepared, { ...source[0], date: "2026-10-30" }] }))
  const archived = await archive
  assert.equal(archived.length, 2)
  assert.equal(
    getCachedPaperReports(),
    latestBeforeArchive,
    "archive loading cannot replace the latest cache",
  )
  assert.equal(getCachedPaperReports("all"), archived)
  const archiveCalls = calls
  assert.equal(await loadPaperReports(undefined, 0, "all"), archived)
  assert.equal(calls, archiveCalls)
})
