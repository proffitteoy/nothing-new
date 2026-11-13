import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as crypto from "node:crypto"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import type { PaperReport } from "../../../lib/papers"

const source = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const payload = (markdown = "revision A") => [{ path: "reports/2026-11-12.md", markdown }]
const report = (introduction: string): PaperReport[] => [
  { date: "2026-11-12", introduction, conclusion: "", papers: [] },
]

function route(compile?: (value: unknown) => Promise<PaperReport[]>) {
  let stored = payload()
  let failWrite = false
  let compiles = 0
  let reads = 0
  let writes = 0
  const exports = {} as typeof import("./route")
  runInNewContext(source, {
    exports,
    Response,
    Buffer,
    console: { error() {} },
    process: { env: { BLOB_READ_WRITE_TOKEN: "test-only", PAPERS_SYNC_SECRET: "test-only" } },
    require: (name: string) => {
      if (name === "node:crypto") return crypto
      if (name.endsWith("tda-reports.json")) return payload()
      if (name.endsWith("/papers"))
        return {
          compilePaperReports: async (value: unknown) => {
            compiles++
            return compile
              ? compile(value)
              : report((value as ReturnType<typeof payload>)[0].markdown)
          },
        }
      if (name.endsWith("/blob"))
        return {
          fetchBlob: async (_pathname: string, options: { useCache: boolean }) => {
            assert.equal(options.useCache, false)
            reads++
            return Response.json(stored)
          },
          putBlob: async (_pathname: string, value: string) => {
            writes++
            if (failWrite) throw new Error("write failed")
            stored = JSON.parse(value)
          },
        }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return {
    ...exports,
    setSource: (value: ReturnType<typeof payload>) => {
      stored = value
    },
    failWrite: () => {
      failWrite = true
    },
    counts: () => ({ compiles, reads, writes }),
  }
}
const post = (value: unknown) =>
  new Request("http://localhost/api/papers", {
    method: "POST",
    headers: { authorization: "Bearer test-only", "content-type": "application/json" },
    body: JSON.stringify(value),
  })

test("concurrent GETs share compilation but each reads the latest Blob and returns no-store", async () => {
  let finish!: (reports: PaperReport[]) => void
  const pending = new Promise<PaperReport[]>((resolve) => {
    finish = resolve
  })
  const api = route(() => pending)
  const first = api.GET()
  const second = api.GET()
  await new Promise(setImmediate)
  assert.deepEqual(api.counts(), { compiles: 1, reads: 2, writes: 0 })
  finish(report("revision A"))
  for (const response of await Promise.all([first, second])) {
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("Cache-Control"), "no-store")
    assert.equal((await response.json()).reports[0].introduction, "revision A")
  }
})

test("a same-period Markdown correction is visible immediately and only one version is retained", async () => {
  const api = route()
  await api.GET()
  await api.GET()
  assert.equal(api.counts().compiles, 1)
  api.setSource(payload("revision B"))
  assert.equal((await (await api.GET()).json()).reports[0].introduction, "revision B")
  await api.GET()
  assert.equal(api.counts().compiles, 2)
  api.setSource(payload())
  await api.GET()
  assert.deepEqual(api.counts(), { compiles: 3, reads: 5, writes: 0 })
})

test("a failed compilation is evicted and an unchanged source can retry", async () => {
  let attempts = 0
  const api = route(async () => {
    if (++attempts === 1) throw new Error("temporary compile failure")
    return report("recovered")
  })
  const failed = await api.GET()
  assert.equal(failed.status, 502)
  assert.equal(failed.headers.get("Cache-Control"), "no-store")
  assert.equal((await (await api.GET()).json()).reports[0].introduction, "recovered")
  assert.equal(api.counts().compiles, 2)
})

test("an older failed compilation cannot evict the current successful version", async () => {
  let reject!: (reason: Error) => void
  const old = new Promise<PaperReport[]>((_resolve, fail) => {
    reject = fail
  })
  const api = route(async (value) =>
    (value as ReturnType<typeof payload>)[0].markdown === "revision A" ? old : report("revision B"),
  )
  const first = api.GET()
  await new Promise(setImmediate)
  api.setSource(payload("revision B"))
  assert.equal((await api.GET()).status, 200)
  reject(new Error("old version failed"))
  assert.equal((await first).status, 502)
  assert.equal((await (await api.GET()).json()).reports[0].introduction, "revision B")
  assert.equal(api.counts().compiles, 2)
})

test("POST validation compilation is reused by GET only after reading matching stored source", async () => {
  const api = route()
  assert.equal((await api.POST(post(payload("published revision")))).status, 200)
  assert.equal((await (await api.GET()).json()).reports[0].introduction, "published revision")
  assert.deepEqual(api.counts(), { compiles: 1, reads: 1, writes: 1 })
})

test("a failed POST write cannot make GET serve an unpublished compiled revision", async () => {
  const api = route()
  api.failWrite()
  assert.equal((await api.POST(post(payload("unpublished")))).status, 502)
  assert.equal((await (await api.GET()).json()).reports[0].introduction, "revision A")
  assert.deepEqual(api.counts(), { compiles: 2, reads: 1, writes: 1 })
})
