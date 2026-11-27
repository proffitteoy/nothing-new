import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import * as blobResponse from "../../../lib/blob-response"

const source = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function route(stored: Response, getAsset: (request: Request) => Response) {
  const exports = {} as typeof import("./route")
  const reads: string[] = []
  const requests: Request[] = []
  runInNewContext(source, {
    exports,
    URL,
    Headers,
    Request,
    Response,
    require: (name: string) => {
      if (name === "@opennextjs/cloudflare")
        return {
          getCloudflareContext: () => ({
            env: {
              ASSETS: {
                fetch: async (request: Request) => {
                  requests.push(request)
                  return getAsset(request)
                },
              },
            },
          }),
        }
      if (name.endsWith("/blob"))
        return {
          fetchBlob: async (key: string) => {
            reads.push(key)
            return stored
          },
        }
      if (name.endsWith("/blob-response")) return blobResponse
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return {
    reads,
    requests,
    get: (path: string[], headers?: HeadersInit) =>
      exports.GET(new Request("https://nothing-new.cn/assets/example.png", { headers }), {
        params: Promise.resolve({ path }),
      }),
  }
}

test("legacy route prefers existing Cloudflare content and never reads static on a hit", async () => {
  const api = route(
    new Response("legacy cover", { headers: { "Content-Type": "image/png", ETag: '"legacy"' } }),
    () => {
      throw new Error("unexpected asset read")
    },
  )
  const image = await api.get(["chatter-covers", "cover.png"])
  assert.equal(image.status, 200)
  assert.equal(await image.text(), "legacy cover")
  assert.equal(image.headers.get("etag"), '"legacy"')
  assert.deepEqual(api.reads, ["images/chatter-covers/cover.png"])
  assert.deepEqual(api.requests, [])
})

test("a missing compatibility key reads the packaged asset and forwards its validator", async () => {
  const api = route(
    new Response(null, { status: 404 }),
    (request) =>
      new Response(null, {
        status: request.headers.get("if-none-match") === '"static"' ? 304 : 404,
        headers: { ETag: '"static"' },
      }),
  )
  const result = await api.get(["quartz-assets", "content", "笔记 1.png"], {
    "If-None-Match": '"static"',
    Authorization: "not forwarded",
  })
  assert.equal(result.status, 304)
  assert.equal(result.headers.get("etag"), '"static"')
  assert.equal(
    api.requests[0].url,
    "https://nothing-new.cn/quartz-assets/content/%E7%AC%94%E8%AE%B0%201.png",
  )
  assert.equal(api.requests[0].headers.has("authorization"), false)
})

test("invalid legacy paths never call storage and an HTML asset fallback is not served as an image", async () => {
  const api = route(
    new Response(null, { status: 404 }),
    () => new Response("<html></html>", { headers: { "Content-Type": "text/html" } }),
  )
  assert.equal((await api.get(["chatter-covers", "..", "private.png"])).status, 404)
  assert.deepEqual(api.reads, [])
  assert.deepEqual(api.requests, [])
  assert.equal((await api.get(["avatar.jpg"])).status, 404)
})
