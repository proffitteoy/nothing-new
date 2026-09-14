import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildBlobResponse, SITE_IMAGE_CACHE_POLICY } from "./blob-response"

describe("private Blob proxy responses", () => {
  it("preserves validators and separates browser from Vercel CDN caching", () => {
    const response = buildBlobResponse(
      new Response("image", {
        headers: { "Content-Type": "image/png", ETag: '"asset-v1"' },
      }),
      SITE_IMAGE_CACHE_POLICY,
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get("etag"), '"asset-v1"')
    assert.equal(response.headers.get("cache-control"), SITE_IMAGE_CACHE_POLICY.browser)
    assert.equal(response.headers.get("vercel-cdn-cache-control"), SITE_IMAGE_CACHE_POLICY.cdn)
  })

  it("returns an empty 304 with the same validator and cache policy", () => {
    const response = buildBlobResponse(
      new Response(null, { status: 304, headers: { ETag: '"asset-v1"' } }),
      SITE_IMAGE_CACHE_POLICY,
    )

    assert.equal(response.status, 304)
    assert.equal(response.body, null)
    assert.equal(response.headers.get("etag"), '"asset-v1"')
    assert.equal(response.headers.get("cache-control"), SITE_IMAGE_CACHE_POLICY.browser)
  })

  it("does not cache missing or failed upstream responses", () => {
    const missing = buildBlobResponse(new Response(null, { status: 404 }), SITE_IMAGE_CACHE_POLICY)
    const failed = buildBlobResponse(new Response(null, { status: 503 }), SITE_IMAGE_CACHE_POLICY)
    assert.equal(missing.status, 404)
    assert.equal(failed.status, 502)
    assert.equal(failed.headers.get("cache-control"), "no-store")
  })
})
