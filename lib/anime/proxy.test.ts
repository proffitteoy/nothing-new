import assert from "node:assert"
import { describe, test } from "node:test"
import { resolveBangumiProxyTarget } from "./proxy"

describe("Bangumi proxy whitelist", () => {
  test("allows subject lookups", () => {
    const target = resolveBangumiProxyTarget(["subjects", "42"], new URLSearchParams())
    assert.strictEqual(target?.path, "/subjects/42")
  })

  test("keeps only allowed collection query parameters", () => {
    const target = resolveBangumiProxyTarget(
      ["users", "tester", "collections"],
      new URLSearchParams("subject_type=2&type=3&limit=50&url=https://example.com"),
    )
    assert.strictEqual(
      target?.path,
      "/users/tester/collections?subject_type=2&type=3&limit=50",
    )
  })

  test("rejects arbitrary proxy paths", () => {
    assert.strictEqual(
      resolveBangumiProxyTarget(["proxy", "anything"], new URLSearchParams()),
      null,
    )
  })
})
