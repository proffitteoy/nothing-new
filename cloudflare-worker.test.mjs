import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = ts.transpileModule(
  readFileSync(new URL("./cloudflare-worker.mjs", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function runtime() {
  const actors = new Map()
  const states = new Map()
  const legacy = new Map()
  const contexts = []
  let legacyWrites = 0
  let legacyReads = 0
  let handler = async () => new Response("ok")
  class Base {
    constructor(ctx, env) {
      this.ctx = ctx
      this.env = env
    }
  }
  const exports = {}
  runInNewContext(source, {
    exports,
    Response,
    Request,
    URL,
    TextEncoder,
    TextDecoder,
    ArrayBuffer,
    Uint8Array,
    Map,
    require(name) {
      if (name === "cloudflare:workers") return { DurableObject: Base, WorkerEntrypoint: Base }
      if (name === "./.open-next/worker.js")
        return {
          default: {
            fetch: (request, env, ctx) => {
              contexts.push(ctx)
              return handler(request, env, ctx)
            },
          },
          DOQueueHandler: Base,
          DOShardedTagCache: Base,
          BucketCachePurge: Base,
        }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  let entry
  const root = {
    exports: { default: { fetch: (request) => entry.fetch(request) } },
    waitUntil() {},
  }
  const env = {
    SITE_CONTENT: {
      async getWithMetadata(key) {
        legacyReads++
        return structuredClone(legacy.get(key) ?? { value: null, metadata: null })
      },
      async put() {
        legacyWrites++
        throw new Error("KV daily write limit exceeded")
      },
    },
  }
  env.SITE_RUNTIME = {
    getByName(name) {
      if (!actors.has(name)) {
        let data = new Map()
        let failPut = false
        const storage = {
          async get(key) {
            if (Array.isArray(key))
              return new Map(
                key.filter((k) => data.has(k)).map((k) => [k, structuredClone(data.get(k))]),
              )
            return structuredClone(data.get(key))
          },
          async put(key, value) {
            for (const [k, v] of typeof key === "string" ? [[key, value]] : Object.entries(key)) {
              data.set(k, structuredClone(v))
              if (failPut) {
                failPut = false
                throw new Error("SQLite write failed")
              }
            }
          },
          async delete(keys) {
            for (const key of Array.isArray(keys) ? keys : [keys]) data.delete(key)
          },
          async transaction(callback) {
            const before = structuredClone(data)
            try {
              return await callback(storage)
            } catch (error) {
              data = before
              throw error
            }
          },
        }
        states.set(name, {
          failNextPut: () => {
            failPut = true
          },
          keys: () => [...data.keys()],
        })
        actors.set(name, new exports.SiteRuntime({ ...root, storage }, env))
      }
      return actors.get(name)
    },
  }
  entry = new exports.default(root, env)
  return {
    entry,
    env,
    states,
    legacy,
    contexts,
    setHandler: (next) => {
      handler = next
    },
    metrics: () => ({ legacyReads, legacyWrites }),
  }
}

test("Free runtime executes Next inside a Durable Object and stores cache without KV writes", async () => {
  const app = runtime()
  app.setHandler(async (_request, env) => {
    assert.equal(await env.NEXT_INC_CACHE_KV.get("missing", "json"), null)
    await env.NEXT_INC_CACHE_KV.put("page", JSON.stringify({ html: "rendered" }))
    return Response.json(await env.NEXT_INC_CACHE_KV.get("page", "json"))
  })
  const result = await app.entry.fetch(new Request("https://site.test/papers"))
  assert.deepEqual(await result.json(), { html: "rendered" })
  assert.equal(app.states.has("request:/papers"), true)
  assert.equal(app.states.has("store:cache:page"), true)
  assert.deepEqual(app.metrics(), { legacyReads: 0, legacyWrites: 0 })
})

test("image optimizer reads dynamic sources within the same deployment without wrapping their ASSETS", async () => {
  const app = runtime()
  const staticReads = []
  app.env.ASSETS = {
    async fetch(request) {
      staticReads.push(new URL(request.url).pathname)
      return new Response("static image")
    },
  }
  app.setHandler(async (request, env) => {
    const url = new URL(request.url)
    if (url.pathname.startsWith("/_next/image")) {
      const source = new URL(url.searchParams.get("url"), url)
      return env.ASSETS.fetch(url.pathname.endsWith("/") ? new Request(source) : source)
    }
    assert.equal(env.ASSETS, app.env.ASSETS)
    if (url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(new Request(new URL("/avatar.jpg", url)))
    }
    return new Response("stored cover", { headers: { "Content-Type": "image/jpeg" } })
  })
  const cover = "/anime/blob/covers/123-abcdef123456.jpg"
  for (const optimizer of ["/_next/image", "/_next/image/"]) {
    const result = await app.entry.fetch(
      new Request(`https://preview.test${optimizer}?url=${encodeURIComponent(cover)}`),
    )
    assert.equal(await result.text(), "stored cover")
    assert.equal(result.headers.get("content-type"), "image/jpeg")
  }
  const legacy = await app.entry.fetch(
    new Request("https://preview.test/_next/image?url=%2Fassets%2Favatar.jpg"),
  )
  assert.equal(await legacy.text(), "static image")
  assert.deepEqual(staticReads, ["/avatar.jpg"])
  assert.equal(app.states.has(`request:${cover}`), true)
  assert.equal(app.states.has("request:/assets/avatar.jpg"), true)
  assert.equal(new Set(app.contexts).size, app.contexts.length)
})

test("optimizer keeps static images and unrelated or cross-origin paths on the real ASSETS binding", async () => {
  const app = runtime()
  const sources = []
  app.env.ASSETS = {
    async fetch(request) {
      sources.push(request.url)
      return new Response("static binding")
    },
  }
  app.setHandler((request, env) =>
    env.ASSETS.fetch(new URL(new URL(request.url).searchParams.get("url"), request.url)),
  )
  for (const path of [
    "/avatar.jpg",
    "/api/papers",
    "/anime/blob/snapshots/abcdef123456.json",
    "https://other.test/anime/blob/covers/123-abcdef123456.jpg",
  ]) {
    const response = await app.entry.fetch(
      new Request(`https://preview.test/_next/image?url=${encodeURIComponent(path)}`),
    )
    assert.equal(await response.text(), "static binding")
    assert.equal(sources.at(-1), new URL(path, "https://preview.test").href)
  }
  assert.deepEqual([...app.states.keys()], ["request:/_next/image"])
})

test("content reads legacy KV, then shares new binary data and metadata across request actors", async () => {
  const app = runtime()
  app.legacy.set("cover", { value: new Uint8Array([1, 2, 3]).buffer, metadata: { type: "old" } })
  const body = new Uint8Array(2 * 1024 * 1024 + 7)
  body[0] = 42
  body[body.length - 1] = 255
  let returnedMetadata
  app.setHandler(async (request, env) => {
    if (request.method === "PUT") {
      await env.SITE_CONTENT.put("cover", await request.arrayBuffer(), {
        metadata: { type: "image/png" },
      })
      return new Response("written")
    }
    const stored = await env.SITE_CONTENT.getWithMetadata("cover", { type: "arrayBuffer" })
    returnedMetadata = stored.metadata
    return new Response(stored.value)
  })
  const old = await app.entry.fetch(new Request("https://site.test/old-cover"))
  assert.deepEqual(new Uint8Array(await old.arrayBuffer()), new Uint8Array([1, 2, 3]))
  await app.entry.fetch(new Request("https://site.test/upload", { method: "PUT", body }))
  const updated = await app.entry.fetch(new Request("https://site.test/new-cover"))
  assert.deepEqual(new Uint8Array(await updated.arrayBuffer()), body)
  assert.deepEqual(returnedMetadata, { type: "image/png" })
  assert.deepEqual(app.states.get("store:content:cover").keys().sort(), ["0", "1", "meta"])
  assert.equal(app.metrics().legacyWrites, 0)
  assert.equal(new Set(app.contexts).size, 3)
})

test("deletion shadows legacy content and failed transactions preserve the published value", async () => {
  const app = runtime()
  app.legacy.set("reports", {
    value: new TextEncoder().encode('{"version":0}').buffer,
    metadata: null,
  })
  app.setHandler(async (request, env) => {
    if (request.method === "DELETE") await env.SITE_CONTENT.delete("reports")
    if (request.method === "PUT") await env.SITE_CONTENT.put("reports", await request.text())
    return Response.json(await env.SITE_CONTENT.get("reports", "json"))
  })
  await app.entry.fetch(
    new Request("https://site.test/reports", { method: "PUT", body: '{"version":1}' }),
  )
  app.states.get("store:content:reports").failNextPut()
  await assert.rejects(
    app.entry.fetch(
      new Request("https://site.test/reports", { method: "PUT", body: '{"version":2}' }),
    ),
    /SQLite write failed/,
  )
  assert.deepEqual(await (await app.entry.fetch(new Request("https://site.test/reports"))).json(), {
    version: 1,
  })
  assert.equal(
    await (
      await app.entry.fetch(new Request("https://site.test/reports", { method: "DELETE" }))
    ).json(),
    null,
  )
  assert.deepEqual(app.states.get("store:content:reports").keys(), ["meta"])
  assert.equal(new Set(app.contexts).size, app.contexts.length)
})
