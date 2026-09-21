import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"
import sharp from "sharp"
import {
  decodeLayeredImage,
  decodeRgb,
  encodeLayeredReferences,
  encodeNative,
  psnr,
  resizeRgbFixed,
  resizeSourceRgb,
  serializeManifest,
  sha256,
  ssim,
} from "./image-layering-codec.mjs"

export const DEFAULT_LADDERS = [
  { id: "layered-4-mobile", widths: [48, 96, 192, 384] },
  { id: "layered-4-desktop", widths: [64, 128, 256, 512] },
  { id: "layered-5-mobile", widths: [48, 96, 144, 192, 384] },
]

const DEFAULT_BASE_QUALITIES = [50, 65, 80]
const DEFAULT_QUANTIZATIONS = [2, 4, 8]
const DEFAULT_NATIVE_QUALITIES = [40, 50, 60, 70, 80, 90, 100]

function parseNumberList(value, fallback) {
  if (!value) return fallback
  const values = value.split(",").map(Number)
  if (values.some((entry) => !Number.isInteger(entry) || entry <= 0)) {
    throw new Error(`invalid numeric list: ${value}`)
  }
  return values
}

function parseArgs(argv) {
  const values = Object.fromEntries(
    argv.map((argument) => {
      const [key, ...rest] = argument.replace(/^--/, "").split("=")
      return [key, rest.join("=") || "true"]
    }),
  )
  const positiveInteger = (key, fallback) => {
    const value = Number(values[key] ?? fallback)
    if (!Number.isInteger(value) || value < 1) throw new Error(`--${key} must be positive`)
    return value
  }
  const limit = positiveInteger("limit", 100)
  return {
    baseUrl: values["base-url"] ?? "https://nothing-new.icu",
    output:
      values.output ??
      path.join(
        tmpdir(),
        `nothing-new-layered-images-${new Date().toISOString().replace(/[:.]/g, "-")}`,
      ),
    limit,
    screeningLimit: Math.min(limit, positiveInteger("screening-limit", 20)),
    finalistCount: positiveInteger("finalists", 3),
    baseQualities: parseNumberList(values["base-qualities"], DEFAULT_BASE_QUALITIES),
    quantizations: parseNumberList(values.quantizations, DEFAULT_QUANTIZATIONS),
    nativeQualities: parseNumberList(values["native-qualities"], DEFAULT_NATIVE_QUALITIES),
  }
}

function stableRank(id) {
  return createHash("sha256").update(String(id)).digest("hex")
}

export function selectAnimeSamples(items, limit) {
  const valid = items.filter(
    (item) =>
      Number.isInteger(item.id) &&
      (item.status === "watching" || item.status === "watched") &&
      typeof item.cover === "string" &&
      item.cover.length > 0,
  )
  const watching = valid
    .filter((item) => item.status === "watching")
    .sort((left, right) => left.id - right.id)
  const watched = valid
    .filter((item) => item.status === "watched")
    .sort((left, right) => stableRank(left.id).localeCompare(stableRank(right.id)))
  return [...watching, ...watched].slice(0, limit)
}

function spacedIndices(length, count) {
  if (count >= length) return Array.from({ length }, (_, index) => index)
  if (count === 1) return [0]
  return Array.from({ length: count }, (_, index) =>
    Math.round((index * (length - 1)) / (count - 1)),
  )
}

export function percentile(values, quantile) {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))
  return sorted[index]
}

function rounded(value, digits = 6) {
  return value === undefined || !Number.isFinite(value) ? value : Number(value.toFixed(digits))
}

function candidateKey(candidate) {
  return `${candidate.ladder.id}-base${candidate.baseQuality}-q${candidate.quantization}`
}

function candidateMatrix(options) {
  return DEFAULT_LADDERS.flatMap((ladder) =>
    options.baseQualities.flatMap((baseQuality) =>
      options.quantizations.map((quantization) => ({
        ladder,
        baseQuality,
        quantization,
        key: candidateKey({ ladder, baseQuality, quantization }),
      })),
    ),
  )
}

async function fetchWithTimeout(url, responseType) {
  const response = await fetch(url, {
    headers: { "User-Agent": "nothing-new-layered-image-lab/1.0" },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  if (responseType === "json") return response.json()
  return Buffer.from(await response.arrayBuffer())
}

async function mapLimit(values, concurrency, mapper) {
  const output = new Array(values.length)
  let cursor = 0
  async function worker() {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= values.length) return
      output[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, values.length)) }, () => worker()),
  )
  return output
}

async function loadSnapshot(baseUrl) {
  const pointerUrl = new URL("/anime/latest.json", baseUrl)
  const pointer = await fetchWithTimeout(pointerUrl, "json")
  const snapshotUrl = new URL(pointer.snapshot, baseUrl)
  const snapshot = await fetchWithTimeout(snapshotUrl, "json")
  if (!Array.isArray(snapshot.items)) throw new Error("anime snapshot has no items")
  return { pointerUrl: pointerUrl.href, snapshotUrl: snapshotUrl.href, pointer, snapshot }
}

async function downloadSamples(items, baseUrl, rawDirectory) {
  return mapLimit(items, 6, async (item, index) => {
    const sourceUrl = new URL(item.cover, baseUrl).href
    try {
      const bytes = await fetchWithTimeout(sourceUrl, "buffer")
      const metadata = await sharp(bytes).metadata()
      if (!metadata.width || !metadata.height) throw new Error("image dimensions are unavailable")
      const digest = sha256(bytes)
      const file = path.join(
        rawDirectory,
        `${String(index).padStart(3, "0")}-${item.id}-${digest.slice(0, 12)}.bin`,
      )
      await writeFile(file, bytes)
      return {
        ok: true,
        item,
        sourceUrl,
        file,
        sourceSha256: digest,
        sourceBytes: bytes.length,
        sourceWidth: metadata.width,
        sourceHeight: metadata.height,
        sourceFormat: metadata.format,
      }
    } catch (error) {
      return {
        ok: false,
        item,
        sourceUrl,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}

async function buildReferences(sourceBytes) {
  const widths = [...new Set(DEFAULT_LADDERS.flatMap((ladder) => ladder.widths))]
  const references = new Map()
  for (const width of widths) references.set(width, await resizeSourceRgb(sourceBytes, width))
  return references
}

async function measureNativeBaselines(references, qualities) {
  const output = {}
  for (const terminalWidth of [384, 512]) {
    const reference = references.get(terminalWidth)
    const variants = []
    for (const format of ["webp", "avif"]) {
      for (const quality of qualities) {
        const startedAt = performance.now()
        const bytes = await encodeNative(reference, format, quality)
        const encodedMs = performance.now() - startedAt
        const decodeStartedAt = performance.now()
        const decoded = await decodeRgb(bytes)
        const decodedMs = performance.now() - decodeStartedAt
        variants.push({
          format,
          quality,
          bytes: bytes.length,
          ssim: rounded(ssim(reference, decoded)),
          psnr: rounded(psnr(reference, decoded)),
          encodeMs: rounded(encodedMs, 3),
          decodeMs: rounded(decodedMs, 3),
        })
      }
    }
    output[terminalWidth] = variants
  }
  return output
}

function smallestMatchedNative(nativeVariants, targetSsim) {
  return nativeVariants
    .filter((variant) => variant.ssim >= targetSsim - 0.005)
    .sort((left, right) => left.bytes - right.bytes)[0]
}

function isParetoPoint(bytes, quality, nativeVariants) {
  return !nativeVariants.some(
    (variant) =>
      variant.bytes <= bytes &&
      variant.ssim >= quality &&
      (variant.bytes < bytes || variant.ssim > quality),
  )
}

async function measureCandidate(
  sample,
  sourceBytes,
  references,
  nativeByTerminal,
  candidate,
  baseCache,
) {
  const selectedReferences = candidate.ladder.widths.map((width) => references.get(width))
  const firstWidth = candidate.ladder.widths[0]
  const baseKey = `${firstWidth}-${candidate.baseQuality}`
  let base = baseCache.get(baseKey)
  if (!base) {
    const startedAt = performance.now()
    const bytes = await encodeNative(selectedReferences[0], "webp", candidate.baseQuality)
    base = { bytes, encodeMs: performance.now() - startedAt }
    baseCache.set(baseKey, base)
  }

  const encodeStartedAt = performance.now()
  const encoded = await encodeLayeredReferences(selectedReferences, {
    baseQuality: candidate.baseQuality,
    quantization: candidate.quantization,
    baseBytes: base.bytes,
    sourceSha256: sample.sourceSha256,
  })
  const residualEncodeMs = performance.now() - encodeStartedAt
  const manifestBytes = serializeManifest(encoded.manifest).length

  const decodeStartedAt = performance.now()
  const decodedLevels = await decodeLayeredImage(encoded)
  const decodeMs = performance.now() - decodeStartedAt
  const reconstructionMatches = decodedLevels.every((level, index) =>
    level.data.equals(encoded.reconstructedLevels[index].data),
  )

  const finalReference = selectedReferences.at(-1)
  const nativeVariants = nativeByTerminal[finalReference.width]
  let cumulativeBytes = manifestBytes
  const levels = []
  for (let index = 0; index < decodedLevels.length; index += 1) {
    cumulativeBytes += index === 0 ? encoded.baseBytes.length : encoded.layers[index - 1].length
    const current = decodedLevels[index]
    const currentReference = selectedReferences[index]
    const terminalCandidate =
      current.width === finalReference.width
        ? current
        : resizeRgbFixed(current, finalReference.width, finalReference.height)
    levels.push({
      level: index,
      width: current.width,
      height: current.height,
      bytes: index === 0 ? encoded.baseBytes.length : encoded.layers[index - 1].length,
      cumulativeBytes,
      ssim: rounded(ssim(currentReference, current)),
      psnr: rounded(psnr(currentReference, current)),
      terminalSsim: rounded(ssim(finalReference, terminalCandidate)),
      terminalPsnr: rounded(psnr(finalReference, terminalCandidate)),
      paretoAgainstTerminalNative:
        index < decodedLevels.length - 1
          ? isParetoPoint(cumulativeBytes, ssim(finalReference, terminalCandidate), nativeVariants)
          : undefined,
    })
  }

  const totalBytes = levels.at(-1).cumulativeBytes
  const finalSsim = levels.at(-1).ssim
  const matchedNative = smallestMatchedNative(nativeVariants, finalSsim)
  const monotonic = levels.every(
    (level, index) => index === 0 || level.terminalSsim + 1e-9 >= levels[index - 1].terminalSsim,
  )
  const largestLevel = Math.max(...selectedReferences.map((reference) => reference.data.length * 4))

  return {
    sampleId: sample.item.id,
    candidate: candidate.key,
    terminalWidth: finalReference.width,
    manifestBytes,
    baseBytes: encoded.baseBytes.length,
    firstRefinementBytes: encoded.layers[0].length,
    totalBytes,
    baseShare: rounded(encoded.baseBytes.length / totalBytes),
    baseAndFirstShare: rounded((encoded.baseBytes.length + encoded.layers[0].length) / totalBytes),
    finalSsim,
    finalPsnr: levels.at(-1).psnr,
    matchedNative,
    matchedNativeRatio: matchedNative ? rounded(totalBytes / matchedNative.bytes) : undefined,
    monotonic,
    hasIntermediateParetoPoint: levels
      .slice(0, -1)
      .some((level) => level.paretoAgainstTerminalNative),
    reconstructionMatches,
    baseEncodeMs: rounded(base.encodeMs, 3),
    residualEncodeMs: rounded(residualEncodeMs, 3),
    decodeMs: rounded(decodeMs, 3),
    estimatedPeakWorkingBytes: largestLevel,
    layers: encoded.manifest.layers.map((layer) => ({
      level: layer.level,
      rawBytes: layer.rawBytes,
      compressedBytes: layer.bytes,
      zeroRatio: rounded(layer.zeroRatio),
      entropyBitsPerSymbol: rounded(layer.entropyBitsPerSymbol),
      compressionRatio: rounded(layer.compressionRatio),
    })),
    levels,
  }
}

export function summarizeCandidate(candidate, results, expectedCount) {
  const values = (key) =>
    results.map((result) => result[key]).filter((value) => typeof value === "number")
  const finalSsim = values("finalSsim")
  const matchedRatios = values("matchedNativeRatio")
  return {
    candidate: candidate.key,
    ladder: candidate.ladder.widths,
    terminalWidth: candidate.ladder.widths.at(-1),
    baseQuality: candidate.baseQuality,
    quantization: candidate.quantization,
    expectedSamples: expectedCount,
    completedSamples: results.length,
    correctnessRate:
      results.length === 0
        ? 0
        : results.filter((result) => result.reconstructionMatches).length / results.length,
    finalSsimMedian: rounded(percentile(finalSsim, 0.5)),
    finalSsimP10: rounded(percentile(finalSsim, 0.1)),
    matchedNativeRatioMedian: rounded(percentile(matchedRatios, 0.5)),
    matchedNativeRatioP75: rounded(percentile(matchedRatios, 0.75)),
    matchedNativeCoverage: results.length === 0 ? 0 : matchedRatios.length / results.length,
    baseShareMedian: rounded(percentile(values("baseShare"), 0.5)),
    baseAndFirstShareMedian: rounded(percentile(values("baseAndFirstShare"), 0.5)),
    totalBytesMedian: rounded(percentile(values("totalBytes"), 0.5), 0),
    decodeMsP75: rounded(percentile(values("decodeMs"), 0.75), 3),
    monotonicRate:
      results.length === 0
        ? 0
        : results.filter((result) => result.monotonic).length / results.length,
    paretoRate:
      results.length === 0
        ? 0
        : results.filter((result) => result.hasIntermediateParetoPoint).length / results.length,
  }
}

export function evaluateRepresentationGate(summary) {
  const checks = {
    sampleCoverage: summary.completedSamples === summary.expectedSamples,
    correctness: summary.correctnessRate === 1,
    finalQuality: summary.finalSsimMedian >= 0.95 && summary.finalSsimP10 >= 0.93,
    matchedNativeCoverage: summary.matchedNativeCoverage === 1,
    byteOverhead: summary.matchedNativeRatioMedian <= 1.15 && summary.matchedNativeRatioP75 <= 1.25,
    baseBudget: summary.baseShareMedian <= 0.25,
    firstRefinementBudget: summary.baseAndFirstShareMedian <= 0.55,
    monotonicQuality: summary.monotonicRate >= 0.95,
    intermediatePareto: summary.paretoRate > 0,
  }
  return { pass: Object.values(checks).every(Boolean), checks }
}

function rankSummaries(left, right) {
  const leftQualityPenalty = left.finalSsimMedian >= 0.93 ? 0 : 1
  const rightQualityPenalty = right.finalSsimMedian >= 0.93 ? 0 : 1
  return (
    leftQualityPenalty - rightQualityPenalty ||
    (left.matchedNativeRatioMedian ?? Number.POSITIVE_INFINITY) -
      (right.matchedNativeRatioMedian ?? Number.POSITIVE_INFINITY) ||
    right.finalSsimMedian - left.finalSsimMedian ||
    left.baseShareMedian - right.baseShareMedian
  )
}

function markdownSummary(result) {
  const lines = [
    "# Base + Refinement Representation Gate",
    "",
    `- Generated: ${result.generatedAt}`,
    `- Node: ${result.runtime.node}`,
    `- Snapshot: ${result.source.snapshotUrl}`,
    `- Samples: ${result.samples.successful}/${result.samples.requested}`,
    `- Decision: **${result.gate.pass ? "GO" : "NO-GO"}**`,
    "",
    "| Candidate | Ladder | Base Q | Residual Q | SSIM median / P10 | Native byte ratio median / P75 | Base share | Base+R1 | Monotonic | Pareto | Gate |",
    "| --- | --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- |",
  ]
  for (const entry of result.gate.candidates) {
    const summary = entry.summary
    lines.push(
      `| ${summary.candidate} | ${summary.ladder.join("→")} | ${summary.baseQuality} | ${summary.quantization} | ${summary.finalSsimMedian} / ${summary.finalSsimP10} | ${summary.matchedNativeRatioMedian ?? "n/a"} / ${summary.matchedNativeRatioP75 ?? "n/a"} | ${summary.baseShareMedian} | ${summary.baseAndFirstShareMedian} | ${summary.monotonicRate} | ${summary.paretoRate} | ${entry.gate.pass ? "GO" : "NO-GO"} |`,
    )
  }
  lines.push("", "## Gate checks", "")
  for (const entry of result.gate.candidates) {
    const failed = Object.entries(entry.gate.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
    lines.push(
      `- ${entry.summary.candidate}: ${failed.length === 0 ? "all passed" : `failed ${failed.join(", ")}`}`,
    )
  }
  lines.push(
    "",
    "Encoding and reconstruction timings are local descriptive measurements only. They are not browser CPU conclusions.",
    "",
  )
  return lines.join("\n")
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await mkdir(options.output, { recursive: true })
  const rawDirectory = path.join(options.output, "sources")
  await mkdir(rawDirectory, { recursive: true })

  console.log(`[layers] loading anime snapshot from ${options.baseUrl}`)
  const source = await loadSnapshot(options.baseUrl)
  const selectedItems = selectAnimeSamples(source.snapshot.items, options.limit)
  console.log(`[layers] downloading ${selectedItems.length} deterministic cover samples`)
  const downloads = await downloadSamples(selectedItems, options.baseUrl, rawDirectory)
  const successful = downloads.filter((sample) => sample.ok)
  const failures = downloads.filter((sample) => !sample.ok)
  if (successful.length === 0) throw new Error("no cover samples could be downloaded")

  await writeFile(
    path.join(options.output, "samples.json"),
    `${JSON.stringify(
      {
        snapshot: source.snapshotUrl,
        samples: downloads.map((sample) => {
          const publicSample = { ...sample }
          delete publicSample.file
          return publicSample
        }),
      },
      null,
      2,
    )}\n`,
  )

  const prepared = []
  for (let index = 0; index < successful.length; index += 1) {
    const sample = successful[index]
    console.log(`[layers] native baselines ${index + 1}/${successful.length}: ${sample.item.id}`)
    const sourceBytes = await readFile(sample.file)
    const references = await buildReferences(sourceBytes)
    const native = await measureNativeBaselines(references, options.nativeQualities)
    prepared.push({ sample, sourceBytes, references, native })
  }

  const candidates = candidateMatrix(options)
  const screeningIndices = spacedIndices(
    prepared.length,
    Math.min(options.screeningLimit, prepared.length),
  )
  const resultsByCandidate = new Map(candidates.map((candidate) => [candidate.key, []]))
  console.log(
    `[layers] screening ${candidates.length} candidates on ${screeningIndices.length} samples`,
  )
  for (const index of screeningIndices) {
    const preparedSample = prepared[index]
    const baseCache = new Map()
    for (const candidate of candidates) {
      resultsByCandidate
        .get(candidate.key)
        .push(
          await measureCandidate(
            preparedSample.sample,
            preparedSample.sourceBytes,
            preparedSample.references,
            preparedSample.native,
            candidate,
            baseCache,
          ),
        )
    }
    console.log(`[layers] screening sample complete: ${preparedSample.sample.item.id}`)
  }

  const screening = candidates.map((candidate) =>
    summarizeCandidate(candidate, resultsByCandidate.get(candidate.key), screeningIndices.length),
  )
  const finalists = [384, 512].flatMap((terminalWidth) =>
    screening
      .filter((summary) => summary.terminalWidth === terminalWidth)
      .sort(rankSummaries)
      .slice(0, options.finalistCount)
      .map((summary) => candidates.find((candidate) => candidate.key === summary.candidate)),
  )

  const screeningSet = new Set(screeningIndices)
  console.log(`[layers] validating ${finalists.length} finalists on all ${prepared.length} samples`)
  for (let index = 0; index < prepared.length; index += 1) {
    if (screeningSet.has(index)) continue
    const preparedSample = prepared[index]
    const baseCache = new Map()
    for (const candidate of finalists) {
      resultsByCandidate
        .get(candidate.key)
        .push(
          await measureCandidate(
            preparedSample.sample,
            preparedSample.sourceBytes,
            preparedSample.references,
            preparedSample.native,
            candidate,
            baseCache,
          ),
        )
    }
    console.log(`[layers] finalist sample complete: ${index + 1}/${prepared.length}`)
  }

  const gateCandidates = finalists.map((candidate) => {
    const summary = summarizeCandidate(
      candidate,
      resultsByCandidate.get(candidate.key),
      successful.length,
    )
    return { summary, gate: evaluateRepresentationGate(summary) }
  })
  const gate = {
    pass: gateCandidates.some((entry) => entry.gate.pass),
    candidates: gateCandidates,
  }
  const result = {
    generatedAt: new Date().toISOString(),
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      sharp: sharp.versions,
    },
    source: {
      pointerUrl: source.pointerUrl,
      snapshotUrl: source.snapshotUrl,
      snapshotVersion: source.pointer.version,
      snapshotUpdatedAt: source.pointer.updatedAt,
    },
    configuration: {
      ...options,
      output: undefined,
      ladders: DEFAULT_LADDERS,
    },
    samples: {
      requested: selectedItems.length,
      successful: successful.length,
      failures,
    },
    native: prepared.map((entry) => ({
      sampleId: entry.sample.item.id,
      variants: entry.native,
    })),
    screening,
    finalists: finalists.map((candidate) => candidate.key),
    candidateResults: Object.fromEntries(
      finalists.map((candidate) => [candidate.key, resultsByCandidate.get(candidate.key)]),
    ),
    gate,
  }
  const aggregate = {
    generatedAt: result.generatedAt,
    runtime: result.runtime,
    source: result.source,
    configuration: result.configuration,
    samples: {
      requested: result.samples.requested,
      successful: result.samples.successful,
      failureCount: result.samples.failures.length,
    },
    screening: result.screening,
    finalists: result.finalists,
    gate: result.gate,
  }
  await writeFile(path.join(options.output, "result.json"), `${JSON.stringify(result, null, 2)}\n`)
  await writeFile(
    path.join(options.output, "aggregate.json"),
    `${JSON.stringify(aggregate, null, 2)}\n`,
  )
  await writeFile(path.join(options.output, "summary.md"), markdownSummary(result))
  console.log(`[layers] Representation Gate: ${gate.pass ? "GO" : "NO-GO"}`)
  console.log(`[layers] results: ${options.output}`)
}

const isMain =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isMain) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
