import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  evaluateRepresentationGate,
  percentile,
  selectAnimeSamples,
  summarizeCandidate,
} from "./analyze-layered-images.mjs"

const candidate = {
  key: "candidate",
  ladder: { widths: [48, 96, 192, 384] },
  baseQuality: 65,
  quantization: 4,
}

function passingResult(id) {
  return {
    sampleId: id,
    reconstructionMatches: true,
    finalSsim: 0.97,
    matchedNativeRatio: 1.05,
    baseShare: 0.2,
    baseAndFirstShare: 0.5,
    totalBytes: 50_000,
    decodeMs: 3,
    monotonic: true,
    hasIntermediateParetoPoint: true,
  }
}

describe("layered image analysis", () => {
  it("selects every watching item before deterministically ranked watched items", () => {
    const items = [
      { id: 9, status: "watched", cover: "/9.jpg" },
      { id: 3, status: "watching", cover: "/3.jpg" },
      { id: 2, status: "watching", cover: "/2.jpg" },
      { id: 1, status: "watched", cover: null },
      { id: 8, status: "watched", cover: "/8.jpg" },
    ]
    const selected = selectAnimeSamples(items, 3)
    assert.deepEqual(
      selected.slice(0, 2).map((item) => item.id),
      [2, 3],
    )
    assert.equal(selected[2].status, "watched")
    assert.deepEqual(selectAnimeSamples(items, 3), selected)
  })

  it("uses nearest-rank percentiles", () => {
    assert.equal(percentile([4, 1, 3, 2], 0.5), 2)
    assert.equal(percentile([4, 1, 3, 2], 0.75), 3)
    assert.equal(percentile([], 0.5), undefined)
  })

  it("passes only when every representation gate check passes", () => {
    const results = Array.from({ length: 10 }, (_, index) => passingResult(index))
    const summary = summarizeCandidate(candidate, results, 10)
    assert.equal(evaluateRepresentationGate(summary).pass, true)

    const failedSummary = summarizeCandidate(
      candidate,
      results.map((result) => ({ ...result, matchedNativeRatio: 1.4 })),
      10,
    )
    const failed = evaluateRepresentationGate(failedSummary)
    assert.equal(failed.pass, false)
    assert.equal(failed.checks.byteOverhead, false)
  })

  it("fails sample coverage when downloads or measurements are missing", () => {
    const summary = summarizeCandidate(candidate, [passingResult(1)], 2)
    assert.equal(evaluateRepresentationGate(summary).checks.sampleCoverage, false)
  })
})
