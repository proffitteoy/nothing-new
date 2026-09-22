import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  evaluateDctGate,
  selectCalibratedCandidates,
  summarizeDctCandidate,
} from "./analyze-image-representation-recovery.mjs"

const candidate = {
  key: "dct-fixture",
  ladder: { id: "layered-4-mobile", widths: [48, 96, 192, 384] },
  quantizationScale: 1,
}

function passingResult(id) {
  return {
    sampleId: id,
    reconstructionMatches: true,
    finalSsim: 0.97,
    matchedNativeRatio: 1.05,
    totalBytes: 50_000,
    baseShare: 0.1,
    baseAndFirstShare: 0.4,
    monotonic: true,
    hasIntermediateParetoPoint: true,
    bandSplitOverhead: 0.03,
    decodeMs: 5,
  }
}

describe("representation recovery analysis", () => {
  it("classifies pass, bounded optimization, and stop branches", () => {
    const results = Array.from({ length: 10 }, (_, index) => passingResult(index))
    const passing = summarizeDctCandidate(candidate, results, 10)
    assert.equal(evaluateDctGate(passing).branch, "browser-reconstruction")

    const bounded = summarizeDctCandidate(
      candidate,
      results.map((result) => ({ ...result, matchedNativeRatio: 1.3 })),
      10,
    )
    assert.equal(evaluateDctGate(bounded).branch, "one-bounded-optimization")

    const stopped = summarizeDctCandidate(
      candidate,
      results.map((result) => ({ ...result, matchedNativeRatio: 1.8 })),
      10,
    )
    assert.equal(evaluateDctGate(stopped).branch, "stop")
  })

  it("selects the smallest calibrated candidate meeting each quality target", () => {
    const candidates = [
      { ...candidate, key: "q-low", quantizationScale: 2 },
      { ...candidate, key: "q-high", quantizationScale: 1 },
    ]
    const screening = [
      {
        candidate: "q-low",
        ladderId: "layered-4-mobile",
        finalSsimMedian: 0.971,
        finalSsimP10: 0.95,
        totalBytesMedian: 40_000,
      },
      {
        candidate: "q-high",
        ladderId: "layered-4-mobile",
        finalSsimMedian: 0.995,
        finalSsimP10: 0.98,
        totalBytesMedian: 70_000,
      },
    ]
    const selected = selectCalibratedCandidates(screening, candidates)
    assert.deepEqual(
      selected.map((entry) => entry.key),
      ["q-low", "q-high"],
    )
  })
})
