import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  decideAdaptiveImageConcurrency,
  getImageLabConcurrency,
  resolveImageLabConfig,
  sortImageLabQueue,
  summarizeImageLabMetrics,
} from "./image-loading-lab"

describe("image loading lab configuration", () => {
  it("ignores all experiment parameters unless the server gate is enabled", () => {
    assert.deepEqual(resolveImageLabConfig({ imagePolicy: "fixed-4", imageRun: "sample" }, false), {
      enabled: false,
      variant: "native",
    })
  })

  it("accepts known variants and safely normalizes run identifiers", () => {
    assert.deepEqual(
      resolveImageLabConfig({ imagePolicy: "adaptive", imageRun: "mobile run/01" }, true),
      { enabled: true, variant: "adaptive", runId: "mobile-run-01" },
    )
    assert.deepEqual(resolveImageLabConfig({ imagePolicy: "unknown" }, true), {
      enabled: true,
      variant: "native",
      runId: undefined,
    })
  })

  it("maps fixed variants without treating adaptive as a fixed limit", () => {
    assert.equal(getImageLabConcurrency("native"), Number.POSITIVE_INFINITY)
    assert.equal(getImageLabConcurrency("gate-unbounded"), Number.POSITIVE_INFINITY)
    assert.equal(getImageLabConcurrency("fixed-2"), 2)
    assert.equal(getImageLabConcurrency("fixed-12"), 12)
    assert.equal(getImageLabConcurrency("adaptive"), undefined)
  })
})

describe("image loading lab queue", () => {
  it("orders visible, immediate, and near work with stable FIFO ordering", () => {
    const sorted = sortImageLabQueue([
      { id: "near-1", priority: "near", sequence: 0 },
      { id: "visible-2", priority: "visible", sequence: 3 },
      { id: "immediate", priority: "immediate", sequence: 1 },
      { id: "visible-1", priority: "visible", sequence: 2 },
    ])
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["visible-1", "visible-2", "immediate", "near-1"],
    )
  })
})

describe("adaptive image loading decisions", () => {
  const baseSignals = {
    now: 5_000,
    lastAdjustedAt: 0,
    pendingCount: 4,
    activeCount: 4,
    saturatedForMs: 2_000,
    completedSinceAdjustment: 3,
    longTaskCount: 0,
    longFrameCount: 0,
    decodeBacklog: 0,
    decodeTailP75: 10,
  }

  it("decreases under pressure before considering available headroom", () => {
    assert.deepEqual(decideAdaptiveImageConcurrency(4, { ...baseSignals, longTaskCount: 1 }), {
      concurrency: 3,
      reason: "pressure",
    })
    assert.deepEqual(decideAdaptiveImageConcurrency(2, { ...baseSignals, decodeTailP75: 80 }), {
      concurrency: 2,
      reason: "pressure",
    })
  })

  it("increases only with a saturated queue and enough completed samples", () => {
    assert.deepEqual(decideAdaptiveImageConcurrency(4, baseSignals), {
      concurrency: 5,
      reason: "headroom",
    })
    assert.deepEqual(
      decideAdaptiveImageConcurrency(4, { ...baseSignals, completedSinceAdjustment: 2 }),
      { concurrency: 4, reason: "steady" },
    )
    assert.deepEqual(
      decideAdaptiveImageConcurrency(4, { ...baseSignals, saturatedForMs: 500 }),
      { concurrency: 4, reason: "steady" },
    )
  })

  it("honors cooldown and clamps concurrency bounds", () => {
    assert.deepEqual(
      decideAdaptiveImageConcurrency(12, {
        ...baseSignals,
        now: 1_000,
        lastAdjustedAt: 0,
      }),
      { concurrency: 10, reason: "cooldown" },
    )
  })
})

describe("image loading lab metric summaries", () => {
  it("aggregates completed resources while tolerating missing Resource Timing data", () => {
    assert.deepEqual(
      summarizeImageLabMetrics(
        [
          {
            visibleAt: 110,
            decodedAt: 180,
            resourceDuration: 40,
            transferSize: 1_000,
            decodeTail: 8,
          },
          { visibleAt: 120, decodedAt: 220, failed: true },
          { timedOut: true, resourceDuration: 80, transferSize: 2_000, decodeTail: 24 },
        ],
        100,
      ),
      {
        imageCount: 3,
        visibleCount: 2,
        visibleDecodedCount: 2,
        visibleCompletionMs: 120,
        requestCount: 2,
        transferSize: 3_000,
        resourceDurationP50: 40,
        resourceDurationP75: 80,
        decodeTailP75: 24,
        failedCount: 1,
        timedOutCount: 1,
      },
    )
  })
})
