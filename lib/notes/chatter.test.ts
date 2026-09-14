import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildChatterItems } from "./chatter"
import type { NoteArtifact, NoteSection, NoteTreeNode } from "./types"

function note(route: string, section: NoteSection, modified?: string): NoteArtifact {
  return {
    version: 1,
    slug: route,
    simpleSlug: route,
    section,
    route,
    sourcePath: `${route}.md`,
    title: route.split("/").at(-1)!,
    description: "",
    dates: { modified },
    tags: [],
    toc: [],
    backlinks: [],
    links: [],
    html: "",
    text: "",
    assets: [],
    features: { mermaid: false, popovers: false },
  }
}

describe("chatter items", () => {
  it("mixes misc notes with non-math project folders by latest modification time", () => {
    const chatterNotes = [note("/chatter/随想", "chatter", "2026-02-01T00:00:00.000Z")]
    const blogNotes = [
      note("/blog/math/定理", "blog", "2026-05-01T00:00:00.000Z"),
      note("/blog/ai/项目/进展", "blog", "2026-04-01T00:00:00.000Z"),
      note("/blog/script/工具", "blog", "2026-01-01T00:00:00.000Z"),
    ]
    const tree: NoteTreeNode[] = [
      { name: "math", title: "math", path: "/blog/math", type: "folder", children: [] },
      { name: "script", title: "script", path: "/blog/script", type: "folder", children: [] },
      { name: "ai", title: "ai", path: "/blog/ai", type: "folder", children: [] },
    ]

    const items = buildChatterItems(chatterNotes, blogNotes, tree, "/default.jpg")

    assert.deepEqual(
      items.map((item) => [item.kind, item.route]),
      [
        ["folder", "/blog/ai"],
        ["note", "/chatter/随想"],
        ["folder", "/blog/script"],
      ],
    )
    assert.equal(
      items.some((item) => item.route === "/blog/math"),
      false,
    )
  })

  it("keeps chatter cover precedence unchanged", () => {
    const covered = note("/chatter/有封面", "chatter", "2026-01-01T00:00:00.000Z")
    covered.cover = "/cover.jpg"
    covered.assets = ["/body.png"]
    const assetOnly = note("/chatter/正文图", "chatter", "2026-01-01T00:00:00.000Z")
    assetOnly.assets = ["/body.png"]

    const items = buildChatterItems([covered, assetOnly], [], [], "/default.jpg")

    assert.equal(
      items.find((item) => item.route === covered.route && item.kind === "note")?.cover,
      "/cover.jpg",
    )
    assert.equal(
      items.find((item) => item.route === assetOnly.route && item.kind === "note")?.cover,
      "/body.png",
    )
  })
})
