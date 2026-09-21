import { createHash } from "node:crypto"
import { deflateSync, inflateSync } from "node:zlib"
import sharp from "sharp"

export const LAYERED_IMAGE_VERSION = 1
export const LAYER_ENCODING = "zigzag-u16le-deflate"
export const PREDICTOR = "bilinear-fixed-v1"

function assertInteger(value, name, minimum = 1) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer >= ${minimum}`)
  }
}

function assertRawImage(image, name = "image") {
  if (!image || !(image.data instanceof Uint8Array)) throw new Error(`${name} has no pixel data`)
  assertInteger(image.width, `${name}.width`)
  assertInteger(image.height, `${name}.height`)
  if (image.data.length !== image.width * image.height * 3) {
    throw new Error(`${name} must contain interleaved RGB pixels`)
  }
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex")
}

export function zigZagEncode(value) {
  if (!Number.isInteger(value) || value < -255 || value > 255) {
    throw new Error("residual coefficient must be an integer in [-255, 255]")
  }
  return value >= 0 ? value * 2 : -value * 2 - 1
}

export function zigZagDecode(value) {
  if (!Number.isInteger(value) || value < 0 || value > 510) {
    throw new Error("zigzag value must be an integer in [0, 510]")
  }
  return value % 2 === 0 ? value / 2 : -(value + 1) / 2
}

function axisSample(index, sourceSize, targetSize) {
  const denominator = 2 * targetSize
  const numerator = (2 * index + 1) * sourceSize - targetSize
  let lower = Math.floor(numerator / denominator)
  let fraction = numerator - lower * denominator

  if (lower < 0) return { lower: 0, upper: 0, fraction: 0, denominator }
  if (lower >= sourceSize - 1) {
    return {
      lower: sourceSize - 1,
      upper: sourceSize - 1,
      fraction: 0,
      denominator,
    }
  }
  return { lower, upper: lower + 1, fraction, denominator }
}

export function resizeRgbFixed(image, width, height) {
  assertRawImage(image)
  assertInteger(width, "width")
  assertInteger(height, "height")
  if (image.width === width && image.height === height) {
    return { width, height, data: Buffer.from(image.data) }
  }

  const xSamples = Array.from({ length: width }, (_, x) => axisSample(x, image.width, width))
  const ySamples = Array.from({ length: height }, (_, y) => axisSample(y, image.height, height))
  const output = Buffer.allocUnsafe(width * height * 3)

  for (let y = 0; y < height; y += 1) {
    const ys = ySamples[y]
    const y0 = ys.denominator - ys.fraction
    const y1 = ys.fraction
    for (let x = 0; x < width; x += 1) {
      const xs = xSamples[x]
      const x0 = xs.denominator - xs.fraction
      const x1 = xs.fraction
      const divisor = xs.denominator * ys.denominator
      const topLeft = (ys.lower * image.width + xs.lower) * 3
      const topRight = (ys.lower * image.width + xs.upper) * 3
      const bottomLeft = (ys.upper * image.width + xs.lower) * 3
      const bottomRight = (ys.upper * image.width + xs.upper) * 3
      const destination = (y * width + x) * 3

      for (let channel = 0; channel < 3; channel += 1) {
        const weighted =
          image.data[topLeft + channel] * x0 * y0 +
          image.data[topRight + channel] * x1 * y0 +
          image.data[bottomLeft + channel] * x0 * y1 +
          image.data[bottomRight + channel] * x1 * y1
        output[destination + channel] = Math.floor((weighted + divisor / 2) / divisor)
      }
    }
  }

  return { width, height, data: output }
}

export async function decodeRgb(bytes) {
  const { data, info } = await sharp(bytes)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.channels !== 3)
    throw new Error(`expected RGB decode, received ${info.channels} channels`)
  return { width: info.width, height: info.height, data }
}

export async function resizeSourceRgb(bytes, width) {
  assertInteger(width, "width")
  const { data, info } = await sharp(bytes)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize({ width, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.channels !== 3)
    throw new Error(`expected RGB resize, received ${info.channels} channels`)
  return { width: info.width, height: info.height, data }
}

export async function encodeNative(image, format, quality) {
  assertRawImage(image)
  assertInteger(quality, "quality")
  const pipeline = sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 3 },
  })
  if (format === "webp") return pipeline.webp({ quality, effort: 4 }).toBuffer()
  if (format === "avif") return pipeline.avif({ quality, effort: 4 }).toBuffer()
  throw new Error(`unsupported native format: ${format}`)
}

export function encodeResidual(prediction, target, quantization) {
  assertRawImage(prediction, "prediction")
  assertRawImage(target, "target")
  assertInteger(quantization, "quantization")
  if (prediction.width !== target.width || prediction.height !== target.height) {
    throw new Error("prediction and target dimensions must match")
  }

  const serialized = Buffer.allocUnsafe(target.data.length * 2)
  const reconstructed = Buffer.allocUnsafe(target.data.length)
  let zeroCount = 0
  const histogram = new Uint32Array(511)

  for (let index = 0; index < target.data.length; index += 1) {
    const difference = target.data[index] - prediction.data[index]
    const coefficient = Math.round(difference / quantization)
    const mapped = zigZagEncode(coefficient)
    serialized.writeUInt16LE(mapped, index * 2)
    histogram[mapped] += 1
    if (coefficient === 0) zeroCount += 1
    reconstructed[index] = Math.max(
      0,
      Math.min(255, prediction.data[index] + coefficient * quantization),
    )
  }

  let entropy = 0
  for (const count of histogram) {
    if (count === 0) continue
    const probability = count / target.data.length
    entropy -= probability * Math.log2(probability)
  }

  const compressed = deflateSync(serialized, { level: 6 })
  return {
    compressed,
    reconstructed: { width: target.width, height: target.height, data: reconstructed },
    statistics: {
      rawBytes: serialized.length,
      compressedBytes: compressed.length,
      zeroRatio: zeroCount / target.data.length,
      entropyBitsPerSymbol: entropy,
      compressionRatio: serialized.length / compressed.length,
    },
  }
}

export function decodeResidual(prediction, compressed, descriptor) {
  assertRawImage(prediction, "prediction")
  if (sha256(compressed) !== descriptor.sha256) throw new Error("residual checksum mismatch")
  const serialized = inflateSync(compressed)
  if (serialized.length !== descriptor.rawBytes) throw new Error("residual length mismatch")
  if (serialized.length !== prediction.data.length * 2) {
    throw new Error("residual dimensions do not match the prediction")
  }

  const data = Buffer.allocUnsafe(prediction.data.length)
  for (let index = 0; index < prediction.data.length; index += 1) {
    const coefficient = zigZagDecode(serialized.readUInt16LE(index * 2))
    data[index] = Math.max(
      0,
      Math.min(255, prediction.data[index] + coefficient * descriptor.quantization),
    )
  }
  return { width: descriptor.width, height: descriptor.height, data }
}

export function validateLayeredManifest(manifest) {
  if (!manifest || manifest.version !== LAYERED_IMAGE_VERSION) {
    throw new Error("unsupported layered image manifest version")
  }
  if (manifest.channels !== 3 || manifest.predictor !== PREDICTOR) {
    throw new Error("unsupported layered image pixel format")
  }
  assertInteger(manifest.width, "manifest.width")
  assertInteger(manifest.height, "manifest.height")
  if (!manifest.base || manifest.base.format !== "webp") throw new Error("invalid base descriptor")
  assertInteger(manifest.base.width, "base.width")
  assertInteger(manifest.base.height, "base.height")
  assertInteger(manifest.base.bytes, "base.bytes")
  if (!Array.isArray(manifest.layers) || manifest.layers.length === 0) {
    throw new Error("manifest must contain at least one refinement layer")
  }

  let previousWidth = manifest.base.width
  let previousHeight = manifest.base.height
  for (const [index, layer] of manifest.layers.entries()) {
    if (layer.level !== index + 1 || layer.encoding !== LAYER_ENCODING) {
      throw new Error("invalid refinement layer descriptor")
    }
    assertInteger(layer.width, "layer.width")
    assertInteger(layer.height, "layer.height")
    assertInteger(layer.quantization, "layer.quantization")
    assertInteger(layer.rawBytes, "layer.rawBytes")
    assertInteger(layer.bytes, "layer.bytes")
    if (layer.width <= previousWidth || layer.height <= previousHeight) {
      throw new Error("refinement dimensions must increase monotonically")
    }
    previousWidth = layer.width
    previousHeight = layer.height
  }
  if (previousWidth !== manifest.width || previousHeight !== manifest.height) {
    throw new Error("final refinement dimensions do not match the manifest")
  }
  return manifest
}

export async function encodeLayeredReferences(references, options) {
  if (!Array.isArray(references) || references.length < 2) {
    throw new Error("at least two reference levels are required")
  }
  references.forEach((reference, index) => {
    assertRawImage(reference, `references[${index}]`)
    if (
      index > 0 &&
      (reference.width <= references[index - 1].width ||
        reference.height <= references[index - 1].height)
    ) {
      throw new Error("reference dimensions must increase")
    }
  })
  assertInteger(options.baseQuality, "baseQuality")
  assertInteger(options.quantization, "quantization")

  const baseBytes = options.baseBytes
    ? Buffer.from(options.baseBytes)
    : await encodeNative(references[0], "webp", options.baseQuality)
  let reconstructed = await decodeRgb(baseBytes)
  const reconstructedLevels = [reconstructed]
  const layers = []
  const layerDescriptors = []

  for (let index = 1; index < references.length; index += 1) {
    const target = references[index]
    const prediction = resizeRgbFixed(reconstructed, target.width, target.height)
    const encoded = encodeResidual(prediction, target, options.quantization)
    const descriptor = {
      level: index,
      width: target.width,
      height: target.height,
      quantization: options.quantization,
      encoding: LAYER_ENCODING,
      rawBytes: encoded.statistics.rawBytes,
      bytes: encoded.compressed.length,
      sha256: sha256(encoded.compressed),
      ...encoded.statistics,
    }
    layers.push(encoded.compressed)
    layerDescriptors.push(descriptor)
    reconstructed = encoded.reconstructed
    reconstructedLevels.push(reconstructed)
  }

  const finalReference = references.at(-1)
  const manifest = validateLayeredManifest({
    version: LAYERED_IMAGE_VERSION,
    width: finalReference.width,
    height: finalReference.height,
    channels: 3,
    predictor: PREDICTOR,
    sourceSha256: options.sourceSha256,
    base: {
      width: reconstructedLevels[0].width,
      height: reconstructedLevels[0].height,
      format: "webp",
      quality: options.baseQuality,
      bytes: baseBytes.length,
      sha256: sha256(baseBytes),
    },
    layers: layerDescriptors,
  })

  return { manifest, baseBytes, layers, references, reconstructedLevels }
}

export async function encodeLayeredImage(sourceBytes, options) {
  const widths = options.widths
  if (!Array.isArray(widths) || widths.length < 2)
    throw new Error("at least two widths are required")
  widths.forEach((width, index) => {
    assertInteger(width, `widths[${index}]`)
    if (index > 0 && width <= widths[index - 1]) throw new Error("widths must increase")
  })
  const references = []
  for (const width of widths) references.push(await resizeSourceRgb(sourceBytes, width))
  return encodeLayeredReferences(references, {
    ...options,
    sourceSha256: sha256(sourceBytes),
  })
}

export async function decodeLayeredImage(serialized) {
  const manifest = validateLayeredManifest(serialized.manifest)
  if (sha256(serialized.baseBytes) !== manifest.base.sha256)
    throw new Error("base checksum mismatch")
  if (serialized.baseBytes.length !== manifest.base.bytes) throw new Error("base length mismatch")
  if (!Array.isArray(serialized.layers) || serialized.layers.length !== manifest.layers.length) {
    throw new Error("refinement layer count mismatch")
  }

  let reconstructed = await decodeRgb(serialized.baseBytes)
  if (
    reconstructed.width !== manifest.base.width ||
    reconstructed.height !== manifest.base.height
  ) {
    throw new Error("decoded base dimensions do not match the manifest")
  }
  const reconstructedLevels = [reconstructed]
  for (let index = 0; index < manifest.layers.length; index += 1) {
    const descriptor = manifest.layers[index]
    const compressed = serialized.layers[index]
    if (compressed.length !== descriptor.bytes) throw new Error("residual byte length mismatch")
    const prediction = resizeRgbFixed(reconstructed, descriptor.width, descriptor.height)
    reconstructed = decodeResidual(prediction, compressed, descriptor)
    reconstructedLevels.push(reconstructed)
  }
  return reconstructedLevels
}

export function psnr(reference, candidate) {
  assertComparable(reference, candidate)
  let squaredError = 0
  for (let index = 0; index < reference.data.length; index += 1) {
    const difference = reference.data[index] - candidate.data[index]
    squaredError += difference * difference
  }
  if (squaredError === 0) return Number.POSITIVE_INFINITY
  const mse = squaredError / reference.data.length
  return 10 * Math.log10((255 * 255) / mse)
}

function assertComparable(reference, candidate) {
  assertRawImage(reference, "reference")
  assertRawImage(candidate, "candidate")
  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    throw new Error("image dimensions must match")
  }
}

export function ssim(reference, candidate, windowSize = 8) {
  assertComparable(reference, candidate)
  assertInteger(windowSize, "windowSize")
  const c1 = (0.01 * 255) ** 2
  const c2 = (0.03 * 255) ** 2
  let total = 0
  let windows = 0

  for (let top = 0; top < reference.height; top += windowSize) {
    for (let left = 0; left < reference.width; left += windowSize) {
      const bottom = Math.min(reference.height, top + windowSize)
      const right = Math.min(reference.width, left + windowSize)
      const count = (bottom - top) * (right - left)
      let sumReference = 0
      let sumCandidate = 0
      let sumReferenceSquared = 0
      let sumCandidateSquared = 0
      let sumProduct = 0

      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const offset = (y * reference.width + x) * 3
          const referenceLuma =
            reference.data[offset] * 0.2126 +
            reference.data[offset + 1] * 0.7152 +
            reference.data[offset + 2] * 0.0722
          const candidateLuma =
            candidate.data[offset] * 0.2126 +
            candidate.data[offset + 1] * 0.7152 +
            candidate.data[offset + 2] * 0.0722
          sumReference += referenceLuma
          sumCandidate += candidateLuma
          sumReferenceSquared += referenceLuma * referenceLuma
          sumCandidateSquared += candidateLuma * candidateLuma
          sumProduct += referenceLuma * candidateLuma
        }
      }

      const referenceMean = sumReference / count
      const candidateMean = sumCandidate / count
      const referenceVariance = Math.max(0, sumReferenceSquared / count - referenceMean ** 2)
      const candidateVariance = Math.max(0, sumCandidateSquared / count - candidateMean ** 2)
      const covariance = sumProduct / count - referenceMean * candidateMean
      total +=
        ((2 * referenceMean * candidateMean + c1) * (2 * covariance + c2)) /
        ((referenceMean ** 2 + candidateMean ** 2 + c1) *
          (referenceVariance + candidateVariance + c2))
      windows += 1
    }
  }
  return total / windows
}

export function serializeManifest(manifest) {
  validateLayeredManifest(manifest)
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
}
