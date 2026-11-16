import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import type { NoteArtifact } from "../../lib/notes/types"
import NoteCollectionPage from "./NoteCollectionPage"

const note: NoteArtifact = {
  version: 1,
  slug: "math/example",
  simpleSlug: "math/example",
  section: "blog",
  route: "/blog/math/example",
  sourcePath: "math/example.md",
  title: "原始标题",
  description: "作者摘要 <em>原文</em> $x^2$",
  dates: {},
  tags: [],
  toc: [],
  backlinks: [],
  links: [],
  html: "",
  text: "",
  assets: [],
  features: { mermaid: false, popovers: false },
}

test("legacy artifacts keep their original plain-text summary and link", () => {
  const html = renderToStaticMarkup(
    createElement(NoteCollectionPage, {
      section: "blog",
      title: "目录",
      notes: [note],
    }),
  )
  assert.ok(html.includes('href="/blog/math/example"'))
  assert.ok(html.includes("作者摘要 &lt;em&gt;原文&lt;/em&gt; $x^2$"))
  assert.ok(!html.includes('class="note-card-excerpt'))
})

test("generated excerpts render their math markup without replacing source descriptions", () => {
  const html = renderToStaticMarkup(
    createElement(NoteCollectionPage, {
      section: "blog",
      title: "目录",
      notes: [{ ...note, descriptionHtml: '<p>定义为 <span class="katex">完整公式</span></p>' }],
    }),
  )
  assert.ok(html.includes('<span class="katex">完整公式</span>'))
  assert.ok(html.includes("原始标题"))
  assert.equal(note.description, "作者摘要 <em>原文</em> $x^2$")
})
