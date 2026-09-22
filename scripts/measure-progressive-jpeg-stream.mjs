import { createServer } from "node:http"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"
import sharp from "sharp"
import { CdpClient, parseNestedJson, runAgent } from "./measure-image-loading.mjs"
import { percentile } from "./analyze-layered-images.mjs"
import { decodeRgb, resizeSourceRgb, sha256, ssim } from "./image-layering-codec.mjs"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const browserPaths = {
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  edge: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
}

// End each chunk after the following SOS header, so the previous scan is complete.
export function splitProgressiveJpegScans(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("invalid JPEG SOI")
  const starts = []
  let offset = 2
  let progressive = false
  let ended = false
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) throw new Error("invalid JPEG marker")
    while (bytes[offset] === 0xff) offset++
    const marker = bytes[offset++]
    if (marker === 0xd9) {
      ended = true
      break
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > bytes.length) throw new Error("truncated JPEG segment")
    const length = bytes.readUInt16BE(offset)
    if (length < 2 || offset + length > bytes.length) throw new Error("invalid JPEG segment")
    if (marker === 0xc2) progressive = true
    offset += length
    if (marker !== 0xda) continue
    starts.push(offset)
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++
        continue
      }
      let next = offset + 1
      while (bytes[next] === 0xff) next++
      if (bytes[next] === 0 || (bytes[next] >= 0xd0 && bytes[next] <= 0xd7)) {
        offset = next + 1
      } else break
    }
  }
  if (!ended || offset !== bytes.length) throw new Error("missing EOI or trailing JPEG data")
  if (!progressive || starts.length < 2) throw new Error("not a multi-scan progressive JPEG")
  let start = 0
  return [...starts.slice(1), bytes.length].map((end) => {
    const chunk = bytes.subarray(start, end)
    start = end
    return chunk
  })
}

export function summarizeTimeline(frames, loadMs) {
  const ordered = [...frames].sort((a, b) => a.timeMs - b.timeMs)
  const visible = ordered.filter((frame) => frame.changed)
  const firstAt = (threshold) => visible.find((frame) => frame.ssim >= threshold)?.timeMs ?? null
  const preLoad = ordered.filter((frame) => frame.timeMs < loadMs)
  // Left-hold integration: do not award unobserved quality between captures.
  let integral = 0
  let lastTime = 0
  let lastQuality = 0
  for (const frame of preLoad) {
    integral += (frame.timeMs - lastTime) * lastQuality
    lastTime = frame.timeMs
    lastQuality = frame.changed ? Math.max(0, frame.ssim) : 0
  }
  integral += Math.max(0, loadMs - lastTime) * lastQuality
  const final = ordered.at(-1)
  return {
    timeToRecognizableMs: firstAt(0.5),
    tq80Ms: firstAt(0.8),
    finalCompleteMs: loadMs,
    finalVisibleMs: visible.find((frame) => frame.pixelHash === final?.pixelHash)?.timeMs ?? null,
    finalSsim: final?.ssim,
    qualityIntegral: loadMs > 0 ? integral / loadMs : 0,
    preLoadPaintStages: new Set(preLoad.filter((frame) => frame.changed).map((frame) => frame.pixelHash)).size,
    maxCaptureGapMs: Math.max(0, ...ordered.slice(1).map((frame, i) => frame.timeMs - ordered[i].timeMs)),
  }
}

function parseArgs(argv) {
  const values = Object.fromEntries(argv.map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=")
    return [key, rest.join("=")]
  }))
  if (!values["samples-manifest"] || !values["gate-result"]) {
    throw new Error("--samples-manifest and --gate-result are required")
  }
  const positive = (key, fallback) => {
    const value = Number(values[key] ?? fallback)
    if (!Number.isInteger(value) || value < 1) throw new Error("--" + key + " must be positive")
    return value
  }
  const browser = values.browser ?? "chrome"
  if (!browserPaths[browser] && !values["browser-path"]) throw new Error("unsupported browser")
  return {
    samplesManifest: path.resolve(values["samples-manifest"]),
    gateResult: path.resolve(values["gate-result"]),
    browser, browserPath: values["browser-path"] ?? browserPaths[browser],
    limit: positive("limit", 10), runs: positive("runs", 3),
    quality: positive("quality", 40),
    scanIntervalMs: positive("scan-interval-ms", 250),
    captureIntervalMs: positive("capture-interval-ms", 100),
    output: values.output ?? path.join(tmpdir(), "nothing-new-progressive-stream-" + browser + "-" + Date.now()),
  }
}

function summarize(samples) {
  return [384, 512].map((width) => {
    const group = samples.filter((entry) => entry.width === width)
    const median = (key) => percentile(group.map((entry) => entry.metrics[key]).filter(Number.isFinite), 0.5)
    return {
      width, runs: group.length, sampleCount: new Set(group.map((entry) => entry.sampleId)).size,
      timeToRecognizableMedianMs: median("timeToRecognizableMs"),
      tq80MedianMs: median("tq80Ms"),
      loadMedianMs: median("finalCompleteMs"),
      finalVisibleMedianMs: median("finalVisibleMs"),
      qualityIntegralMedian: median("qualityIntegral"),
      finalSsimMedian: median("finalSsim"),
      preLoadPaintStagesMedian: median("preLoadPaintStages"),
      incrementalRuns: group.filter((entry) => entry.metrics.preLoadPaintStages >= 2).length,
      tq80Missing: group.filter((entry) => entry.metrics.tq80Ms === null).length,
      maxCaptureGapMs: Math.max(0, ...group.map((entry) => entry.metrics.maxCaptureGapMs)),
    }
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const gate = JSON.parse(await readFile(options.gateResult, "utf8"))
  const allowed = [384, 512].filter((width) => gate.progressiveJpeg.summaries.some(
    (entry) => entry.terminalWidth === width && entry.quality === options.quality && entry.fullByteGate,
  ))
  if (!allowed.length || gate.samples.successful !== 100 || !gate.progressiveJpeg.browserEligible) {
    throw new Error("a completed 100-image full-byte Gate is required")
  }
  const manifest = JSON.parse(await readFile(options.samplesManifest, "utf8"))
  if (manifest.snapshot !== gate.source.snapshotUrl) throw new Error("Gate/sample snapshot mismatch")
  const count = Math.min(options.limit, manifest.samples.length)
  const indices = Array.from({ length: count }, (_, i) => count === 1 ? 0 : Math.round(i * (manifest.samples.length - 1) / (count - 1)))
  await mkdir(options.output)
  const jobs = new Map()
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1")
    if (url.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" })
      response.end('<!doctype html><title>Progressive JPEG Lab</title><style>html,body{margin:0;background:#888;overflow:hidden}img{display:block}</style><img id="cover"><script>window.lab={ready:true}</script>')
      return
    }
    const job = jobs.get(url.searchParams.get("id"))
    if (!job) { response.writeHead(404).end(); return }
    response.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store", "Transfer-Encoding": "chunked" })
    response.flushHeaders()
    job.requestStart = performance.now()
    await sleep(200)
    for (const [index, chunk] of job.chunks.entries()) {
      if (index) await sleep(options.scanIntervalMs)
      if (response.destroyed) return
      response.write(chunk)
      job.sent.push({ scan: index, bytes: chunk.length, timeMs: performance.now() - job.requestStart })
    }
    response.end()
    job.bodyCompleteMs = performance.now() - job.requestStart
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const origin = "http://127.0.0.1:" + server.address().port
  const session = "jpeg-" + options.browser + "-" + process.pid + "-" + Date.now()
  const samples = []
  let cdp
  let browserVersion
  try {
    await runAgent(session, ["--executable-path", options.browserPath, "--args", "--force-color-profile=srgb", "open", origin])
    await runAgent(session, ["snapshot", "-i"])
    const cdpInfo = parseNestedJson(await runAgent(session, ["get", "cdp-url", "--json"]))
    cdp = new CdpClient(cdpInfo.data.cdpUrl)
    await cdp.connect()
    browserVersion = await cdp.send("Browser.getVersion")
    const { targetInfos } = await cdp.send("Target.getTargets")
    const target = targetInfos.find((entry) => entry.type === "page" && entry.url.startsWith(origin))
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true })
    const send = (method, params = {}) => cdp.send(method, params, sessionId)
    const evaluate = async (expression) => {
      const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
      return response.result.value
    }
    await send("Network.enable")
    await send("Network.setCacheDisabled", { cacheDisabled: true })
    await send("Network.clearBrowserCache")
    for (const width of allowed) {
      for (const index of indices) {
        const sample = manifest.samples[index]
        if (!sample.ok) throw new Error("source sample failed: " + sample.item.id)
        const file = path.join(path.dirname(options.samplesManifest), "sources", String(index).padStart(3, "0") + "-" + sample.item.id + "-" + sample.sourceSha256.slice(0, 12) + ".bin")
        const source = await readFile(file)
        if (sha256(source) !== sample.sourceSha256) throw new Error("source checksum mismatch")
        const reference = await resizeSourceRgb(source, width)
        const jpeg = await sharp(reference.data, { raw: { width, height: reference.height, channels: 3 } })
          .jpeg({ quality: options.quality, progressive: true, mozjpeg: true }).toBuffer()
        const chunks = splitProgressiveJpegScans(jpeg)
        const offlineSsim = ssim(reference, await decodeRgb(jpeg))
        for (let run = 1; run <= options.runs; run++) {
          const id = sample.item.id + "-" + width + "-" + run
          console.log("[jpeg-stream] " + options.browser + " " + id)
          await send("Emulation.setDeviceMetricsOverride", { width, height: reference.height, deviceScaleFactor: 1, mobile: false })
          await send("Page.navigate", { url: origin + "/?id=" + id })
          for (let attempt = 0; ; attempt++) {
            if (await evaluate("Boolean(window.lab?.ready && location.search === '?id=" + id + "')")) break
            if (attempt > 100) throw new Error("page readiness timeout")
            await sleep(20)
          }
          const capture = async () => {
            const { data } = await send("Page.captureScreenshot", {
              format: "png", captureBeyondViewport: false,
              clip: { x: 0, y: 0, width, height: reference.height, scale: 1 },
            })
            return Buffer.from(data, "base64")
          }
          const blankHash = sha256((await decodeRgb(await capture())).data)
          const job = { chunks, sent: [] }
          jobs.set(id, job)
          await evaluate("window.lab={start:performance.now()};cover.width=" + width + ";cover.height=" + reference.height + ";cover.onload=()=>lab.load=performance.now()-lab.start;cover.onerror=()=>lab.error=true;cover.src='/image?id=" + id + "'")
          const frames = []
          let state
          for (let frame = 0; ; frame++) {
            const before = await evaluate("performance.now()-lab.start")
            const png = await capture()
            state = await evaluate("({time:performance.now()-lab.start,load:lab.load,error:lab.error})")
            if (state.error || state.time > 15_000) throw new Error("image failure or 15s timeout")
            const pixels = await decodeRgb(png)
            const pixelHash = sha256(pixels.data)
            const filename = id + "-frame-" + String(frame).padStart(3, "0") + ".png"
            await writeFile(path.join(options.output, filename), png, { flag: "wx" })
            frames.push({
              timeMs: (before + state.time) / 2, captureWindowMs: state.time - before,
              ssim: ssim(reference, pixels), pixelHash, changed: pixelHash !== blankHash, screenshot: filename,
            })
            if (state.load !== undefined && state.time >= state.load + 400) break
            await sleep(options.captureIntervalMs)
          }
          const result = {
            sampleId: sample.item.id, width, height: reference.height, run,
            sourceSha256: sample.sourceSha256, quality: options.quality, jpegBytes: jpeg.length,
            scanCount: chunks.length, sent: job.sent, bodyCompleteMs: job.bodyCompleteMs, frames,
            offlineSsim, metrics: summarizeTimeline(frames, state.load),
          }
          result.finalSsimDifference = Math.abs(result.metrics.finalSsim - offlineSsim)
          samples.push(result)
          jobs.delete(id)
          await writeFile(path.join(options.output, "raw.json"), JSON.stringify({ browserVersion, configuration: options, samples }, null, 2))
        }
      }
    }
  } finally {
    cdp?.close()
    await runAgent(session, ["close"]).catch(() => undefined)
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
  const result = {
    generatedAt: new Date().toISOString(), browser: options.browser, browserVersion,
    source: gate.source, configuration: options,
    definitions: {
      timeToRecognizable: "first changed screenshot with SSIM >= 0.50; heuristic, not a human recognition test",
      tq80: "first changed screenshot with SSIM >= 0.80 against original reference",
      qualityIntegral: "left-hold SSIM integral from img.src assignment to load, divided by load duration; blank quality is zero",
      timing: "headless DPR1; 200ms initial delay; 250ms between complete scan chunks; screenshot observation windows retained",
    },
    summaries: summarize(samples),
    maxFinalSsimDifference: Math.max(...samples.map((entry) => entry.finalSsimDifference)),
    applicationScanControl: false,
  }
  await writeFile(path.join(options.output, "aggregate.json"), JSON.stringify(result, null, 2), { flag: "wx" })
  console.log("[jpeg-stream] " + path.join(options.output, "aggregate.json"))
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(error); process.exitCode = 1 })
}
