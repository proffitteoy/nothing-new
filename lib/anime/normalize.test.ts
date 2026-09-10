import assert from "node:assert"
import { describe, test } from "node:test"
import { normalizeAnimeScore, normalizeBangumiCollection } from "./normalize"

describe("Bangumi normalization", () => {
  test("normalizes valid scores and drops zero", () => {
    assert.strictEqual(normalizeAnimeScore(10), 10)
    assert.strictEqual(normalizeAnimeScore(1), 1)
    assert.strictEqual(normalizeAnimeScore(0), undefined)
    assert.strictEqual(normalizeAnimeScore(11), undefined)
  })

  test("maps a collection to the internal anime schema", () => {
    assert.deepStrictEqual(
      normalizeBangumiCollection(
        {
          subject_id: 42,
          rate: 9,
          subject: {
            name: "Example",
            name_cn: "示例",
            date: "2026-01-01",
            images: { large: "https://lain.bgm.tv/pic/cover/example.jpg" },
            tags: [{ name: "动画" }],
          },
        },
        "watched",
      ),
      {
        id: 42,
        name: "Example",
        nameCn: "示例",
        score: 9,
        status: "watched",
        airDate: "2026-01-01",
        cover: "https://lain.bgm.tv/pic/cover/example.jpg",
        tags: ["动画"],
      },
    )
  })
})
