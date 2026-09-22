import assert from "node:assert/strict"
import { describe, it } from "node:test"
import sharp from "sharp"
import { resizeSourceRgb, ssim } from "./image-layering-codec.mjs"
import {
  decodeDctLayeredImage,
  decodeDctResidual,
  deserializeDctBlocks,
  encodeDctLayeredReferences,
  encodeDctResidual,
  forwardDct8,
  inverseDct8,
  serializeDctBlocks,
} from "./image-layering-dct.mjs"

function synthetic(width, height) {
  const data = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3
      data[offset] = (x * 17 + y * 5) % 256
      data[offset + 1] = (x * 7 + y * 19) % 256
      data[offset + 2] = (x * 23 + y * 3) % 256
    }
  }
  return { width, height, data }
}

describe("DCT residual codec", () => {
  it("round-trips constant and impulse blocks through the orthonormal DCT", () => {
    for (const block of [
      new Float64Array(64).fill(12.5),
      Float64Array.from({ length: 64 }, (_, index) => (index === 19 ? 255 : 0)),
    ]) {
      const restored = inverseDct8(forwardDct8(block))
      restored.forEach((value, index) => assert.ok(Math.abs(value - block[index]) < 1e-9))
    }
  })

  it("round-trips RLE/varint blocks and rejects trailing bytes", () => {
    const blocks = new Int32Array(128)
    blocks[0] = 11
    blocks[7] = -3
    blocks[64 + 63] = 9
    const serialized = serializeDctBlocks(blocks)
    assert.deepEqual(deserializeDctBlocks(serialized, 2), blocks)
    assert.throws(
      () => deserializeDctBlocks(Buffer.concat([serialized, Buffer.from([0])]), 2),
      /trailing bytes/,
    )
  })

  it("covers signed boundaries, truncated varints, invalid bands and overlong runs", () => {
    const blocks = new Int32Array(64)
    blocks[0] = 2147483647
    blocks[1] = -2147483648
    assert.deepEqual(deserializeDctBlocks(serializeDctBlocks(blocks), 1), blocks)
    assert.throws(() => deserializeDctBlocks(Buffer.from([1, 128]), 1), /truncated/)
    assert.throws(() => deserializeDctBlocks(Buffer.from([65, 2]), 1), /exceeds/)
    assert.throws(() => deserializeDctBlocks(Buffer.from([0]), 1, [9, 2]), /band range/)
  })

  it("reconstructs constant residuals and validates quantization and plane geometry", () => {
    const prediction = { width: 9, height: 11, data: Buffer.alloc(9 * 11 * 3, 100) }
    const target = { ...prediction, data: Buffer.alloc(prediction.data.length, 112) }
    for (const scale of [0.125, 0.5, 1, 2]) {
      const encoded = encodeDctResidual(prediction, target, scale)
      const restored = decodeDctResidual(prediction, encoded.compressed, encoded.descriptor)
      assert.deepEqual(restored.data, target.data)
      assert.deepEqual(encoded.reconstructed.data, restored.data)
    }
    for (const scale of [0, -1, NaN, Infinity, Number.MIN_VALUE]) {
      assert.throws(() => encodeDctResidual(prediction, target, scale), /scale|quantization/)
    }
    const encoded = encodeDctResidual(prediction, target, 1)
    const bad = structuredClone(encoded.descriptor)
    bad.planes[1].blockCount += 1
    assert.throws(() => decodeDctResidual(prediction, encoded.compressed, bad), /geometry/)
    assert.throws(() => decodeDctResidual(prediction, encoded.compressed.subarray(1), encoded.descriptor), /length/)
  })

  it("handles odd image dimensions, 4:2:0, padding, and independent decode", async () => {
    const source = synthetic(31, 43)
    const png = await sharp(source.data, {
      raw: { width: source.width, height: source.height, channels: 3 },
    })
      .png()
      .toBuffer()
    const references = [await resizeSourceRgb(png, 9), await resizeSourceRgb(png, 17), source]
    const encoded = await encodeDctLayeredReferences(references, {
      baseQuality: 65,
      quantizationScale: 0.25,
      sourceSha256: "fixture",
    })
    const decoded = await decodeDctLayeredImage(encoded)
    assert.equal(decoded.length, 3)
    decoded.forEach((level, index) => {
      assert.deepEqual(level.data, encoded.reconstructedLevels[index].data)
    })
    assert.ok(ssim(source, decoded.at(-1)) > 0.9)
    encoded.manifest.layers.forEach((layer) => {
      assert.equal(layer.planes.length, 3)
      assert.ok(layer.bandSplitBytes > 0)
    })
  })

  it("rejects a corrupt compressed layer", async () => {
    const source = synthetic(16, 24)
    const references = [
      { width: 8, height: 12, data: source.data.subarray(0, 8 * 12 * 3) },
      source,
    ]
    const encoded = await encodeDctLayeredReferences(references, {
      baseQuality: 65,
      quantizationScale: 1,
    })
    const corrupt = { ...encoded, layers: [Buffer.from(encoded.layers[0])] }
    corrupt.layers[0][0] ^= 0xff
    await assert.rejects(() => decodeDctLayeredImage(corrupt), /checksum mismatch/)
  })
})
