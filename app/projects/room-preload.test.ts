import assert from "node:assert/strict"
import test from "node:test"
import { preloadRoomAssets } from "./room-preload"

test("room prewarm shares compressed assets across visits and retries a failed download", async (t) => {
  let fail = true
  let calls = 0
  t.mock.method(globalThis, "fetch", async () => {
    calls++
    return fail ? new Response(null, { status: 503 }) : new Response(new Uint8Array([1, 2, 3]))
  })
  const failed = preloadRoomAssets()
  assert.equal(preloadRoomAssets(), failed)
  await assert.rejects(failed)
  fail = false
  const pending = preloadRoomAssets()
  assert.equal(preloadRoomAssets(), pending)
  const [model, night] = await pending
  assert.equal(model.byteLength, 3)
  assert.equal(night.size, 3)
  assert.equal(await preloadRoomAssets(), await pending)
  assert.equal(calls, 4, "only one pair of downloads per attempt")
})
