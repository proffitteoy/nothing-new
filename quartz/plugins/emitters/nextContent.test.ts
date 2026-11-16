import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { Root } from "hast"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeKatex from "rehype-katex"

import nextConfig from "../../../next.config"
import {
  buildNextImageUrl,
  getLegacyBlogAliases,
  getDescriptionHtml,
  getNoteRoute,
  getNoteSection,
  getResponsiveImageAttributes,
  isOptimizableSiteImage,
  resolveNoteCover,
} from "./nextContent"

describe("Next content artifact routes", () => {
  it("maps ordinary notes to readable blog routes", () => {
    assert.equal(getNoteSection("math/Fubini-Tonelli定理"), "blog")
    assert.equal(getNoteRoute("math/Fubini-Tonelli定理"), "/blog/math/Fubini-Tonelli定理")
  })

  it("maps non-math project folders to chatter routes", () => {
    assert.equal(getNoteSection("数学建模/聚类"), "chatter")
    assert.equal(getNoteRoute("数学建模/聚类"), "/chatter/数学建模/聚类")
    assert.equal(getNoteRoute("ai/ManiMind/阶段一/总目标"), "/chatter/ai/ManiMind/阶段一/总目标")
  })

  it("removes the misc prefix from chatter routes", () => {
    assert.equal(getNoteSection("misc/随笔/九月"), "chatter")
    assert.equal(getNoteRoute("misc/随笔/九月"), "/chatter/随笔/九月")
    assert.equal(getNoteRoute("misc/index"), "/chatter")
  })

  it("keeps aliases in the target section when they have no misc prefix", () => {
    assert.equal(getNoteRoute("旧标题", "chatter"), "/chatter/旧标题")
    assert.equal(getNoteRoute("旧标题", "blog"), "/blog/旧标题")
  })

  it("keeps old blog links as aliases for moved project notes and folders", () => {
    assert.deepEqual(getLegacyBlogAliases("ai/ManiMind/阶段一/总目标"), [
      ["/blog/ai", "/chatter/ai"],
      ["/blog/ai/ManiMind", "/chatter/ai/ManiMind"],
      ["/blog/ai/ManiMind/阶段一", "/chatter/ai/ManiMind/阶段一"],
      ["/blog/ai/ManiMind/阶段一/总目标", "/chatter/ai/ManiMind/阶段一/总目标"],
    ])
    assert.deepEqual(getLegacyBlogAliases("misc/随笔/九月"), [])
  })

  it("keeps remote covers and rewrites note-local covers to public assets", () => {
    assert.equal(
      resolveNoteCover("misc/随笔/九月", "https://images.example/cover.webp"),
      "https://images.example/cover.webp",
    )
    assert.equal(
      resolveNoteCover("misc/随笔/九月", "./images/cover.webp"),
      "/quartz-assets/content/misc/随笔/images/cover.webp",
    )
  })

  it("encodes Chinese and spaces once in responsive image URLs", () => {
    assert.equal(
      buildNextImageUrl("/quartz-assets/content/图片/表 一.png", 640),
      "/_next/image?url=%2Fquartz-assets%2Fcontent%2F%E5%9B%BE%E7%89%87%2F%E8%A1%A8%20%E4%B8%80.png&w=640&q=75",
    )
  })

  it("keeps external, animated, and dimensionless images on their original URL", () => {
    assert.equal(isOptimizableSiteImage("https://images.example/cover.jpg"), false)
    assert.equal(isOptimizableSiteImage("/quartz-assets/content/demo.gif"), false)
    assert.deepEqual(getResponsiveImageAttributes("/quartz-assets/content/demo.png"), {
      src: "/quartz-assets/content/demo.png",
    })
  })

  it("builds a bounded same-origin srcset when dimensions are known", () => {
    const attributes = getResponsiveImageAttributes("/chatter-covers/large image.jpg", {
      width: 1000,
      height: 600,
    })
    assert.match(attributes.src, /w=1200&q=75$/)
    assert.match(attributes.srcSet ?? "", /w=640&q=75 640w/)
    assert.ok(attributes.sizes)
  })

  it("only generates Next-allowed src and srcset candidates across image size boundaries", () => {
    const allowedWidths = new Set([
      ...nextConfig.images!.deviceSizes!,
      ...nextConfig.images!.imageSizes!,
    ])
    const src = "/quartz-assets/content/图片/表 一.png"

    for (const width of [
      128, 384, 385, 640, 641, 750, 828, 829, 1000, 1080, 1200, 1440, 1920, 2400,
    ]) {
      const attributes = getResponsiveImageAttributes(src, { width, height: 600 })
      const candidates = (attributes.srcSet ?? "").split(", ").map((candidate) => {
        const [url, descriptor] = candidate.split(" ")
        const params = new URL(url, "https://notes.invalid").searchParams
        assert.equal(descriptor, `${params.get("w")}w`)
        return url
      })
      assert.ok(candidates.length > 0)
      assert.equal(new Set(candidates).size, candidates.length)
      assert.equal(attributes.src, candidates.at(-1))

      for (const candidate of [attributes.src, ...candidates]) {
        const params = new URL(candidate, "https://notes.invalid").searchParams
        assert.ok(allowedWidths.has(Number(params.get("w"))), `${width}px image: ${candidate}`)
        assert.ok(nextConfig.images!.qualities!.includes(Number(params.get("q"))))
        assert.equal(params.get("url"), src, "Chinese and spaces must survive URL encoding")
      }
    }
  })
})

describe("Rendered collection excerpts", () => {
  async function rendered(markdown: string) {
    const processor = unified().use(remarkParse).use(remarkMath).use(remarkRehype).use(rehypeKatex)
    return (await processor.run(processor.parse(markdown))) as Root
  }

  it("keeps the first paragraph's original words and formatting", async () => {
    const tree = await rendered("# 标题\n\n第一段 **原文**。\n\n第二段不作为摘要。")
    assert.equal(getDescriptionHtml(tree), "<p>第一段 <strong>原文</strong>。</p>")
  })

  it("keeps an adjacent display formula complete without mutating article HTML", async () => {
    const tree = await rendered(
      "定义为\n\n$$\n\\Lambda(\\theta)=-\\int_0^\\theta\\log|2\\sin t|\\,dt\n$$\n\n后续正文。",
    )
    const original = structuredClone(tree)
    const html = getDescriptionHtml(tree)!
    assert.match(html, /定义为/)
    assert.match(html, /katex-display/)
    assert.match(html, /\\Lambda\(\\theta\)=-\\int_0\^\\theta/)
    assert.ok(!html.includes("后续正文"))
    assert.deepEqual(tree, original)
  })

  it("preserves inline math and link text without nesting links inside cards", async () => {
    const html = getDescriptionHtml(
      await rendered("令 $x^2$ 为 [原文链接](https://example.com)。"),
    )!
    assert.match(html, /class="katex"/)
    assert.match(html, /原文链接/)
    assert.doesNotMatch(html, /<a[ >]/)
  })

  it("leaves an explicit author's description to the existing plain-text path", async () => {
    const tree = await rendered("正文不取代作者摘要。")
    assert.equal(getDescriptionHtml(tree, "作者自己的摘要 $x^2$"), undefined)
  })

  it("skips callout titles and removes duplicate IDs and interactive controls", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "blockquote",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["callout-title"] },
              children: [
                {
                  type: "element",
                  tagName: "p",
                  properties: {},
                  children: [{ type: "text", value: "提示标题" }],
                },
              ],
            },
            {
              type: "element",
              tagName: "p",
              properties: { id: "original", onClick: "alert(1)" },
              children: [
                { type: "text", value: "实际正文。" },
                {
                  type: "element",
                  tagName: "button",
                  properties: {},
                  children: [{ type: "text", value: "操作" }],
                },
              ],
            },
          ],
        },
      ],
    }
    assert.equal(getDescriptionHtml(tree), "<p>实际正文。</p>")
  })

  it("omits HTML for heading-only notes so legacy text remains the fallback", async () => {
    assert.equal(getDescriptionHtml(await rendered("# 只有标题")), undefined)
  })
})
