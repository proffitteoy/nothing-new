import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getImageEagerBudget } from "./image-loading"

describe("image eager budgets", () => {
  it("uses separate mobile and desktop anime budgets", () => {
    assert.equal(getImageEagerBudget("anime", { desktop: false }), 4)
    assert.equal(getImageEagerBudget("anime", { desktop: true }), 6)
  })

  it("reduces eager work on Save-Data and 2G connections", () => {
    assert.equal(getImageEagerBudget("anime", { desktop: true, saveData: true }), 2)
    assert.equal(getImageEagerBudget("anime", { desktop: false, effectiveType: "slow-2g" }), 2)
    assert.equal(getImageEagerBudget("chatter", { desktop: false, effectiveType: "2g" }), 1)
  })

  it("keeps chatter startup at the two-column mobile minimum", () => {
    assert.equal(getImageEagerBudget("chatter", { desktop: false }), 2)
    assert.equal(getImageEagerBudget("chatter", { desktop: true }), 2)
  })
})
