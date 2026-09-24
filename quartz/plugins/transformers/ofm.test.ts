import assert from "node:assert"
import { describe, test } from "node:test"
import { Element } from "hast"
import rehypeSlug from "rehype-slug"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { VFile } from "vfile"
import type { BuildCtx } from "../../util/ctx"
import type { FullSlug } from "../../util/path"
import { attachBlockReference } from "./blockReferences"
import { ObsidianFlavoredMarkdown } from "./ofm"

async function renderObsidianMarkdown(source: string) {
  const ctx = { allSlugs: [] } as unknown as BuildCtx
  const plugin = ObsidianFlavoredMarkdown()
  const file = new VFile({ value: source, data: { slug: "misc/test" as FullSlug } })
  return String(
    await unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(plugin.markdownPlugins!(ctx))
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(plugin.htmlPlugins!(ctx))
      .use(rehypeStringify)
      .process(file),
  )
}

describe("Obsidian reading line breaks", () => {
  test("renders soft newlines, but keeps blank lines as paragraph boundaries", async () => {
    const html = await renderObsidianMarkdown("第一行\n第二行\n\n新段落\n\n\n末段")
    assert.equal(html, "<p>第一行<br>\n第二行</p>\n<p>新段落</p>\n<p>末段</p>")
  })

  test("keeps explicit breaks and inline formatting without duplicate breaks", async () => {
    const html = await renderObsidianMarkdown("**粗体**\n*斜体*  \n尾行\\\n最后")
    assert.equal((html.match(/<br>/g) ?? []).length, 3)
    assert.match(html, /<strong>粗体<\/strong><br>/)
    assert.match(html, /<em>斜体<\/em><br>/)
  })

  test("retains callout titles and breaks within their body", async () => {
    const html = await renderObsidianMarkdown("> [!note] 标题\n> 第一行\n> 第二行")
    assert.match(html, /data-callout="note"/)
    assert.match(html, /callout-title-inner.*标题/)
    assert.match(html, /第一行<br>\n第二行/)
  })

  test("keeps list nesting, ordinary spaces, and non-breaking spaces", async () => {
    const html = await renderObsidianMarkdown("- 外层\n  续行\n  - 内层\n\nA  B&nbsp;C")
    assert.match(html, /<li>外层<br>\n续行\n<ul>/)
    assert.match(html, /<li>内层<\/li>/)
    assert.match(html, /A  B(?:&#xA0;|\u00a0)C/)
  })

  test("does not insert breaks into code, math, or raw HTML", async () => {
    const html = await renderObsidianMarkdown(
      "```text\n  a\n    b\n```\n\n`a  b`\n\n$$\na +\nb\n$$\n\n<div>raw\ntext</div>",
    )
    assert.doesNotMatch(html, /<br>/)
    assert.match(html, /<code class="language-text">  a\n    b\n<\/code>/)
    assert.match(html, /<code>a  b<\/code>/)
    assert.match(html, /a \+\nb/)
    assert.match(html, /<div>raw\ntext<\/div>/)
  })
})

describe("Obsidian block references", () => {
  test("preserves a heading slug while adding a block anchor", async () => {
    const heading: Element = {
      type: "element",
      tagName: "h3",
      properties: {},
      children: [{ type: "text", value: "1. 群上的第一同构定理" }],
    }
    const tree = { type: "root" as const, children: [heading] }

    attachBlockReference(heading, "14f179")
    await unified().use(rehypeSlug).run(tree)

    assert.strictEqual(heading.properties.id, "1-群上的第一同构定理")
    assert.deepStrictEqual(heading.children[0], {
      type: "element",
      tagName: "span",
      properties: {
        id: "14f179",
        ariaHidden: "true",
      },
      children: [],
    })
  })

  test("keeps block references on non-heading elements unchanged", () => {
    const paragraph: Element = {
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: "正文" }],
    }

    attachBlockReference(paragraph, "d22522")

    assert.strictEqual(paragraph.properties.id, "d22522")
    assert.strictEqual(paragraph.children.length, 1)
  })
})
