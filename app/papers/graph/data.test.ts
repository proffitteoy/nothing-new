import assert from "node:assert/strict"
import { test } from "node:test"
import type { LibraryPaper, ZoteroPaper } from "@/lib/paper-library"
import { buildPaperFolderData, folderDescendants } from "./data"
import { buildScene, defaultFilters, applyFilters } from "./scene"
import { computeMindmapLayout } from "./mindmap"

const collections: ZoteroPaper["collections"] = [
  { id: "a", name: "Root A", parentId: null },
  { id: "b", name: "Child", parentId: "a" },
  { id: "c", name: "Grandchild", parentId: "b" },
  { id: "d", name: "Root B", parentId: null },
]
function paper(id: string, memberships: string[]): LibraryPaper {
  return {
    id,
    aliases: [],
    title: id,
    authors: ["Author"],
    year: "2026",
    doi: null,
    arxiv: null,
    url: null,
    abstract: "",
    collections: collections.filter((collection) => memberships.includes(collection.id)),
    readingStatus: "read",
    updatedAt: "",
    refs: [],
    notes: [],
    reports: [],
  }
}

test("folder selection includes every descendant and counts each paper once across multiple memberships", () => {
  assert.deepEqual([...folderDescendants(collections, "a")], ["a", "b", "c"])
  const data = buildPaperFolderData([paper("one", ["b", "c"]), paper("two", ["d"])], collections)
  assert.equal(data.nodes.find((node) => node.id === "c:a")?.value, 1)
  assert.equal(data.nodes.find((node) => node.id === "c:b")?.value, 1)
  assert.equal(data.nodes.filter((node) => node.tier === "post").length, 2)
})

test("the graph keeps real nested folder and shared paper relationships without inventing paper-to-paper links", () => {
  const data = buildPaperFolderData([paper("shared", ["c", "d"])], collections)
  assert.ok(data.links.some((link) => link.source === "c:b" && link.target === "c:c"))
  assert.ok(data.links.some((link) => link.source === "c:c" && link.target === "p:shared"))
  assert.ok(data.links.some((link) => link.source === "c:d" && link.target === "p:shared"))
  assert.ok(data.links.every((link) => !link.source.startsWith("p:")))
  const scene = buildScene(data)
  assert.ok(scene.nodeMap.get("c:c")?.parents.has("c:b"))
  const filters = { ...defaultFilters(scene), minPosts: 0, showCooccurrence: true, query: "Author" }
  applyFilters(scene, filters)
  assert.equal(scene.nodeMap.get("p:shared")?.matched, true)
  assert.equal(
    scene.links.every((link) => link.visible),
    true,
  )
})

test("a dense folder keeps separate paper rows in the mindmap instead of squeezing them into the viewport", () => {
  const scene = buildScene(
    buildPaperFolderData(
      Array.from({ length: 80 }, (_, i) => paper(`paper-${i}`, ["c"])),
      collections,
    ),
  )
  scene.width = 800
  scene.height = 500
  const positions = computeMindmapLayout(scene)
  const rows = scene.byTier.post.map((node) => positions.get(node.data.id)!.y).sort((a, b) => a - b)
  assert.ok(rows.slice(1).every((y, index) => y - rows[index] >= 24))
})
