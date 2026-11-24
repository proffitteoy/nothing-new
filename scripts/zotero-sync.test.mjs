import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"
import { publicPaper, syncZotero } from "./zotero-sync.mjs"

const item = (key = "ABCD2345", data = {}) => ({
  key,
  version: 1,
  library: { type: "user", id: 123 },
  data: {
    itemType: "journalArticle",
    title: "A paper",
    DOI: "10.1234/ABC",
    extra: "arXiv: 2401.12345v2",
    creators: [],
    tags: [],
    ...data,
  },
})
const collections = [
  { key: "ROOT2345", data: { name: "Public", parentCollection: false } },
  { key: "CHILD234", data: { name: "Child", parentCollection: "ROOT2345" } },
  { key: "PRIV2345", data: { name: "Private", parentCollection: false } },
]

async function fixture(t, responder) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "zotero-sync-test-"))
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  const config = {
    libraryPath: "users/0",
    collections: [{ key: "ROOT2345", includeChildren: true }],
    outputFile: path.join(directory, "papers.json"),
    decisionFile: path.join(directory, "decisions.json"),
  }
  const calls = []
  const request = async (url) => {
    calls.push(String(url))
    if (url.pathname.endsWith("/collections")) return Response.json(collections)
    return responder(url)
  }
  return {
    config,
    calls,
    request,
    read: async () => JSON.parse(await fs.readFile(config.outputFile, "utf8")),
  }
}

test("only approved Collections and children export a metadata whitelist; flags remain independent", async (t) => {
  const f = await fixture(t, async (url) =>
    Response.json(
      url.pathname.includes("CHILD234")
        ? [item("CHILDKEY", { tags: [{ tag: "paper:reading" }] })]
        : [
            item("ABCD2345", {
              tags: [{ tag: "private-tag" }, { tag: "paper:read" }],
              note: "private note",
              attachments: ["private.pdf"],
            }),
            item("NOTESKEY", { itemType: "note", note: "secret" }),
            item("FILE2345", { itemType: "attachment", path: "private.pdf" }),
          ],
    ),
  )
  const result = await syncZotero(f.config, { fetch: f.request })
  assert.equal(result.papers, 2)
  assert.ok(f.calls.every((url) => !url.includes("PRIV2345") && !url.includes("children")))
  const snapshot = await f.read()
  assert.equal(snapshot.papers[0].readingStatus, "read")
  assert.equal(snapshot.collections.find((entry) => entry.id === "CHILD234").parentId, "ROOT2345")
  assert.equal(snapshot.papers[1].readingStatus, "reading")
  assert.equal(snapshot.papers[0].arxiv, "2401.12345")
  assert.equal(snapshot.papers[0].doi, "10.1234/abc")
  assert.deepEqual(snapshot.papers[0].aliases, ["zotero:users:123:ABCD2345"])
  assert.doesNotMatch(
    JSON.stringify(snapshot),
    /private-tag|private note|private.pdf|secret|hasNotes|unread/,
  )
  assert.equal(publicPaper(item(), f.config, []).readingStatus, null)
})

test("pagination collects all pages and exclusion wins over item approval", async (t) => {
  const f = await fixture(t, async (url) => {
    const start = Number(url.searchParams.get("start"))
    const data =
      start === 0
        ? Array.from({ length: 100 }, (_, index) => item(String(index).padStart(8, "A")))
        : [item("LAST2345")]
    return Response.json(data, { headers: { "Total-Results": "101" } })
  })
  f.config.collections[0].includeChildren = false
  f.config.reviewMode = "items"
  f.config.approvedItems = ["zotero:personal:LAST2345"]
  f.config.exclude = ["zotero:personal:LAST2345"]
  assert.equal((await syncZotero(f.config, { fetch: f.request })).papers, 0)
  assert.ok(f.calls.some((url) => url.includes("start=100")))
  f.config.exclude = []
  assert.equal((await syncZotero(f.config, { fetch: f.request })).papers, 1)
})

test("dry-run and check never write, successful unchanged sync preserves its timestamp", async (t) => {
  const f = await fixture(t, async () => Response.json([item()]))
  await syncZotero(f.config, { fetch: f.request, dryRun: true })
  await assert.rejects(f.read(), { code: "ENOENT" })
  await syncZotero(f.config, { fetch: f.request, check: true })
  await assert.rejects(f.read(), { code: "ENOENT" })
  await syncZotero(f.config, { fetch: f.request })
  const previous = await f.read()
  assert.equal((await syncZotero(f.config, { fetch: f.request })).changed, false)
  assert.deepEqual(await f.read(), previous)
})

test("unfiled indexing includes dangling memberships but excludes valid unapproved folders", async (t) => {
  const f = await fixture(t, async (url) =>
    Response.json(
      url.pathname.endsWith("/items/top") && !url.pathname.includes("/collections/")
        ? [
            item("LOST2345", { collections: ["REMOVED1"] }),
            item("HIDE2345", { collections: ["PRIV2345"] }),
          ]
        : [item()],
    ),
  )
  f.config.includeUnfiled = true
  await syncZotero(f.config, { fetch: f.request })
  const snapshot = await f.read()
  assert.ok(
    snapshot.papers.some(
      (entry) => entry.id === "zotero:personal:LOST2345" && entry.collections[0].id === "unfiled",
    ),
  )
  assert.ok(!snapshot.papers.some((entry) => entry.id === "zotero:personal:HIDE2345"))
})

test("API failures, truncated pagination, missing Collections and unexpected emptiness preserve the previous snapshot", async (t) => {
  const f = await fixture(t, async () => Response.json([item()]))
  await syncZotero(f.config, { fetch: f.request })
  const previous = await fs.readFile(f.config.outputFile, "utf8")
  for (const responder of [
    async () => {
      throw new Error("connection refused")
    },
    async () => new Response("unavailable", { status: 503 }),
    async () => Response.json({ error: "malformed" }),
    async () => Response.json([], { headers: { "Total-Results": "1" } }),
    async () => Response.json([]),
  ]) {
    await assert.rejects(
      syncZotero(f.config, {
        fetch: async (url) =>
          url.pathname.endsWith("/collections") ? Response.json(collections) : responder(),
      }),
    )
    assert.equal(await fs.readFile(f.config.outputFile, "utf8"), previous)
  }
  await assert.rejects(
    syncZotero({ ...f.config, collections: [{ key: "MISSING1" }] }, { fetch: f.request }),
  )
  await assert.rejects(syncZotero({ ...f.config, collections: [] }, { fetch: f.request }))
  assert.equal(await fs.readFile(f.config.outputFile, "utf8"), previous)
})
