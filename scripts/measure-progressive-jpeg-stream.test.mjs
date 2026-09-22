import assert from "node:assert/strict"
import { describe, it } from "node:test"
import sharp from "sharp"
import { splitProgressiveJpegScans, summarizeTimeline } from "./measure-progressive-jpeg-stream.mjs"

describe("progressive JPEG stream measurement", () => {
  it("preserves every byte when splitting scans and rejects truncation and sequential JPEG", async () => {
    const data = Buffer.from(Array.from({ length: 64 * 64 * 3 }, (_, i) => i % 251))
    const image = () => sharp(data, { raw: { width: 64, height: 64, channels: 3 } })
    const jpeg = await image().jpeg({ quality: 40, progressive: true, mozjpeg: true }).toBuffer()
    const chunks = splitProgressiveJpegScans(jpeg)
    assert.ok(chunks.length > 1)
    assert.deepEqual(Buffer.concat(chunks), jpeg)
    assert.throws(() => splitProgressiveJpegScans(jpeg.subarray(0, -2)), /EOI/)
    const sequential = await image().jpeg({ progressive: false }).toBuffer()
    assert.throws(() => splitProgressiveJpegScans(sequential), /progressive/)
  })

  it("does not count blank frames as quality and integrates through load without using later frames", () => {
    const frames = [
      { timeMs: 0, ssim: 0.85, changed: false, pixelHash: "blank" },
      { timeMs: 100, ssim: 0.6, changed: true, pixelHash: "base" },
      { timeMs: 200, ssim: 0.82, changed: true, pixelHash: "mid" },
      { timeMs: 400, ssim: 0.92, changed: true, pixelHash: "final" },
    ]
    const result = summarizeTimeline(frames, 300)
    assert.equal(result.timeToRecognizableMs, 100)
    assert.equal(result.tq80Ms, 200)
    assert.equal(result.finalCompleteMs, 300)
    assert.equal(result.finalVisibleMs, 400)
    assert.equal(result.preLoadPaintStages, 2)
    assert.ok(Math.abs(result.qualityIntegral - 142 / 300) < 1e-9)
    assert.equal(summarizeTimeline(frames.slice(0, 2), 300).tq80Ms, null)
  })
})
