import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildNextImageUrl,
  getLegacyBlogAliases,
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
    assert.match(attributes.src, /w=1080&q=75$/)
    assert.match(attributes.srcSet ?? "", /w=640&q=75 640w/)
    assert.ok(attributes.sizes)
  })
})
