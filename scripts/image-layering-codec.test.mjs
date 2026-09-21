import assert from "node:assert/strict"
import { describe, it } from "node:test"
import sharp from "sharp"
import {
  decodeLayeredImage,
  encodeLayeredImage,
  psnr,
  resizeRgbFixed,
  serializeManifest,
  ssim,
  validateLayeredManifest,
  zigZagDecode,
  zigZagEncode,
} from "./image-layering-codec.mjs"

function gradient(width, height) {
  const data = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3
      data[offset] = (x * 29 + y * 7) % 256
      data[offset + 1] = (x * 11 + y * 31) % 256
      data[offset + 2] = (x * 17 + y * 13) % 256
    }
  }
  return { width, height, data }
}

async function pngFixture() {
  const image = gradient(24, 32)
  return sharp(image.data, { raw: { width: image.width, height: image.height, channels: 3 } })
    .png()
    .toBuffer()
}

describe("layered image codec", () => {
  it("round-trips every signed residual coefficient through ZigZag", () => {
    for (let value = -255; value <= 255; value += 1) {
      assert.equal(zigZagDecode(zigZagEncode(value)), value)
    }
  })

  it("uses deterministic centre-aligned interpolation", () => {
    const source = {
      width: 2,
      height: 2,
      data: Buffer.from([0, 0, 0, 100, 100, 100, 200, 200, 200, 255, 255, 255]),
    }
    const first = resizeRgbFixed(source, 3, 3)
    const second = resizeRgbFixed(source, 3, 3)
    assert.deepEqual(first.data, second.data)
    assert.deepEqual([...first.data.subarray(12, 15)], [139, 139, 139])
  })

  it("serializes and independently reconstructs a quantization-1 pyramid", async () => {
    const encoded = await encodeLayeredImage(await pngFixture(), {
      widths: [6, 12, 24],
      baseQuality: 65,
      quantization: 1,
    })
    assert.doesNotThrow(() => JSON.parse(serializeManifest(encoded.manifest)))
    const decoded = await decodeLayeredImage(encoded)
    assert.equal(decoded.length, 3)
    assert.deepEqual(decoded.at(-1).data, encoded.references.at(-1).data)
    assert.equal(psnr(encoded.references.at(-1), decoded.at(-1)), Number.POSITIVE_INFINITY)
    assert.equal(ssim(encoded.references.at(-1), decoded.at(-1)), 1)
  })

  it("matches the encoder reconstruction for perceptual quantization", async () => {
    const encoded = await encodeLayeredImage(await pngFixture(), {
      widths: [6, 12, 24],
      baseQuality: 65,
      quantization: 8,
    })
    const decoded = await decodeLayeredImage(encoded)
    decoded.forEach((level, index) => {
      assert.deepEqual(level.data, encoded.reconstructedLevels[index].data)
    })
    assert.ok(ssim(encoded.references.at(-1), decoded.at(-1)) > 0.9)
  })

  it("rejects corrupt and structurally invalid layers", async () => {
    const encoded = await encodeLayeredImage(await pngFixture(), {
      widths: [6, 12],
      baseQuality: 65,
      quantization: 4,
    })
    const corrupt = {
      ...encoded,
      layers: [Buffer.from(encoded.layers[0])],
    }
    corrupt.layers[0][0] ^= 0xff
    await assert.rejects(() => decodeLayeredImage(corrupt), /checksum mismatch/)
    assert.throws(
      () => validateLayeredManifest({ ...encoded.manifest, width: 13 }),
      /final refinement dimensions/,
    )
  })
})
