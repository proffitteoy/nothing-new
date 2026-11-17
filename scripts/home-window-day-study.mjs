// Acceptance-only daylight study. Bundled into the ignored evidence directory,
// injected into the real homepage by home-scene-preview.py; never imported by app/.
// The photograph is substituted at the request boundary, preserving the actual
// Image loading/error handlers and Splash readiness contract.
import { createSpectralTracerController } from "../components/field/SpectralTracerLayer"
import {
  sampleSpectralScene,
  createHomeSpectralLight,
  HOME_MOUNTAIN_PROFILE,
  HOME_SHORELINE,
  HOME_NEAR_SHORE,
} from "../components/field/homeSpectralScene"
import { SPECTRAL_PLAYBACK_RATE } from "../components/field/spectralField"
const DAY_WIDTH = 1672
const DAY_HEIGHT = 877

const DAY_CSS = `
/* Review-only isolation. All artwork and palette come from production. */
[data-home-day-study] [data-home-viewport] > :not([data-home-artwork]):not(:last-child):not([data-day-canvas]) { visibility:hidden; }
[data-home-day-study] [data-home-artwork] { opacity:1 !important; }
[data-home-day-study] [data-day-canvas] { visibility:visible;opacity:1;z-index:3; }
[data-home-day-study] [data-day-canvas][hidden] { display:none; }
`

window.startDayWindowStudy = async () => {
  window.__dayWindowStudy?.destroy()
  const stage = document.querySelector("[data-home-scene]")
  const opening = document.querySelector("[data-home-viewport]")
  if (!stage || !opening) return null // Mobile redirect never mounts a desktop study.
  const source = opening.querySelector("[data-home-artwork] img")
  const style = document.createElement("style")
  style.dataset.homeDayStyle = ""
  style.textContent = DAY_CSS
  document.head.append(style)
  stage.dataset.homeDayStudy = "static"
  const notice = stage.querySelector("[data-home-sill] > a")
  const previousNotice = notice.getAttribute("href")
  notice.href = "/home-window/NOTICE-day-study.txt"
  const metadata = {
    plate: { width: DAY_WIDTH, height: DAY_HEIGHT },
    shoreline: HOME_SHORELINE,
    nearShore: HOME_NEAR_SHORE,
    ridge: HOME_MOUNTAIN_PROFILE,
    sourceReady: source.complete && source.naturalWidth === DAY_WIDTH,
  }
  const unmount = new MutationObserver(() => {
    if (!stage.isConnected) study.destroy()
  })
  unmount.observe(document.body, { childList: true, subtree: true })
  let disposed = false
  const study = {
    metadata,
    destroy() {
      if (disposed) return
      disposed = true
      unmount.disconnect()
      style.remove()
      delete stage.dataset.homeDayStudy
      notice.setAttribute("href", previousNotice)
      if (window.__dayWindowStudy === study) delete window.__dayWindowStudy
    },
  }
  window.__dayWindowStudy = study
  return metadata
}

// Both outputs read the SAME two tracer buffers on the host's existing frame.
// There is no additional RAF, eigenmode clock, noise source or production API.
window.startDaySpectralComparison = async (variant = "corrected") => {
  await window.startDayWindowStudy()
  const study = window.__dayWindowStudy
  if (!study) return null
  const stage = document.querySelector("[data-home-scene]")
  const opening = document.querySelector("[data-home-viewport]")
  const source = opening.querySelector("[data-home-artwork] img")
  const metadata = study.metadata
  metadata.spectral = {
    colours: [
      [55, 104, 194],
      [112, 75, 188],
      [184, 84, 151],
    ],
    backgroundAlpha: 0.24,
    foregroundAlpha: 0.42,
    motion: "ambient",
    modeCount: 6,
  }
  if (!metadata.sourceReady) {
    metadata.fallback = "image-error"
    return metadata
  }
  const back = document.createElement("canvas")
  const front = document.createElement("canvas")
  const outputs = ["before", "corrected"].map((name) => {
    const canvas = document.createElement("canvas")
    canvas.dataset.dayCanvas = name
    canvas.setAttribute("aria-hidden", "true")
    canvas.hidden = true
    opening.insertBefore(canvas, opening.lastElementChild)
    return { name, canvas, ctx: canvas.getContext("2d", { alpha: false }) }
  })
  const light = createHomeSpectralLight()
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  let tracers = null
  let width = 0,
    height = 0,
    ratio = 0,
    rect,
    sky,
    lake,
    grid
  let sampledAt = -Infinity
  let frozen = false,
    destroyed = false,
    selected = { a: "corrected", b: "before" }[variant] || variant
  let recordings = []
  const stats = {
    frames: 0,
    totalMs: 0,
    maxMs: 0,
    beforeMs: 0,
    correctedMs: 0,
    fieldTime: 0,
    bufferBytes: 0,
    hostBufferBytes: 0,
    decodedPlateBytes: DAY_WIDTH * DAY_HEIGHT * 4,
    densityMax: 0,
    envelopeMin: 0,
    envelopeMax: 0,
    coreFraction: 0,
    gridTime: 0,
  }
  const resources = [back, front, ...outputs.map((o) => o.canvas)]
  const syncVisibility = () => {
    for (const o of outputs) o.canvas.hidden = reduced.matches || !tracers || o.name !== selected
    stage.dataset.homeDayStudy = reduced.matches || !tracers ? "static" : selected
  }
  const release = () => {
    for (const r of recordings) {
      if (r.recorder.state !== "inactive") r.recorder.stop()
      r.stream.getTracks().forEach((track) => track.stop())
    }
    recordings = []
    light?.release()
    tracers?.destroy()
    tracers = null
    for (const c of resources) c.width = c.height = 0
    stats.bufferBytes = 0
    width = height = ratio = 0
    grid = undefined
    sampledAt = -Infinity
    syncVisibility()
  }
  const resize = () => {
    const contextsReady = outputs.every((o) => o.ctx) && light
    if (destroyed || reduced.matches || stage.dataset.homeQuality === "static" || !contextsReady) {
      if (!contextsReady) metadata.fallback = "canvas-unavailable"
      release()
      return false
    }
    const w = opening.clientWidth,
      h = opening.clientHeight
    const dpr = Math.min(devicePixelRatio || 1, stage.dataset.homeQuality === "high" ? 1.5 : 1)
    if (width === w && height === h && ratio === dpr) return true
    width = w
    height = h
    ratio = dpr
    tracers ??= createSpectralTracerController(back, front)
    if (!tracers) {
      metadata.fallback = "canvas-unavailable"
      release()
      return false
    }
    tracers.resize(width, height, ratio)
    for (const { canvas } of outputs) {
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
    }
    const scale = Math.max((width + 48) / DAY_WIDTH, (height + 48) / DAY_HEIGHT)
    rect = {
      x: (width - DAY_WIDTH * scale) / 2,
      y: (height - DAY_HEIGHT * scale) / 2,
      width: DAY_WIDTH * scale,
      height: DAY_HEIGHT * scale,
    }
    sky = new Path2D()
    sky.moveTo(-48, -48)
    sky.lineTo(width + 48, -48)
    for (const [x, y] of [...metadata.ridge].reverse())
      sky.lineTo(rect.x + x * rect.width, rect.y + y * rect.height)
    sky.closePath()
    lake = new Path2D()
    metadata.shoreline.forEach(([x, y], i) => {
      const px = rect.x + x * rect.width,
        py = rect.y + y * rect.height
      if (i) lake.lineTo(px, py)
      else lake.moveTo(px, py)
    })
    lake.lineTo(width + 48, height + 48)
    lake.lineTo(-48, height + 48)
    lake.closePath()
    // Even-odd clipping excludes the already accepted near-shore rocks.
    metadata.nearShore.forEach(([x, y], i) => {
      const px = rect.x + x * rect.width,
        py = rect.y + y * rect.height
      if (i) lake.lineTo(px, py)
      else lake.moveTo(px, py)
    })
    lake.closePath()
    grid = undefined
    sampledAt = -Infinity
    stats.bufferBytes = resources.reduce((n, c) => n + c.width * c.height * 4, 0)
    delete metadata.fallback
    syncVisibility()
    return true
  }
  const compose = (output, time, low) => {
    const { ctx } = output
    const began = performance.now()
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
    // Opaque destination: multiply really interacts with the daylight image,
    // rather than multiplying against an empty transparent intermediate.
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height)
    if (output.name === "before") {
      ctx.save()
      ctx.clip(sky)
      ctx.globalAlpha = metadata.spectral.backgroundAlpha
      ctx.drawImage(back, 0, 0, width, height)
      ctx.globalAlpha = metadata.spectral.foregroundAlpha
      ctx.drawImage(front, 0, 0, width, height)
      ctx.restore()
    } else {
      light.render(ctx, back, front, grid, width, height, time, low, { x: 0, y: 0 })
      Object.assign(stats, light.stats)
    }
    stats[output.name + "Ms"] += performance.now() - began
  }
  const draw = () => {
    if (destroyed || frozen || document.hidden || reduced.matches) return
    if (stage.dataset.homeQuality === "static") {
      metadata.fallback = "host-static"
      release()
      return
    }
    if (!resize()) return
    const began = performance.now()
    const time = Number(stage.dataset.homeFieldTime || 0)
    const low = stage.dataset.homeQuality !== "high"
    tracers.render({
      alpha: 1.25,
      motion: "ambient",
      time,
      backgroundCount: low ? 1800 : 3200,
      foregroundCount: low ? 64 : 120,
      trailSamples: 8,
      modeCount: 6,
      width,
      height,
      obstacles: [],
      colours: metadata.spectral.colours,
    })
    if (!grid || time - sampledAt >= SPECTRAL_PLAYBACK_RATE / (low ? 6 : 12)) {
      const cols = low ? 8 : 16,
        rows = low ? 5 : 9
      grid = sampleSpectralScene(
        width,
        height,
        time,
        cols,
        rows,
        grid?.values.length === cols * rows * 3 ? grid.values : undefined,
      )
      sampledAt = time
    }
    // Alternate order to avoid giving one mode a systematic warm-cache advantage.
    for (const output of stats.frames % 2 ? [...outputs].reverse() : outputs)
      compose(output, time, low)
    for (const r of recordings) r.stream.getVideoTracks()[0]?.requestFrame()
    const cost = performance.now() - began
    stats.frames++
    stats.fieldTime = time
    stats.totalMs += cost
    stats.maxMs = Math.max(stats.maxMs, cost)
    stats.bufferBytes =
      resources.reduce((n, c) => n + c.width * c.height * 4, 0) + (light?.bufferBytes || 0)
    stats.hostBufferBytes = Number(stage.dataset.homeBufferBytes || 0)
  }
  const observer = new MutationObserver(draw)
  observer.observe(stage, {
    attributes: true,
    attributeFilter: ["data-home-frames", "data-home-quality"],
  })
  const resizer = new ResizeObserver(() => {
    if (!frozen && resize()) draw()
  })
  resizer.observe(opening)
  const motionChanged = () => {
    if (reduced.matches) release()
    else draw()
  }
  reduced.addEventListener("change", motionChanged)
  const oldDestroy = study.destroy
  const onKey = (event) => {
    if (
      event.target.closest("input,textarea,select,[contenteditable],dialog") ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return
    if (["r", "o", "0"].includes(event.key.toLowerCase()))
      study.setVariant(
        event.key === "0" ? "none" : event.key.toLowerCase() === "r" ? "corrected" : "before",
      )
  }
  document.addEventListener("keydown", onKey)
  Object.assign(study, {
    stats,
    setVariant(name) {
      name = { a: "corrected", b: "before" }[name] || name
      if (!["before", "corrected", "none"].includes(name)) throw new Error("Unknown study variant")
      selected = name
      syncVisibility()
      return { variant: name, fieldTime: stats.fieldTime, frames: stats.frames }
    },
    freeze() {
      frozen = true
      return { ...stats }
    },
    resume() {
      frozen = false
      draw()
    },
    inspect() {
      if (!tracers) return { fallback: metadata.fallback || "static" }
      // Read a disposable CPU copy. Repeated getImageData on the live tracer
      // contexts can migrate Chromium GPU backing and round premultiplied
      // colours, making the diagnostic itself alter the buffer under test.
      const pixels = (canvas) => {
        const probe = document.createElement("canvas")
        probe.width = canvas.width
        probe.height = canvas.height
        const ctx = probe.getContext("2d", { willReadFrequently: true })
        ctx.drawImage(canvas, 0, 0)
        const data = ctx.getImageData(0, 0, probe.width, probe.height)
        probe.width = probe.height = 0
        return data
      }
      const a = pixels(outputs[0].canvas)
      const b = pixels(outputs[1].canvas)
      let changedSky = 0,
        changedLake = 0,
        changedProtected = 0
      const allowed = (px, py) =>
        outputs[0].ctx.isPointInPath(sky, px, py) ||
        outputs[0].ctx.isPointInPath(lake, px, py, "evenodd")
      // Only sky and lake may change; the mountain and near-shore plate remain
      // anchors. Leave 3 CSS px at anti-aliased boundaries for this diagnostic.
      for (let y = 0; y < a.height; y += 3)
        for (let x = 0; x < a.width; x += 3) {
          const i = (y * a.width + x) * 4
          if (
            a.data[i] === b.data[i] &&
            a.data[i + 1] === b.data[i + 1] &&
            a.data[i + 2] === b.data[i + 2]
          )
            continue
          const px = x + 0.5,
            py = y + 0.5
          if (outputs[0].ctx.isPointInPath(sky, px, py)) changedSky++
          else if (outputs[0].ctx.isPointInPath(lake, px, py, "evenodd")) changedLake++
          else if (
            ![-3, 0, 3].some((dx) =>
              [-3, 0, 3].some((dy) => allowed(px + dx * ratio, py + dy * ratio)),
            )
          )
            changedProtected++
        }
      const hash = (canvas) => {
        const bytes = pixels(canvas).data
        let h = 2166136261
        for (const byte of bytes) h = Math.imul(h ^ byte, 16777619)
        return (h >>> 0).toString(16)
      }
      return {
        fieldTime: stats.fieldTime,
        frames: stats.frames,
        backHash: hash(back),
        frontHash: hash(front),
        changedSky,
        changedLake,
        changedProtected,
      }
    },
    startRecording() {
      if (!tracers || recordings.length) throw new Error("Study is not ready for recording")
      recordings = outputs.map(({ name, canvas }) => {
        const stream = canvas.captureStream(0)
        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp8",
          videoBitsPerSecond: 3_000_000,
        })
        const chunks = []
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data)
        }
        recorder.start()
        return { name, stream, recorder, chunks }
      })
      return {
        fieldTime: stats.fieldTime,
        recording: "both glass canvases, same frame buffers, real clock",
      }
    },
    async stopRecording() {
      const active = recordings
      recordings = []
      return Promise.all(
        active.map(
          (r) =>
            new Promise((resolve) => {
              r.recorder.onstop = async () => {
                r.stream.getTracks().forEach((track) => track.stop())
                const blob = new Blob(r.chunks, { type: r.recorder.mimeType })
                const reader = new FileReader()
                reader.onload = () =>
                  resolve({ name: r.name, data: reader.result, bytes: blob.size })
                reader.readAsDataURL(blob)
              }
              r.recorder.stop()
            }),
        ),
      )
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      observer.disconnect()
      resizer.disconnect()
      reduced.removeEventListener("change", motionChanged)
      document.removeEventListener("keydown", onKey)
      release()
      outputs.forEach((o) => o.canvas.remove())
      oldDestroy()
    },
  })
  draw()
  return metadata
}
