import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { distributeCovers, findFirstImageReference, upsertCover } from "./assign-chatter-covers.mjs"

describe("杂谈封面分配", () => {
  it("按正文顺序识别第一张图片，并忽略 frontmatter 中的封面", () => {
    const content = [
      "---",
      'cover: "/old.png"',
      "---",
      "普通链接 ![[readme.md]]",
      "![[图片/第一张图.png|说明]]",
      "![第二张](./second.webp)",
    ].join("\n")

    const result = findFirstImageReference(content)
    assert.equal(result.kind, "wiki")
    assert.equal(result.target, "图片/第一张图.png")
  })

  it("一个循环内不重复，图片不足时避免循环交界连续重复", () => {
    const assigned = distributeCovers(7, ["a", "b", "c"], () => 0)

    assert.equal(new Set(assigned.slice(0, 3)).size, 3)
    assert.equal(new Set(assigned.slice(3, 6)).size, 3)
    for (let index = 1; index < assigned.length; index += 1) {
      assert.notEqual(assigned[index], assigned[index - 1])
    }
  })

  it("新增或替换 cover 时保留其余 frontmatter 和正文", () => {
    const withoutFrontmatter = "# 标题\n\n正文"
    assert.equal(
      upsertCover(withoutFrontmatter, "/chatter-covers/a.jpg"),
      '---\ncover: "/chatter-covers/a.jpg"\n---\n\n# 标题\n\n正文',
    )

    const withFrontmatter = "---\ntags:\n  - 随笔\nimage: old.png\n---\n\n正文"
    assert.equal(
      upsertCover(withFrontmatter, "../图片/正文.png"),
      '---\ncover: "../图片/正文.png"\ntags:\n  - 随笔\n---\n\n正文',
    )
  })
})
