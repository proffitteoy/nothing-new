import assert from "node:assert/strict"
import * as crypto from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = ts.transpileModule(readFileSync(new URL("./blob.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function storage(cloudflare = true) {
  const committed = new Map<string, { value: ArrayBuffer; metadata: Record<string, unknown> }>()
  const pending = new Map<string, { value: ArrayBuffer; metadata: Record<string, unknown> }>()
  const env: Record<string, string> = {}
  let ctx = {}
  let failPut = false
  let sdkReads = 0
  const kv = {
    get: async (key: string) => committed.get(key)?.value ?? null,
    getWithMetadata: async (key: string, options: { cacheTtl: number }) => {
      assert.equal(options.cacheTtl, 60)
      return committed.get(key) ?? { value: null, metadata: null }
    },
    put: async (
      key: string,
      body: string | ArrayBuffer,
      options: { metadata: Record<string, unknown> },
    ) => {
      if (failPut) throw new Error("KV unavailable")
      const value = typeof body === "string" ? new TextEncoder().encode(body).buffer : body
      pending.set(key, { value, metadata: options.metadata })
    },
  }
  const exports = {} as typeof import("./blob")
  runInNewContext(source, {
    exports,
    Buffer,
    Response,
    Headers,
    URL,
    AbortSignal,
    Uint8Array,
    process: { env },
    require: (name: string) => {
      if (name === "server-only") return {}
      if (name === "node:crypto") return crypto
      if (name === "@opennextjs/cloudflare")
        return {
          getCloudflareContext() {
            if (!cloudflare) throw new Error("No Cloudflare context")
            return { env: { SITE_CONTENT: kv }, ctx }
          },
        }
      if (name === "@vercel/blob")
        return {
          get: async (_path: string, options: { access: string; useCache: boolean }) => {
            sdkReads++
            assert.equal(options.access, "private")
            assert.equal(options.useCache, false)
            const response = Response.json({ provider: "vercel" })
            return { stream: response.body, headers: response.headers, blob: {}, statusCode: 200 }
          },
        }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return {
    ...exports,
    env,
    commit: () => {
      for (const [key, value] of pending) committed.set(key, value)
    },
    nextRequest: () => {
      ctx = {}
    },
    failWrites: () => {
      failPut = true
    },
    sdkReads: () => sdkReads,
  }
}

test("KV verifies immutable snapshots before propagation without leaking writes across requests", async () => {
  const api = storage()
  assert.equal(api.hasBlobStorage(), true)
  const result = await api.putBlob("/anime/snapshots/example.json", '{"version":1}', {
    contentType: "application/json",
    cacheControlMaxAge: 600,
  })
  assert.match(result.etag, /^"[a-f0-9]{64}"$/)
  assert.deepEqual(await (await api.fetchBlob("anime/snapshots/example.json")).json(), {
    version: 1,
  })
  api.nextRequest()
  assert.equal((await api.fetchBlob("anime/snapshots/example.json")).status, 404)
  api.commit()
  const published = await api.fetchBlob("anime/snapshots/example.json")
  assert.equal(published.headers.get("content-type"), "application/json")
  assert.equal(published.headers.get("etag"), result.etag)
  assert.deepEqual(await published.json(), { version: 1 })
})

test("KV preserves binary covers and conditional responses, and rejects failed or duplicate writes", async () => {
  const api = storage()
  const image = new Uint8Array([0, 255, 127, 42]).buffer
  const result = await api.putBlob("anime/covers/image.png", image, {
    contentType: "image/png",
    cacheControlMaxAge: 86400,
  })
  const response = await api.fetchBlob("anime/covers/image.png")
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(image))
  assert.equal(
    (await api.fetchBlob("anime/covers/image.png", { ifNoneMatch: result.etag })).status,
    304,
  )
  api.commit()
  await assert.rejects(
    api.putBlob("anime/covers/image.png", image, {
      contentType: "image/png",
      cacheControlMaxAge: 86400,
    }),
    /already exists/,
  )
  api.failWrites()
  await assert.rejects(
    api.putBlob("failed.json", "{}", {
      contentType: "application/json",
      cacheControlMaxAge: 60,
    }),
    /KV unavailable/,
  )
  assert.equal((await api.fetchBlob("failed.json")).status, 404)
})

test("Node and Vercel keep the existing private Blob path", async () => {
  const api = storage(false)
  assert.equal(api.hasBlobStorage(), false)
  api.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teststore_synthetic"
  assert.equal(api.hasBlobStorage(), true)
  assert.equal(
    api.getBlobUrl("papers/reports.json"),
    "https://teststore.private.blob.vercel-storage.com/papers/reports.json",
  )
  assert.deepEqual(await (await api.fetchBlob("papers/reports.json", { useCache: false })).json(), {
    provider: "vercel",
  })
  assert.equal(api.sdkReads(), 1)
})
