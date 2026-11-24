import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildPaperLibrary,
  extractPaperRefs,
  normalizePaperRef,
  publicPaperNote,
  type ZoteroPaper,
} from "./paper-library"
import type { NoteArtifact } from "./notes/types"
import type { PaperReport } from "./papers"

const zotero = (overrides: Partial<ZoteroPaper> = {}): ZoteroPaper => ({
  id: "zotero:personal:ABCD2345",
  aliases: ["zotero:users:123:ABCD2345"],
  title: "Authoritative title",
  authors: ["A. Author"],
  year: "2024",
  doi: "10.1234/paper",
  arxiv: "2401.12345",
  url: null,
  abstract: "",
  collections: [],
  readingStatus: null,
  updatedAt: "2026-01-01",
  ...overrides,
})
const reports: PaperReport[] = [
  {
    date: "2026-11-02",
    introduction: "",
    conclusion: "",
    papers: [
      {
        title: "Weekly title",
        priority: "高",
        url: "https://arxiv.org/abs/2401.12345v2",
        html: "<p>Weekly review</p>",
      },
    ],
  },
]
const note = (overrides: Partial<NoteArtifact> = {}): NoteArtifact => ({
  version: 1,
  slug: "math/note",
  simpleSlug: "math/note",
  section: "blog",
  route: "/blog/math/note",
  sourcePath: "math/note.md",
  title: "Published note",
  description: "Preview",
  dates: {},
  tags: [],
  toc: [],
  backlinks: [],
  links: [],
  html: "",
  text: "",
  assets: [],
  features: { mermaid: false, popovers: false },
  ...overrides,
})

test("canonical IDs normalize DOI case, arXiv versions and library-scoped Zotero links", () => {
  assert.equal(normalizePaperRef("https://doi.org/10.1234/ABC"), "doi:10.1234/abc")
  assert.equal(normalizePaperRef("https://doi.org/10.48550/arXiv.2401.12345v2"), "arxiv:2401.12345")
  assert.equal(normalizePaperRef("https://arxiv.org/pdf/math/0609021v3.pdf"), "arxiv:math/0609021")
  assert.equal(
    normalizePaperRef("zotero://select/library/items/ABCD2345"),
    "zotero:personal:ABCD2345",
  )
  assert.equal(
    normalizePaperRef("https://www.zotero.org/users/123/items/ABCD2345"),
    "zotero:users:123:ABCD2345",
  )
  assert.equal(
    normalizePaperRef("zotero://select/groups/42/items/ABCD2345"),
    "zotero:groups:42:ABCD2345",
  )
  assert.equal(normalizePaperRef("javascript:alert(1)"), null)
  assert.deepEqual(
    extractPaperRefs('<a href="https://arxiv.org/abs/2401.12345v2">Paper</a> DOI:10.1234/ABC。'),
    ["arxiv:2401.12345", "doi:10.1234/abc"],
  )
})

test("Zotero and weekly identities merge without inferring read state; identical titles alone never merge", () => {
  const result = buildPaperLibrary(
    [zotero(), zotero({ id: "zotero:personal:ZZZZ2345", aliases: [], doi: null, arxiv: null })],
    reports,
  )
  assert.equal(result.length, 2)
  const merged = result.find((paper) => paper.reports.length)!
  assert.equal(merged.title, "Authoritative title")
  assert.equal(merged.authors[0], "A. Author")
  assert.equal(merged.readingStatus, null)
  assert.equal(merged.notes.length, 0)
  assert.equal(buildPaperLibrary([], reports)[0].readingStatus, null)
  assert.equal(
    buildPaperLibrary([zotero({ doi: "10.48550/arXiv.2401.12345", arxiv: null })], reports).length,
    1,
  )
})

test("links, optional frontmatter and explicit mappings associate only actual public artifacts", () => {
  const linked = publicPaperNote(
    note({ html: '<a href="zotero://select/library/items/ABCD2345">Zotero</a>' }),
  )
  const frontmatter = publicPaperNote(
    note({
      route: "/blog/math/second",
      sourcePath: "math/second.md",
      paperRefs: ["doi:10.1234/PAPER"],
    }),
  )
  const mapped = publicPaperNote(note({ route: "/chatter/third", sourcePath: "misc/third.md" }))
  const result = buildPaperLibrary([zotero()], reports, [linked, frontmatter, mapped], {
    "arxiv:2401.12345": ["misc/third.md", "math/private.md"],
  })[0]
  assert.equal(result.notes.length, 3)
  assert.equal(result.notes.find((entry) => entry.route === linked.route)?.html, linked.html)
  assert.equal(result.readingStatus, null)
  assert.ok(!result.notes.some((entry) => entry.sourcePath === "math/private.md"))
  assert.equal(buildPaperLibrary([zotero()], reports, [linked]).length, 1)
  assert.equal(
    buildPaperLibrary([zotero()], reports, [], { "doi:10.1234/paper": ["math/note.md"] })[0].notes
      .length,
    0,
  )
})

test("a Zotero web reference from another library cannot match the same item key", () => {
  const wrongLibrary = publicPaperNote(
    note({ html: '<a href="https://www.zotero.org/users/999/items/ABCD2345">Link</a>' }),
  )
  assert.equal(buildPaperLibrary([zotero()], [], [wrongLibrary])[0].notes.length, 0)
})

test("a late DOI/arXiv bridge merges report histories, classifications and read flags without mutating the source", () => {
  const first = zotero({
    id: "zotero:personal:AAAA2345",
    arxiv: null,
    collections: [{ id: "a", name: "A" }],
    readingStatus: "read",
  })
  const second = zotero({
    id: "zotero:personal:BBBB2345",
    doi: null,
    aliases: [],
    collections: [{ id: "b", name: "B" }],
  })
  const before = JSON.stringify([first, second])
  const result = buildPaperLibrary([first, second, zotero()], reports)
  assert.equal(result.length, 1)
  assert.equal(result[0].readingStatus, "read")
  assert.equal(result[0].collections.length, 2)
  assert.equal(result[0].reports.length, 1)
  assert.equal(JSON.stringify([first, second]), before)
})
