import assert from "node:assert"
import { describe, test } from "node:test"
import { groupAnimeByScore, sortAnimeByScore } from "./collection"

type Fixture = {
  id: number
  score?: number
}

describe("anime collection helpers", () => {
  test("sorts scores from high to low while preserving equal-score order", () => {
    const fixtures: Fixture[] = [
      { id: 1, score: 8 },
      { id: 2 },
      { id: 3, score: 10 },
      { id: 4, score: 8 },
    ]

    assert.deepStrictEqual(
      sortAnimeByScore(fixtures).map((anime) => anime.id),
      [3, 1, 4, 2],
    )
  })

  test("groups exact scores in descending order and puts unrated last", () => {
    const fixtures: Fixture[] = [
      { id: 1, score: 7 },
      { id: 2 },
      { id: 3, score: 10 },
      { id: 4, score: 7 },
    ]

    assert.deepStrictEqual(
      groupAnimeByScore(fixtures).map((group) => ({
        score: group.score,
        ids: group.items.map((anime) => anime.id),
      })),
      [
        { score: 10, ids: [3] },
        { score: 7, ids: [1, 4] },
        { score: null, ids: [2] },
      ],
    )
  })
})
