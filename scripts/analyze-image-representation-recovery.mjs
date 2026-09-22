import { mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"
import sharp from "sharp"
import { DEFAULT_LADDERS, percentile, selectAnimeSamples } from "./analyze-layered-images.mjs"
import {
  decodeRgb,
  encodeNative,
  psnr,
  resizeRgbFixed,
  resizeSourceRgb,
  sha256,
  ssim,
} from "./image-layering-codec.mjs"
import {
  decodeDctLayeredImage,
  encodeDctLayeredReferences,
  serializeDctManifest,
} from "./image-layering-dct.mjs"

const DEFAULT_NATIVE_QUALITIES = [40, 50, 60, 70, 80, 90, 100]
const DEFAULT_PROGRESSIVE_QUALITIES = [40, 50, 60, 70, 80, 90, 95]
const DEFAULT_QUANTIZATION_SCALES = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4]
const QUALITY_TARGETS = [0.95, 0.97, 0.99]
const BASE_QUALITY = 65

function parseNumberList(value, fallback) {
  if (!value) return fallback
  const output = value.split(",").map(Number)
  if (output.some((entry) => !Number.isFinite(entry) || entry <= 0)) {
    throw new Error(`invalid numeric list: ${value}`)
  }
  return output
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
    samplesManifest: values["samples-manifest"],
    output:
      values.output ??
      path.join(
        tmpdir(),
        `nothing-new-representation-recovery-${new Date().toISOString().replace(/[:.]/g, "-")}`,
      ),
    limit,
    screeningLimit: Math.min(limit, positiveInteger("screening-limit", 20)),
    nativeQualities: parseNumberList(values["native-qualities"], DEFAULT_NATIVE_QUALITIES),
    progressiveQualities: parseNumberList(
      values["progressive-qualities"],
      DEFAULT_PROGRESSIVE_QUALITIES,
    ),
    quantizationScales: parseNumberList(
      values["quantization-scales"],
      DEFAULT_QUANTIZATION_SCALES,
    ),
  }
}

function rounded(value, digits = 6) {
  return value === undefined || !Number.isFinite(value) ? value : Number(value.toFixed(digits))
}

function spacedIndices(length, count) {
  if (count >= length) return Array.from({ length }, (_, index) => index)
  if (count === 1) return [0]
  return Array.from({ length: count }, (_, index) =>
    Math.round((index * (length - 1)) / (count - 1)),
  )
}

async function fetchWithTimeout(url, responseType) {
  const response = await fetch(url, {
    headers: { "User-Agent": "nothing-new-representation-recovery/1.0" },
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
    Array.from({ length: Math.min(concurrency, Math.max(values.length, 1)) }, () => worker()),
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

async function loadCachedSamples(samplesManifest, limit) {
  const manifestPath = path.resolve(samplesManifest)
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  if (!Array.isArray(manifest.samples)) throw new Error("cached sample manifest has no samples")
  const sourceDirectory = path.join(path.dirname(manifestPath), "sources")
  const selected = manifest.samples
    .map((sample, originalIndex) => ({ sample, originalIndex }))
    .filter(({ sample }) => sample.ok)
    .slice(0, limit)
  const downloads = await mapLimit(selected, 6, async ({ sample, originalIndex }) => {
    const file = path.join(
      sourceDirectory,
      `${String(originalIndex).padStart(3, "0")}-${sample.item.id}-${sample.sourceSha256.slice(0, 12)}.bin`,
    )
    const bytes = await readFile(file)
    if (bytes.length !== sample.sourceBytes) throw new Error(`cached sample length mismatch: ${file}`)
    if (sha256(bytes) !== sample.sourceSha256) {
      throw new Error(`cached sample checksum mismatch: ${file}`)
    }
    return { ...sample, file }
  })
  const snapshotUrl = manifest.snapshot
  const snapshotVersion = path.basename(new URL(snapshotUrl).pathname, ".json")
  return {
    source: {
      pointerUrl: new URL("/anime/latest.json", snapshotUrl).href,
      snapshotUrl,
      pointer: { version: snapshotVersion, updatedAt: undefined },
      snapshot: { items: selected.map(({ sample }) => sample.item) },
    },
    selectedItems: selected.map(({ sample }) => sample.item),
    downloads,
  }
}

async function buildReferences(sourceBytes) {
  const widths = [...new Set(DEFAULT_LADDERS.flatMap((ladder) => ladder.widths))]
  const references = new Map()
  for (const width of widths) references.set(width, await resizeSourceRgb(sourceBytes, width))
  return references
}

async function encodeProgressiveJpeg(image, quality) {
  return sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 3 },
  })
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer()
}

async function measureFormatBaselines(references, options) {
  const output = {}
  for (const terminalWidth of [384, 512]) {
    const reference = references.get(terminalWidth)
    const native = []
    const progressiveJpeg = []
    for (const format of ["webp", "avif"]) {
      for (const quality of options.nativeQualities) {
        const encodeStartedAt = performance.now()
        const bytes = await encodeNative(reference, format, quality)
        const encodeMs = performance.now() - encodeStartedAt
        const decodeStartedAt = performance.now()
        const decoded = await decodeRgb(bytes)
        native.push({
          format,
          quality,
          bytes: bytes.length,
          ssim: rounded(ssim(reference, decoded)),
          psnr: rounded(psnr(reference, decoded)),
          encodeMs: rounded(encodeMs, 3),
          decodeMs: rounded(performance.now() - decodeStartedAt, 3),
        })
      }
    }
    for (const quality of options.progressiveQualities) {
      const encodeStartedAt = performance.now()
      const bytes = await encodeProgressiveJpeg(reference, quality)
      const encodeMs = performance.now() - encodeStartedAt
      const decodeStartedAt = performance.now()
      const decoded = await decodeRgb(bytes)
      progressiveJpeg.push({
        format: "progressive-jpeg",
        quality,
        bytes: bytes.length,
        ssim: rounded(ssim(reference, decoded)),
        psnr: rounded(psnr(reference, decoded)),
        encodeMs: rounded(encodeMs, 3),
        decodeMs: rounded(performance.now() - decodeStartedAt, 3),
      })
    }
    output[terminalWidth] = { native, progressiveJpeg }
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

function dctCandidate(ladder, quantizationScale) {
  return {
    ladder,
    quantizationScale,
    key: `${ladder.id}-dct-scale${quantizationScale}`,
  }
}

async function measureDctCandidate(prepared, candidate, baseCache) {
  const references = candidate.ladder.widths.map((width) => prepared.references.get(width))
  const baseWidth = candidate.ladder.widths[0]
  let baseBytes = baseCache.get(baseWidth)
  if (!baseBytes) {
    baseBytes = await encodeNative(references[0], "webp", BASE_QUALITY)
    baseCache.set(baseWidth, baseBytes)
  }
  const encodeStartedAt = performance.now()
  const encoded = await encodeDctLayeredReferences(references, {
    baseQuality: BASE_QUALITY,
    baseBytes,
    quantizationScale: candidate.quantizationScale,
    sourceSha256: prepared.sample.sourceSha256,
  })
  const encodeMs = performance.now() - encodeStartedAt
  const manifestBytes = serializeDctManifest(encoded.manifest).length
  const decodeStartedAt = performance.now()
  const decoded = await decodeDctLayeredImage(encoded)
  const decodeMs = performance.now() - decodeStartedAt
  const reconstructionMatches = decoded.every((level, index) =>
    level.data.equals(encoded.reconstructedLevels[index].data),
  )
  const finalReference = references.at(-1)
  const nativeVariants = prepared.formats[finalReference.width].native
  let cumulativeBytes = manifestBytes
  const levels = []
  for (let index = 0; index < decoded.length; index += 1) {
    cumulativeBytes += index === 0 ? encoded.baseBytes.length : encoded.layers[index - 1].length
    const current = decoded[index]
    const terminal =
      current.width === finalReference.width
        ? current
        : resizeRgbFixed(current, finalReference.width, finalReference.height)
    const terminalSsim = ssim(finalReference, terminal)
    levels.push({
      level: index,
      width: current.width,
      height: current.height,
      bytes: index === 0 ? encoded.baseBytes.length : encoded.layers[index - 1].length,
      cumulativeBytes,
      ssim: rounded(ssim(references[index], current)),
      psnr: rounded(psnr(references[index], current)),
      terminalSsim: rounded(terminalSsim),
      paretoAgainstTerminalNative:
        index < decoded.length - 1
          ? isParetoPoint(cumulativeBytes, terminalSsim, nativeVariants)
          : undefined,
    })
  }
  const totalBytes = cumulativeBytes
  const finalSsim = levels.at(-1).ssim
  const matchedNative = smallestMatchedNative(nativeVariants, finalSsim)
  const layerDescriptors = encoded.manifest.layers
  const totalLayerBytes = layerDescriptors.reduce((total, layer) => total + layer.bytes, 0)
  const totalBandSplitBytes = layerDescriptors.reduce(
    (total, layer) => total + layer.bandSplitBytes,
    0,
  )
  return {
    sampleId: prepared.sample.item.id,
    candidate: candidate.key,
    terminalWidth: finalReference.width,
    quantizationScale: candidate.quantizationScale,
    manifestBytes,
    baseBytes: encoded.baseBytes.length,
    firstRefinementBytes: encoded.layers[0].length,
    totalBytes,
    finalSsim,
    finalPsnr: levels.at(-1).psnr,
    baseShare: rounded(encoded.baseBytes.length / totalBytes),
    baseAndFirstShare: rounded(
      (encoded.baseBytes.length + encoded.layers[0].length) / totalBytes,
    ),
    matchedNative,
    matchedNativeRatio: matchedNative ? rounded(totalBytes / matchedNative.bytes) : undefined,
    monotonic: levels.every(
      (level, index) => index === 0 || level.terminalSsim + 1e-9 >= levels[index - 1].terminalSsim,
    ),
    hasIntermediateParetoPoint: levels
      .slice(0, -1)
      .some((level) => level.paretoAgainstTerminalNative),
    reconstructionMatches,
    encodeMs: rounded(encodeMs, 3),
    decodeMs: rounded(decodeMs, 3),
    bandSplitOverhead: rounded(totalBandSplitBytes / totalLayerBytes - 1),
    layers: layerDescriptors.map((layer) => ({
      level: layer.level,
      bytes: layer.bytes,
      rawBytes: layer.rawBytes,
      bandBytes: layer.bandBytes,
      bandSplitBytes: layer.bandSplitBytes,
      bandSplitOverhead: rounded(layer.bandSplitBytes / layer.bytes - 1),
    })),
    levels,
  }
}

function numericValues(results, key) {
  return results.map((result) => result[key]).filter((value) => typeof value === "number")
}

export function summarizeDctCandidate(candidate, results, expectedSamples) {
  const finalSsim = numericValues(results, "finalSsim")
  const ratios = numericValues(results, "matchedNativeRatio")
  return {
    candidate: candidate.key,
    ladder: candidate.ladder.widths,
    terminalWidth: candidate.ladder.widths.at(-1),
    quantizationScale: candidate.quantizationScale,
    expectedSamples,
    completedSamples: results.length,
    correctnessRate:
      results.length === 0
        ? 0
        : results.filter((result) => result.reconstructionMatches).length / results.length,
    finalSsimMedian: rounded(percentile(finalSsim, 0.5)),
    finalSsimP10: rounded(percentile(finalSsim, 0.1)),
    matchedNativeCoverage: results.length === 0 ? 0 : ratios.length / results.length,
    matchedNativeRatioMedian: rounded(percentile(ratios, 0.5)),
    matchedNativeRatioP75: rounded(percentile(ratios, 0.75)),
    totalBytesMedian: rounded(percentile(numericValues(results, "totalBytes"), 0.5), 0),
    baseShareMedian: rounded(percentile(numericValues(results, "baseShare"), 0.5)),
    baseAndFirstShareMedian: rounded(
      percentile(numericValues(results, "baseAndFirstShare"), 0.5),
    ),
    monotonicRate:
      results.length === 0
        ? 0
        : results.filter((result) => result.monotonic).length / results.length,
    paretoRate:
      results.length === 0
        ? 0
        : results.filter((result) => result.hasIntermediateParetoPoint).length / results.length,
    bandSplitOverheadMedian: rounded(
      percentile(numericValues(results, "bandSplitOverhead"), 0.5),
    ),
    decodeMsP75: rounded(percentile(numericValues(results, "decodeMs"), 0.75), 3),
  }
}

export function evaluateDctGate(summary) {
  const checks = {
    sampleCoverage: summary.completedSamples === summary.expectedSamples,
    correctness: summary.correctnessRate === 1,
    finalQuality: summary.finalSsimMedian >= 0.95 && summary.finalSsimP10 >= 0.93,
    matchedNativeCoverage: summary.matchedNativeCoverage === 1,
    byteOverhead:
      summary.matchedNativeRatioMedian <= 1.15 && summary.matchedNativeRatioP75 <= 1.25,
    baseBudget: summary.baseShareMedian <= 0.25,
    firstRefinementBudget: summary.baseAndFirstShareMedian <= 0.55,
    monotonicQuality: summary.monotonicRate >= 0.95,
    intermediatePareto: summary.paretoRate > 0,
  }
  const pass = Object.values(checks).every(Boolean)
  const qualityPass = checks.finalQuality && checks.correctness && checks.sampleCoverage
  const ratio = summary.matchedNativeRatioMedian ?? Number.POSITIVE_INFINITY
  return {
    pass,
    checks,
    branch: pass
      ? "browser-reconstruction"
      : qualityPass && ratio > 1.15 && ratio <= 1.5
        ? "one-bounded-optimization"
        : "stop",
  }
}

export function selectCalibratedCandidates(screening, candidates) {
  const selected = []
  for (const ladder of DEFAULT_LADDERS) {
    const summaries = screening.filter((summary) => summary.ladderId === ladder.id)
    for (const target of QUALITY_TARGETS) {
      const passing = summaries
        .filter(
          (summary) =>
            summary.finalSsimMedian >= target && summary.finalSsimP10 >= target - 0.02,
        )
        .sort(
          (left, right) =>
            (left.totalBytesMedian ?? Number.POSITIVE_INFINITY) -
            (right.totalBytesMedian ?? Number.POSITIVE_INFINITY),
        )
      const fallback = [...summaries].sort(
        (left, right) =>
          Math.abs(left.finalSsimMedian - target) - Math.abs(right.finalSsimMedian - target),
      )[0]
      const chosen = passing[0] ?? fallback
      if (!chosen) continue
      const candidate = candidates.find((entry) => entry.key === chosen.candidate)
      if (candidate && !selected.some((entry) => entry.key === candidate.key)) {
        selected.push({ ...candidate, qualityTarget: target })
      }
    }
  }
  return selected
}

function removeDominatedLayeredFive(selected, screening) {
  const four = screening.filter((summary) => summary.ladderId === "layered-4-mobile")
  const five = screening.filter((summary) => summary.ladderId === "layered-5-mobile")
  const dominated = five.length > 0 && five.every((fiveSummary) => {
    const fourSummary = four.find(
      (entry) => entry.quantizationScale === fiveSummary.quantizationScale,
    )
    return (
      fourSummary &&
      fourSummary.totalBytesMedian <= fiveSummary.totalBytesMedian &&
      fourSummary.finalSsimMedian >= fiveSummary.finalSsimMedian
    )
  })
  return {
    layeredFiveDominated: dominated,
    selected: dominated
      ? selected.filter((candidate) => candidate.ladder.id !== "layered-5-mobile")
      : selected,
  }
}

function summarizeProgressive(prepared) {
  const summaries = []
  for (const terminalWidth of [384, 512]) {
    const qualities = prepared[0].formats[terminalWidth].progressiveJpeg.map(
      (variant) => variant.quality,
    )
    for (const quality of qualities) {
      const samples = prepared.map((entry) => {
        const progressive = entry.formats[terminalWidth].progressiveJpeg.find(
          (variant) => variant.quality === quality,
        )
        const matched = smallestMatchedNative(
          entry.formats[terminalWidth].native,
          progressive.ssim,
        )
        return { progressive, matched, ratio: matched ? progressive.bytes / matched.bytes : undefined }
      })
      const ratios = samples.map((sample) => sample.ratio).filter((value) => value !== undefined)
      const ssimValues = samples.map((sample) => sample.progressive.ssim)
      const summary = {
        terminalWidth,
        quality,
        samples: samples.length,
        matchedNativeCoverage: ratios.length / samples.length,
        ssimMedian: rounded(percentile(ssimValues, 0.5)),
        ssimP10: rounded(percentile(ssimValues, 0.1)),
        bytesMedian: rounded(
          percentile(
            samples.map((sample) => sample.progressive.bytes),
            0.5,
          ),
          0,
        ),
        matchedNativeRatioMedian: rounded(percentile(ratios, 0.5)),
        matchedNativeRatioP75: rounded(percentile(ratios, 0.75)),
      }
      summary.fullByteGate =
        summary.matchedNativeCoverage === 1 &&
        summary.matchedNativeRatioMedian <= 1.15 &&
        summary.matchedNativeRatioP75 <= 1.25
      summaries.push(summary)
    }
  }
  return summaries
}

function markdownSummary(result) {
  const lines = [
    "# Representation Recovery",
    "",
    `- Generated: ${result.generatedAt}`,
    `- Snapshot: ${result.source.snapshotVersion}`,
    `- Samples: ${result.samples.successful}/${result.samples.requested}`,
    `- Progressive JPEG byte gate: **${result.progressiveJpeg.browserEligible ? "GO" : "NO-GO"}**`,
    `- DCT Representation Gate: **${result.dct.gate.pass ? "GO" : "NO-GO"}**`,
    `- DCT next branch: **${result.dct.gate.branch}**`,
    "",
    "## DCT finalists",
    "",
    "| Candidate | Ladder | Scale | SSIM median / P10 | Native ratio median / P75 | Bytes median | Band split overhead | Branch |",
    "| --- | --- | ---: | --- | --- | ---: | ---: | --- |",
  ]
  for (const entry of result.dct.gate.candidates) {
    const summary = entry.summary
    lines.push(
      `| ${summary.candidate} | ${summary.ladder.join("→")} | ${summary.quantizationScale} | ${summary.finalSsimMedian} / ${summary.finalSsimP10} | ${summary.matchedNativeRatioMedian ?? "n/a"} / ${summary.matchedNativeRatioP75 ?? "n/a"} | ${summary.totalBytesMedian} | ${summary.bandSplitOverheadMedian} | ${entry.gate.branch} |`,
    )
  }
  lines.push(
    "",
    "Timings are local Node measurements. No browser reconstruction or scheduling conclusion is implied.",
    "",
  )
  return lines.join("\n")
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await mkdir(options.output, { recursive: true })
  const rawDirectory = path.join(options.output, "sources")
  await mkdir(rawDirectory, { recursive: true })
  console.log(`[recovery] loading snapshot from ${options.baseUrl}`)
  let source
  let selectedItems
  let downloads
  if (options.samplesManifest) {
    const cached = await loadCachedSamples(options.samplesManifest, options.limit)
    source = cached.source
    selectedItems = cached.selectedItems
    downloads = cached.downloads
    console.log(`[recovery] using cached samples from ${path.resolve(options.samplesManifest)}`)
  } else {
    source = await loadSnapshot(options.baseUrl)
    selectedItems = selectAnimeSamples(source.snapshot.items, options.limit)
    downloads = await downloadSamples(selectedItems, options.baseUrl, rawDirectory)
  }
  const successful = downloads.filter((sample) => sample.ok)
  const failures = downloads.filter((sample) => !sample.ok)
  if (successful.length === 0) throw new Error("no cover samples could be downloaded")

  const prepared = []
  for (let index = 0; index < successful.length; index += 1) {
    const sample = successful[index]
    console.log(`[recovery] format baselines ${index + 1}/${successful.length}: ${sample.item.id}`)
    const sourceBytes = await readFile(sample.file)
    const references = await buildReferences(sourceBytes)
    const formats = await measureFormatBaselines(references, options)
    prepared.push({ sample, sourceBytes, references, formats })
  }

  const progressiveSummaries = summarizeProgressive(prepared)
  const progressiveJpeg = {
    browserEligible: progressiveSummaries.some((summary) => summary.fullByteGate),
    summaries: progressiveSummaries,
    capability: [
      {
        browsers: "Chrome/Edge/Firefox/Safari",
        decode: "supported without experimental flags",
        incrementalPresentation: "renderer-controlled; empirical timing required",
        applicationScanControl: false,
      },
    ],
    browserExperiment: progressiveSummaries.some((summary) => summary.fullByteGate)
      ? "required"
      : "skipped-by-byte-gate",
  }

  const allCandidates = DEFAULT_LADDERS.flatMap((ladder) =>
    options.quantizationScales.map((scale) => dctCandidate(ladder, scale)),
  )
  const screeningIndices = spacedIndices(
    prepared.length,
    Math.min(options.screeningLimit, prepared.length),
  )
  const resultsByCandidate = new Map(allCandidates.map((candidate) => [candidate.key, []]))
  console.log(
    `[recovery] screening ${allCandidates.length} DCT candidates on ${screeningIndices.length} samples`,
  )
  for (const index of screeningIndices) {
    const baseCache = new Map()
    for (const candidate of allCandidates) {
      resultsByCandidate
        .get(candidate.key)
        .push(await measureDctCandidate(prepared[index], candidate, baseCache))
    }
    console.log(`[recovery] DCT screening sample complete: ${prepared[index].sample.item.id}`)
  }
  const screening = allCandidates.map((candidate) => ({
    ladderId: candidate.ladder.id,
    ...summarizeDctCandidate(
      candidate,
      resultsByCandidate.get(candidate.key),
      screeningIndices.length,
    ),
  }))
  const calibrated = selectCalibratedCandidates(screening, allCandidates)
  const dominance = removeDominatedLayeredFive(calibrated, screening)
  const finalists = dominance.selected
  const screeningSet = new Set(screeningIndices)
  console.log(`[recovery] validating ${finalists.length} DCT finalists on ${prepared.length} samples`)
  for (let index = 0; index < prepared.length; index += 1) {
    if (screeningSet.has(index)) continue
    const baseCache = new Map()
    for (const candidate of finalists) {
      resultsByCandidate
        .get(candidate.key)
        .push(await measureDctCandidate(prepared[index], candidate, baseCache))
    }
    console.log(`[recovery] DCT finalist sample complete: ${index + 1}/${prepared.length}`)
  }
  const gateCandidates = finalists.map((candidate) => {
    const summary = summarizeDctCandidate(
      candidate,
      resultsByCandidate.get(candidate.key),
      successful.length,
    )
    return { summary, gate: evaluateDctGate(summary) }
  })
  const gate = {
    pass: gateCandidates.some((entry) => entry.gate.pass),
    branch: gateCandidates.some((entry) => entry.gate.pass)
      ? "browser-reconstruction"
      : gateCandidates.some((entry) => entry.gate.branch === "one-bounded-optimization")
        ? "one-bounded-optimization"
        : "stop",
    candidates: gateCandidates,
  }

  const result = {
    generatedAt: new Date().toISOString(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch, sharp: sharp.versions },
    source: {
      pointerUrl: source.pointerUrl,
      snapshotUrl: source.snapshotUrl,
      snapshotVersion: source.pointer.version,
      snapshotUpdatedAt: source.pointer.updatedAt,
    },
    configuration: { ...options, output: undefined, baseQuality: BASE_QUALITY, qualityTargets: QUALITY_TARGETS, ladders: DEFAULT_LADDERS },
    samples: { requested: selectedItems.length, successful: successful.length, failures },
    progressiveJpeg,
    dct: {
      layeredFiveDominated: dominance.layeredFiveDominated,
      screening,
      finalists: finalists.map((candidate) => ({ key: candidate.key, qualityTarget: candidate.qualityTarget })),
      candidateResults: Object.fromEntries(
        finalists.map((candidate) => [candidate.key, resultsByCandidate.get(candidate.key)]),
      ),
      gate,
    },
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
    progressiveJpeg: result.progressiveJpeg,
    dct: {
      layeredFiveDominated: result.dct.layeredFiveDominated,
      screening: result.dct.screening,
      finalists: result.dct.finalists,
      gate: result.dct.gate,
    },
  }
  await writeFile(path.join(options.output, "result.json"), `${JSON.stringify(result, null, 2)}\n`)
  await writeFile(path.join(options.output, "aggregate.json"), `${JSON.stringify(aggregate, null, 2)}\n`)
  await writeFile(path.join(options.output, "summary.md"), markdownSummary(result))
  console.log(`[recovery] Progressive JPEG byte gate: ${progressiveJpeg.browserEligible ? "GO" : "NO-GO"}`)
  console.log(`[recovery] DCT Gate: ${gate.pass ? "GO" : "NO-GO"} (${gate.branch})`)
  console.log(`[recovery] results: ${options.output}`)
}

const isMain =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isMain) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
