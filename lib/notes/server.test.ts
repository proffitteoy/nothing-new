import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import type { NoteArtifact, NoteManifest } from "./types"

const source = ts.transpileModule(readFileSync(new URL("./server.ts", import.meta.url), "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText

function note(route: string, text = "", modified = "2026-01-01"): NoteArtifact {
  return {
    version: 1,
    route,
    slug: route.slice(6),
    simpleSlug: route.slice(6),
    section: "blog",
    sourcePath: `${route}.md`,
    title: route,
    description: "",
    dates: { modified },
    tags: [],
    toc: [],
    backlinks: [],
    links: [],
    html: "",
    text,
    assets: [],
    features: { mermaid: false, popovers: false },
  }
}

function reader(notes: NoteArtifact[], aliases: Record<string, string> = {}) {
  const root = path.join("notes-test", ".quartz-cache", "next")
  const files = new Map<string, unknown>()
  const artifacts = Object.fromEntries(
    notes.map((item, i) => {
      const file = `artifacts/${i}.json`
      files.set(path.join(root, file), item)
      return [item.route, file]
    }),
  )
  files.set(path.join(root, "manifest.json"), {
    artifacts,
    aliases,
    folders: { blog: [], chatter: [] },
  } as Partial<NoteManifest>)
  const reads: string[] = []
  const exports = {} as typeof import("./server")
  runInNewContext(source, {
    exports,
    process: { cwd: () => "notes-test" },
    require: (name: string) => {
      if (name === "server-only") return {}
      if (name === "node:path") return path
      if (name === "react") return { cache: (fn: unknown) => fn }
      if (name === "node:fs/promises")
        return {
          readFile: async (file: string) => {
            reads.push(file)
            assert.ok(files.has(file), `unexpected file read: ${file}`)
            return JSON.stringify(files.get(file))
          },
        }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return {
    ...exports,
    artifactReads: () => reads.filter((file) => !file.endsWith("manifest.json")),
  }
}

test("preferred blog entry reads only its artifact, even when it is short", async () => {
  const preferred = "/blog/math/Fubini-Tonelli定理"
  const api = reader([note("/blog/other", "x".repeat(400)), note(preferred)])
  assert.equal(await api.getBlogEntryRoute(), encodeURI(preferred))
  assert.equal(api.artifactReads().length, 1)
  assert.ok(api.artifactReads()[0].endsWith("1.json"))
})

test("missing preferred entry retains date sorting and the readable fallback", async () => {
  const api = reader([
    note("/blog/older", "x".repeat(300)),
    note("/blog/newest", "short", "2026-02-01"),
    note("/blog/最晚正文", "y".repeat(400), "2026-01-02"),
  ])
  assert.equal(await api.getBlogEntryRoute(), encodeURI("/blog/最晚正文"))
  assert.equal(api.artifactReads().length, 3)
})

test("empty and short-only sections retain the blog landing fallback", async () => {
  for (const notes of [[], [note("/blog/short", "short")]]) {
    assert.equal(await reader(notes).getBlogEntryRoute(), "/blog")
  }
})

test("preferred and ordinary aliases resolve to canonical artifacts", async () => {
  const canonical = "/blog/math/规范名称"
  const api = reader([note(canonical)], {
    "/blog/math/Fubini-Tonelli定理": canonical,
    "/blog/旧标题": canonical,
  })
  assert.equal(await api.getBlogEntryRoute(), encodeURI(canonical))
  assert.equal((await api.getNoteByRoute("/blog/旧标题"))?.route, canonical)
})

test("folder reads filter the manifest before loading and preserve nested sort order", async () => {
  const api = reader([
    note("/blog/math/older"),
    note("/blog/math/sub/newer", "", "2026-02-01"),
    note("/blog/mathematics/unrelated"),
    note("/blog/other"),
  ])
  const notes = await api.getFolderNotes("blog", "/blog/math/")
  assert.deepEqual(
    [...notes].map((item) => item.route),
    ["/blog/math/sub/newer", "/blog/math/older"],
  )
  assert.equal(api.artifactReads().length, 2)
  assert.equal((await api.getFolderNotes("blog", "/blog/missing")).length, 0)
  assert.equal(api.artifactReads().length, 2)
})
