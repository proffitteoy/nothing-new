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
    const chatterNotes = [
      note("/chatter/随想", "chatter", "2026-02-01T00:00:00.000Z"),
      note("/chatter/ai/项目/进展", "chatter", "2026-04-01T00:00:00.000Z"),
      note("/chatter/script/工具", "chatter", "2026-01-01T00:00:00.000Z"),
    ]
    chatterNotes[0].sourcePath = "misc/随想.md"
    chatterNotes[1].sourcePath = "ai/项目/进展.md"
    chatterNotes[1].assets = ["/ai-cover.png"]
    chatterNotes[2].sourcePath = "script/工具.md"
    const tree: NoteTreeNode[] = [
      { name: "reverse", title: "reverse", path: "/chatter/reverse", type: "folder", children: [] },
      {
        name: "script",
        title: "script",
        path: "/chatter/script",
        type: "folder",
        children: [],
      },
      { name: "ai", title: "ai", path: "/chatter/ai", type: "folder", children: [] },
    ]

    const items = buildChatterItems(chatterNotes, tree, "/default.jpg")

    assert.deepEqual(
      items.map((item) => [item.kind, item.route]),
      [
        ["folder", "/chatter/ai"],
        ["note", "/chatter/随想"],
        ["folder", "/chatter/script"],
      ],
    )
    assert.equal(
      items.find((item) => item.route === "/chatter/ai" && item.kind === "folder")?.cover,
      "/ai-cover.png",
    )
    assert.equal(
      items.find((item) => item.route === "/chatter/script" && item.kind === "folder")?.cover,
      "/default.jpg",
    )
    assert.equal(
      items.some((item) => item.route === "/chatter/reverse"),
      false,
    )
  })

  it("keeps chatter cover precedence unchanged", () => {
    const covered = note("/chatter/有封面", "chatter", "2026-01-01T00:00:00.000Z")
    covered.cover = "/cover.jpg"
    covered.assets = ["/body.png"]
    covered.sourcePath = "misc/有封面.md"
    const assetOnly = note("/chatter/正文图", "chatter", "2026-01-01T00:00:00.000Z")
    assetOnly.assets = ["/body.png"]
    assetOnly.sourcePath = "misc/正文图.md"

    const items = buildChatterItems([covered, assetOnly], [], "/default.jpg")

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
