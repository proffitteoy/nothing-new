import { deflateSync, inflateSync } from "node:zlib"
import {
  decodeRgb,
  encodeNative,
  resizeRgbFixed,
  sha256,
} from "./image-layering-codec.mjs"

export const DCT_LAYERED_IMAGE_VERSION = 2
export const DCT_LAYER_ENCODING = "ycbcr420-dct8-rle-varint-deflate"
export const DCT_PREDICTOR = "bilinear-fixed-v1"

const BLOCK_SIZE = 8
const LUMA_QUANTIZATION = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69,
  56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55,
  64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112,
  100, 103, 99,
]
const CHROMA_QUANTIZATION = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99,
  99, 99, 47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
]
const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48,
  41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15,
  23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62,
  63,
]
const BAND_RANGES = [
  [0, 6],
  [6, 21],
  [21, 64],
]
const DCT_MATRIX = Array.from({ length: BLOCK_SIZE }, (_, frequency) =>
  Array.from(
    { length: BLOCK_SIZE },
    (_, position) =>
      0.5 *
      (frequency === 0 ? 1 / Math.sqrt(2) : 1) *
      Math.cos(((2 * position + 1) * frequency * Math.PI) / 16),
  ),
)

function assertRawImage(image, name = "image") {
  if (!image || !(image.data instanceof Uint8Array)) throw new Error(`${name} has no pixel data`)
  if (!Number.isInteger(image.width) || image.width < 1) throw new Error(`${name}.width is invalid`)
  if (!Number.isInteger(image.height) || image.height < 1)
    throw new Error(`${name}.height is invalid`)
  if (image.data.length !== image.width * image.height * 3) {
    throw new Error(`${name} must contain interleaved RGB pixels`)
  }
}

function assertComparable(prediction, target) {
  assertRawImage(prediction, "prediction")
  assertRawImage(target, "target")
  if (prediction.width !== target.width || prediction.height !== target.height) {
    throw new Error("prediction and target dimensions must match")
  }
}

export function forwardDct8(block) {
  if (block.length !== 64) throw new Error("DCT block must contain 64 values")
  const temporary = new Float64Array(64)
  const output = new Float64Array(64)
  for (let y = 0; y < 8; y += 1) {
    for (let u = 0; u < 8; u += 1) {
      let value = 0
      for (let x = 0; x < 8; x += 1) value += block[y * 8 + x] * DCT_MATRIX[u][x]
      temporary[y * 8 + u] = value
    }
  }
  for (let v = 0; v < 8; v += 1) {
    for (let u = 0; u < 8; u += 1) {
      let value = 0
      for (let y = 0; y < 8; y += 1) value += DCT_MATRIX[v][y] * temporary[y * 8 + u]
      output[v * 8 + u] = value
    }
  }
  return output
}

export function inverseDct8(coefficients) {
  if (coefficients.length !== 64) throw new Error("IDCT block must contain 64 values")
  const temporary = new Float64Array(64)
  const output = new Float64Array(64)
  for (let y = 0; y < 8; y += 1) {
    for (let u = 0; u < 8; u += 1) {
      let value = 0
      for (let v = 0; v < 8; v += 1) value += DCT_MATRIX[v][y] * coefficients[v * 8 + u]
      temporary[y * 8 + u] = value
    }
  }
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      let value = 0
      for (let u = 0; u < 8; u += 1) value += temporary[y * 8 + u] * DCT_MATRIX[u][x]
      output[y * 8 + x] = value
    }
  }
  return output
}

function encodeUnsignedVarint(value, output) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("varint value is invalid")
  let remaining = value
  while (remaining >= 0x80) {
    output.push((remaining % 0x80) | 0x80)
    remaining = Math.floor(remaining / 0x80)
  }
  output.push(remaining)
}

function decodeUnsignedVarint(bytes, state) {
  let value = 0
  let multiplier = 1
  for (let count = 0; count < 6; count += 1) {
    if (state.offset >= bytes.length) throw new Error("truncated varint")
    const byte = bytes[state.offset]
    state.offset += 1
    value += (byte & 0x7f) * multiplier
    if ((byte & 0x80) === 0) return value
    multiplier *= 0x80
  }
  throw new Error("varint is too long")
}

function signedToUnsigned(value) {
  if (!Number.isSafeInteger(value)) throw new Error("coefficient is not an integer")
  return value >= 0 ? value * 2 : -value * 2 - 1
}

function unsignedToSigned(value) {
  return value % 2 === 0 ? value / 2 : -(value + 1) / 2
}

export function serializeDctBlocks(blocks, bandRange = [0, 64]) {
  if (blocks.length % 64 !== 0) throw new Error("coefficient buffer is not block aligned")
  const [start, end] = bandRange
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 64 || start >= end) {
    throw new Error("invalid DCT band range")
  }
  const output = []
  for (let blockOffset = 0; blockOffset < blocks.length; blockOffset += 64) {
    let position = start
    while (position < end) {
      let zeroRun = 0
      while (position + zeroRun < end && blocks[blockOffset + ZIGZAG[position + zeroRun]] === 0) {
        zeroRun += 1
      }
      if (position + zeroRun === end) {
        encodeUnsignedVarint(0, output)
        break
      }
      encodeUnsignedVarint(zeroRun + 1, output)
      const coefficient = blocks[blockOffset + ZIGZAG[position + zeroRun]]
      encodeUnsignedVarint(signedToUnsigned(coefficient), output)
      position += zeroRun + 1
    }
  }
  return Buffer.from(output)
}

export function deserializeDctBlocks(bytes, blockCount, bandRange = [0, 64]) {
  if (!Number.isInteger(blockCount) || blockCount < 0) throw new Error("block count is invalid")
  const [start, end] = bandRange
  const state = { offset: 0 }
  const blocks = new Int32Array(blockCount * 64)
  for (let block = 0; block < blockCount; block += 1) {
    let position = start
    while (position < end) {
      const runToken = decodeUnsignedVarint(bytes, state)
      if (runToken === 0) break
      const zeroRun = runToken - 1
      position += zeroRun
      if (position >= end) throw new Error("DCT zero run exceeds its band")
      const coefficient = unsignedToSigned(decodeUnsignedVarint(bytes, state))
      if (coefficient === 0) throw new Error("DCT stream contains an explicit zero")
      blocks[block * 64 + ZIGZAG[position]] = coefficient
      position += 1
    }
  }
  if (state.offset !== bytes.length) throw new Error("DCT stream has trailing bytes")
  return blocks
}

function residualPlanes(prediction, target) {
  assertComparable(prediction, target)
  const width = target.width
  const height = target.height
  const y = new Float64Array(width * height)
  const chromaWidth = Math.ceil(width / 2)
  const chromaHeight = Math.ceil(height / 2)
  const cbSums = new Float64Array(chromaWidth * chromaHeight)
  const crSums = new Float64Array(chromaWidth * chromaHeight)
  const chromaCounts = new Uint8Array(chromaWidth * chromaHeight)

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const offset = (row * width + column) * 3
      const red = target.data[offset] - prediction.data[offset]
      const green = target.data[offset + 1] - prediction.data[offset + 1]
      const blue = target.data[offset + 2] - prediction.data[offset + 2]
      y[row * width + column] = red * 0.299 + green * 0.587 + blue * 0.114
      const chromaOffset = Math.floor(row / 2) * chromaWidth + Math.floor(column / 2)
      cbSums[chromaOffset] += red * -0.168736 + green * -0.331264 + blue * 0.5
      crSums[chromaOffset] += red * 0.5 + green * -0.418688 + blue * -0.081312
      chromaCounts[chromaOffset] += 1
    }
  }

  const cb = new Float64Array(chromaWidth * chromaHeight)
  const cr = new Float64Array(chromaWidth * chromaHeight)
  for (let index = 0; index < cb.length; index += 1) {
    cb[index] = cbSums[index] / chromaCounts[index]
    cr[index] = crSums[index] / chromaCounts[index]
  }
  return [
    { name: "y", width, height, data: y, quantization: LUMA_QUANTIZATION },
    { name: "cb", width: chromaWidth, height: chromaHeight, data: cb, quantization: CHROMA_QUANTIZATION },
    { name: "cr", width: chromaWidth, height: chromaHeight, data: cr, quantization: CHROMA_QUANTIZATION },
  ]
}

function encodePlane(plane, quantizationScale) {
  const paddedWidth = Math.ceil(plane.width / 8) * 8
  const paddedHeight = Math.ceil(plane.height / 8) * 8
  const blockColumns = paddedWidth / 8
  const blockRows = paddedHeight / 8
  const blocks = new Int32Array(blockColumns * blockRows * 64)
  const block = new Float64Array(64)
  let blockIndex = 0
  for (let blockRow = 0; blockRow < blockRows; blockRow += 1) {
    for (let blockColumn = 0; blockColumn < blockColumns; blockColumn += 1) {
      for (let y = 0; y < 8; y += 1) {
        const sourceY = Math.min(plane.height - 1, blockRow * 8 + y)
        for (let x = 0; x < 8; x += 1) {
          const sourceX = Math.min(plane.width - 1, blockColumn * 8 + x)
          block[y * 8 + x] = plane.data[sourceY * plane.width + sourceX]
        }
      }
      const coefficients = forwardDct8(block)
      for (let index = 0; index < 64; index += 1) {
        blocks[blockIndex * 64 + index] = Math.round(
          coefficients[index] / (plane.quantization[index] * quantizationScale),
        )
      }
      blockIndex += 1
    }
  }
  return {
    blocks,
    descriptor: {
      name: plane.name,
      width: plane.width,
      height: plane.height,
      paddedWidth,
      paddedHeight,
      blockCount: blockColumns * blockRows,
    },
  }
}

function reconstructPlane(blocks, descriptor, quantization, quantizationScale) {
  const blockColumns = descriptor.paddedWidth / 8
  const blockRows = descriptor.paddedHeight / 8
  if (blocks.length !== descriptor.blockCount * 64) throw new Error("DCT block count mismatch")
  const output = new Float64Array(descriptor.width * descriptor.height)
  const coefficients = new Float64Array(64)
  for (let blockRow = 0; blockRow < blockRows; blockRow += 1) {
    for (let blockColumn = 0; blockColumn < blockColumns; blockColumn += 1) {
      const blockIndex = blockRow * blockColumns + blockColumn
      for (let index = 0; index < 64; index += 1) {
        coefficients[index] =
          blocks[blockIndex * 64 + index] * quantization[index] * quantizationScale
      }
      const block = inverseDct8(coefficients)
      for (let y = 0; y < 8; y += 1) {
        const targetY = blockRow * 8 + y
        if (targetY >= descriptor.height) continue
        for (let x = 0; x < 8; x += 1) {
          const targetX = blockColumn * 8 + x
          if (targetX >= descriptor.width) continue
          output[targetY * descriptor.width + targetX] = block[y * 8 + x]
        }
      }
    }
  }
  return output
}

function combinePlanes(prediction, planes) {
  const [y, cb, cr] = planes
  const data = Buffer.allocUnsafe(prediction.data.length)
  for (let row = 0; row < prediction.height; row += 1) {
    for (let column = 0; column < prediction.width; column += 1) {
      const pixel = row * prediction.width + column
      const chroma = Math.floor(row / 2) * Math.ceil(prediction.width / 2) + Math.floor(column / 2)
      const luminance = y[pixel]
      const blueDifference = cb[chroma]
      const redDifference = cr[chroma]
      const residualRed = luminance + 1.402 * redDifference
      const residualGreen = luminance - 0.344136 * blueDifference - 0.714136 * redDifference
      const residualBlue = luminance + 1.772 * blueDifference
      const offset = pixel * 3
      data[offset] = Math.max(0, Math.min(255, Math.round(prediction.data[offset] + residualRed)))
      data[offset + 1] = Math.max(
        0,
        Math.min(255, Math.round(prediction.data[offset + 1] + residualGreen)),
      )
      data[offset + 2] = Math.max(
        0,
        Math.min(255, Math.round(prediction.data[offset + 2] + residualBlue)),
      )
    }
  }
  return { width: prediction.width, height: prediction.height, data }
}

function serializePlanes(encodedPlanes, bandRange = [0, 64]) {
  return Buffer.concat(encodedPlanes.map((plane) => serializeDctBlocks(plane.blocks, bandRange)))
}

function deserializePlanes(bytes, descriptors, bandRange = [0, 64]) {
  const state = { offset: 0 }
  const planes = []
  for (const descriptor of descriptors) {
    const blocks = new Int32Array(descriptor.blockCount * 64)
    const [start, end] = bandRange
    for (let block = 0; block < descriptor.blockCount; block += 1) {
      let position = start
      while (position < end) {
        const runToken = decodeUnsignedVarint(bytes, state)
        if (runToken === 0) break
        position += runToken - 1
        if (position >= end) throw new Error("DCT zero run exceeds its band")
        const coefficient = unsignedToSigned(decodeUnsignedVarint(bytes, state))
        if (coefficient === 0) throw new Error("DCT stream contains an explicit zero")
        blocks[block * 64 + ZIGZAG[position]] = coefficient
        position += 1
      }
    }
    planes.push(blocks)
  }
  if (state.offset !== bytes.length) throw new Error("DCT stream has trailing bytes")
  return planes
}

export function encodeDctResidual(prediction, target, quantizationScale) {
  assertComparable(prediction, target)
  if (!Number.isFinite(quantizationScale) || quantizationScale <= 0) {
    throw new Error("quantization scale must be positive")
  }
  const encodedPlanes = residualPlanes(prediction, target).map((plane) =>
    encodePlane(plane, quantizationScale),
  )
  const serialized = serializePlanes(encodedPlanes)
  const compressed = deflateSync(serialized, { level: 6 })
  const bandBytes = BAND_RANGES.map((range) =>
    deflateSync(serializePlanes(encodedPlanes, range), { level: 6 }).length,
  )
  const descriptor = {
    width: target.width,
    height: target.height,
    quantizationScale,
    encoding: DCT_LAYER_ENCODING,
    rawBytes: serialized.length,
    bytes: compressed.length,
    sha256: sha256(compressed),
    planes: encodedPlanes.map((plane) => plane.descriptor),
    bandBytes,
    bandSplitBytes: bandBytes.reduce((total, value) => total + value, 0),
  }
  return {
    compressed,
    descriptor,
    reconstructed: decodeDctResidual(prediction, compressed, descriptor),
  }
}

export function decodeDctResidual(prediction, compressed, descriptor) {
  assertRawImage(prediction, "prediction")
  if (descriptor.encoding !== DCT_LAYER_ENCODING) throw new Error("unsupported DCT layer encoding")
  if (descriptor.width !== prediction.width || descriptor.height !== prediction.height) {
    throw new Error("DCT layer dimensions do not match prediction")
  }
  if (compressed.length !== descriptor.bytes) throw new Error("DCT layer byte length mismatch")
  if (sha256(compressed) !== descriptor.sha256) throw new Error("DCT layer checksum mismatch")
  const serialized = inflateSync(compressed)
  if (serialized.length !== descriptor.rawBytes) throw new Error("DCT layer raw length mismatch")
  const blocks = deserializePlanes(serialized, descriptor.planes)
  const planes = blocks.map((planeBlocks, index) =>
    reconstructPlane(
      planeBlocks,
      descriptor.planes[index],
      index === 0 ? LUMA_QUANTIZATION : CHROMA_QUANTIZATION,
      descriptor.quantizationScale,
    ),
  )
  return combinePlanes(prediction, planes)
}

export function validateDctManifest(manifest) {
  if (!manifest || manifest.version !== DCT_LAYERED_IMAGE_VERSION) {
    throw new Error("unsupported DCT manifest version")
  }
  if (manifest.channels !== 3 || manifest.predictor !== DCT_PREDICTOR) {
    throw new Error("unsupported DCT pixel format")
  }
  if (!manifest.base || manifest.base.format !== "webp") throw new Error("invalid DCT base")
  if (!Array.isArray(manifest.layers) || manifest.layers.length === 0) {
    throw new Error("DCT manifest must contain refinement layers")
  }
  let width = manifest.base.width
  let height = manifest.base.height
  for (const [index, layer] of manifest.layers.entries()) {
    if (layer.level !== index + 1 || layer.encoding !== DCT_LAYER_ENCODING) {
      throw new Error("invalid DCT layer descriptor")
    }
    if (layer.width <= width || layer.height <= height) {
      throw new Error("DCT refinement dimensions must increase")
    }
    if (!Number.isFinite(layer.quantizationScale) || layer.quantizationScale <= 0) {
      throw new Error("invalid DCT quantization scale")
    }
    width = layer.width
    height = layer.height
  }
  if (width !== manifest.width || height !== manifest.height) {
    throw new Error("DCT final dimensions do not match manifest")
  }
  return manifest
}

export async function encodeDctLayeredReferences(references, options) {
  if (!Array.isArray(references) || references.length < 2) {
    throw new Error("at least two DCT reference levels are required")
  }
  references.forEach((reference, index) => {
    assertRawImage(reference, `references[${index}]`)
    if (
      index > 0 &&
      (reference.width <= references[index - 1].width ||
        reference.height <= references[index - 1].height)
    ) {
      throw new Error("DCT reference dimensions must increase")
    }
  })
  const baseBytes = options.baseBytes
    ? Buffer.from(options.baseBytes)
    : await encodeNative(references[0], "webp", options.baseQuality)
  let reconstructed = await decodeRgb(baseBytes)
  const reconstructedLevels = [reconstructed]
  const layers = []
  const descriptors = []
  for (let index = 1; index < references.length; index += 1) {
    const target = references[index]
    const prediction = resizeRgbFixed(reconstructed, target.width, target.height)
    const encoded = encodeDctResidual(prediction, target, options.quantizationScale)
    layers.push(encoded.compressed)
    descriptors.push({ level: index, ...encoded.descriptor })
    reconstructed = encoded.reconstructed
    reconstructedLevels.push(reconstructed)
  }
  const finalReference = references.at(-1)
  const manifest = validateDctManifest({
    version: DCT_LAYERED_IMAGE_VERSION,
    width: finalReference.width,
    height: finalReference.height,
    channels: 3,
    predictor: DCT_PREDICTOR,
    sourceSha256: options.sourceSha256,
    base: {
      width: reconstructedLevels[0].width,
      height: reconstructedLevels[0].height,
      format: "webp",
      quality: options.baseQuality,
      bytes: baseBytes.length,
      sha256: sha256(baseBytes),
    },
    layers: descriptors,
  })
  return { manifest, baseBytes, layers, references, reconstructedLevels }
}

export async function decodeDctLayeredImage(serialized) {
  const manifest = validateDctManifest(serialized.manifest)
  if (serialized.baseBytes.length !== manifest.base.bytes) throw new Error("DCT base length mismatch")
  if (sha256(serialized.baseBytes) !== manifest.base.sha256) throw new Error("DCT base checksum mismatch")
  if (!Array.isArray(serialized.layers) || serialized.layers.length !== manifest.layers.length) {
    throw new Error("DCT layer count mismatch")
  }
  let reconstructed = await decodeRgb(serialized.baseBytes)
  const reconstructedLevels = [reconstructed]
  for (let index = 0; index < manifest.layers.length; index += 1) {
    const descriptor = manifest.layers[index]
    const prediction = resizeRgbFixed(reconstructed, descriptor.width, descriptor.height)
    reconstructed = decodeDctResidual(prediction, serialized.layers[index], descriptor)
    reconstructedLevels.push(reconstructed)
  }
  return reconstructedLevels
}

export function serializeDctManifest(manifest) {
  validateDctManifest(manifest)
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
}
