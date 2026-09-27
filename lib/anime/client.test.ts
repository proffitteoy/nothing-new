import assert from "node:assert/strict"
import test from "node:test"
import { loadAnimeSnapshot, getCachedAnimeSnapshot } from "./client"

test("startup and shelf share requests, failures retry, and metadata expires", async (t) => {
  let fail = true
  let calls = 0
  let now = 1000
  t.mock.method(Date, "now", () => now)
  t.mock.method(console, "warn", () => {})
  t.mock.method(globalThis, "fetch", async (url: string) => {
    calls++
    if (fail) return new Response(null, { status: 503 })
    return Response.json(
      url === "/anime/latest.json"
        ? { snapshot: "/anime/snapshots/test.json" }
        : { version: 1, username: "test", items: [], updatedAt: "test" },
    )
  })
  const failed = loadAnimeSnapshot()
  assert.equal(loadAnimeSnapshot(), failed)
  await assert.rejects(failed)
  assert.equal(getCachedAnimeSnapshot(), null)
  assert.equal(calls, 2, "latest failure still tries the existing API fallback")
  fail = false
  const pending = loadAnimeSnapshot()
  assert.equal(loadAnimeSnapshot(), pending)
  const result = await pending
  assert.equal(await loadAnimeSnapshot(), result)
  assert.equal(calls, 4, "home, startup and shelf reuse the resolved snapshot")
  now += 300001
  assert.equal(getCachedAnimeSnapshot(), null)
  await loadAnimeSnapshot()
  assert.equal(calls, 6, "latest pointer is refreshed after its freshness window")
})
