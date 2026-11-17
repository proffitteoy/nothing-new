// Acceptance-only daylight study. Bundled into the ignored evidence directory,
// injected into the real homepage by home-scene-preview.py; never imported by app/.
// The photograph is substituted at the request boundary, preserving the actual
// Image loading/error handlers and Splash readiness contract.
import { createSpectralTracerController } from "../components/field/SpectralTracerLayer"
const DAY_WIDTH = 1672
const DAY_HEIGHT = 877

// Manually re-marked against convict-lake-day-study.webp, not the night plate.
// The 4px sky inset protects small snow/branch details at the silhouette.
const DAY_RIDGE = [
  [0, 50],
  [27, 46],
  [52, 102],
  [56, 142],
  [78, 182],
  [80, 222],
  [105, 242],
  [111, 286],
  [150, 300],
  [196, 324],
  [226, 304],
  [253, 285],
  [282, 274],
  [310, 265],
  [342, 246],
  [370, 242],
  [398, 228],
  [421, 232],
  [442, 239],
  [456, 258],
  [487, 250],
  [513, 260],
  [538, 277],
  [560, 290],
  [579, 288],
  [604, 312],
  [631, 322],
  [660, 340],
  [681, 362],
  [707, 382],
  [729, 400],
  [750, 398],
  [778, 423],
  [806, 411],
  [825, 401],
  [846, 402],
  [869, 397],
  [894, 384],
  [917, 382],
  [947, 368],
  [970, 361],
  [994, 372],
  [1015, 364],
  [1041, 346],
  [1068, 336],
  [1091, 314],
  [1115, 306],
  [1142, 305],
  [1162, 295],
  [1185, 279],
  [1206, 283],
  [1229, 280],
  [1252, 285],
  [1277, 286],
  [1302, 297],
  [1335, 302],
  [1358, 304],
  [1386, 302],
  [1414, 308],
  [1441, 302],
  [1464, 273],
  [1487, 260],
  [1511, 245],
  [1535, 237],
  [1562, 245],
  [1582, 259],
  [1603, 231],
  [1626, 218],
  [1650, 194],
  [1672, 174],
]
const DAY_SHORE = [
  [0, 579],
  [103, 558],
  [252, 552],
  [459, 549],
  [802, 548],
  [1118, 545],
  [1414, 546],
  [1672, 544],
]
const DAY_NEAR_SHORE = [
  [0, 681],
  [25, 679],
  [63, 696],
  [83, 726],
  [112, 755],
  [106, 799],
  [90, 844],
  [100, 877],
  [0, 877],
]

const DAY_CSS = `
[data-home-day-study] {
  --site-bg:#d9e1e7; --site-surface:#f0f4f7; --site-recess:#dce5ec;
  --site-ink:#243a4d; --site-muted:#526b7e; --site-accent:#225d94;
  --site-detail:#a34479; --site-violet:#6551a3; --site-mint:#29796d;
  --site-line:#a1b4c4; --site-glass:rgb(235 242 247 / 96%);
  --site-wash:rgb(34 93 148 / 10%);
  color-scheme:light;
  background:linear-gradient(90deg,#dce4ea,#eaf0f4 8%,#cbd6df 16%,#cbd6df 84%,#e3eaf0 92%,#d6e0e7);
}
[data-home-day-study] [data-home-window] {
  background:linear-gradient(90deg,#aebfcd,#e4edf3 3px,#7f96a9 9px,#a6b7c5 calc(100% - 8px),#cfdde7 calc(100% - 3px),#8199ac);
  border-top-color:#f6fafc;
  box-shadow:0 12px 38px #263c502e,0 0 0 1px #95aabd,inset 0 10px 12px #566e8140;
}
[data-home-day-study] [data-home-viewport] {
  background:#91bbd4;
  box-shadow:0 0 0 1px #f1f7fb99,0 0 18px #ffffff30;
}
[data-home-day-study] [data-home-viewport] > :not([data-home-artwork]):not(:last-child) {
  visibility:hidden;
}
[data-home-day-study] [data-home-artwork] {
  opacity:1 !important;
  background:linear-gradient(#8cbde1,#d2e6ef 62%,#50849a 63%,#24546c);
}
[data-home-day-study] [data-home-artwork]::before { background:#6b879c; }
[data-home-day-study] [data-home-viewport] > :last-child {
  background:linear-gradient(110deg,#ffffff08,transparent 38%,#ffffff08 47%,transparent 58%);
  box-shadow:inset 0 0 26px #2a486a30,inset 1px 1px 2px #ffffffb3;
}
[data-home-day-study] [data-home-sill] {
  background:linear-gradient(#eaf2f7,#b9cad8 3px,#b1c3d1 20px,#d0dce5 45%,#a9bdcd);
  border-top-color:#ffffffb3; border-bottom-color:#8da6ba;
  box-shadow:0 26px 35px #233e5429,0 2px 0 #bccdda,inset 0 12px 22px #ffffff33;
}
[data-home-day-study] [data-home-sill]::before { background:linear-gradient(#7690a5,#dbe8f1); }
[data-home-day-study] [data-edge-trigger] { color:#3c566b; text-shadow:none; }
[data-home-day-study] [data-edge-trigger]:is(:hover,:focus-visible,[aria-expanded=true]) {
  color:#173c5a; background:linear-gradient(90deg,transparent,#ffffff48,transparent); text-shadow:none;
}
[data-home-day-study] [data-home-music] [aria-label="当前歌词"] p {
  text-shadow:0 1px 6px #f4f8fbc9,0 0 16px #f4f8fba6;
}
[data-home-day-study] [data-home-music] h2 + p,
[data-home-day-study] [data-home-music] :has(> input[aria-label="播放进度"]) { opacity:.9; }
[data-home-day-study] [data-home-sill] > a { color:#2c465b; }
[data-home-day-study] [data-home-sill] > a:hover { color:#163e60; }
[data-home-day-study] dialog { color-scheme:light; }
[data-home-day-study] [data-day-canvas] {
  visibility:visible !important; opacity:1; z-index:3;
}
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
    shoreline: DAY_SHORE.map(([x, y]) => [x / DAY_WIDTH, y / DAY_HEIGHT]),
    nearShore: DAY_NEAR_SHORE.map(([x, y]) => [x / DAY_WIDTH, y / DAY_HEIGHT]),
    ridge: DAY_RIDGE.map(([x, y]) => [x / DAY_WIDTH, (y - 4) / DAY_HEIGHT]),
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
window.startDaySpectralComparison = async (variant = "a") => {
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
  const outputs = ["a", "b"].map((name) => {
    const canvas = document.createElement("canvas")
    canvas.dataset.dayCanvas = name
    canvas.setAttribute("aria-hidden", "true")
    canvas.hidden = true
    opening.insertBefore(canvas, opening.lastElementChild)
    return { name, canvas, ctx: canvas.getContext("2d", { alpha: false }) }
  })
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  let tracers = null
  let width = 0,
    height = 0,
    ratio = 0,
    rect,
    sky
  let frozen = false,
    destroyed = false,
    selected = variant
  let recordings = []
  const stats = {
    frames: 0,
    totalMs: 0,
    maxMs: 0,
    aMs: 0,
    bMs: 0,
    fieldTime: 0,
    bufferBytes: 0,
    hostBufferBytes: 0,
    decodedPlateBytes: DAY_WIDTH * DAY_HEIGHT * 4,
  }
  const resources = [back, front, ...outputs.map((o) => o.canvas)]
  const syncVisibility = () => {
    for (const o of outputs) o.canvas.hidden = reduced.matches || !tracers || o.name !== selected
    stage.dataset.homeDayStudy = reduced.matches ? "static" : selected
  }
  const release = () => {
    for (const r of recordings) {
      if (r.recorder.state !== "inactive") r.recorder.stop()
      r.stream.getTracks().forEach((track) => track.stop())
    }
    recordings = []
    tracers?.destroy()
    tracers = null
    for (const c of resources) c.width = c.height = 0
    stats.bufferBytes = 0
    width = height = ratio = 0
    syncVisibility()
  }
  const resize = () => {
    if (destroyed || reduced.matches || !outputs.every((o) => o.ctx)) {
      if (!outputs.every((o) => o.ctx)) metadata.fallback = "canvas-unavailable"
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
    stats.bufferBytes = resources.reduce((n, c) => n + c.width * c.height * 4, 0)
    delete metadata.fallback
    syncVisibility()
    return true
  }
  const compose = (output, showField = true) => {
    const { ctx } = output
    const began = performance.now()
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
    // Opaque destination: multiply really interacts with the daylight image,
    // rather than multiplying against an empty transparent intermediate.
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height)
    if (showField) {
      ctx.save()
      ctx.clip(sky)
      ctx.globalCompositeOperation = output.name === "a" ? "source-over" : "multiply"
      ctx.globalAlpha = metadata.spectral.backgroundAlpha
      ctx.drawImage(back, 0, 0, width, height)
      ctx.globalAlpha = metadata.spectral.foregroundAlpha
      ctx.drawImage(front, 0, 0, width, height)
      ctx.restore()
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
    // Alternate order to avoid giving one mode a systematic warm-cache advantage.
    for (const output of stats.frames % 2 ? [...outputs].reverse() : outputs) compose(output)
    for (const r of recordings) r.stream.getVideoTracks()[0]?.requestFrame()
    const cost = performance.now() - began
    stats.frames++
    stats.fieldTime = time
    stats.totalMs += cost
    stats.maxMs = Math.max(stats.maxMs, cost)
    stats.hostBufferBytes = Number(stage.dataset.homeBufferBytes || 0)
  }
  const observer = new MutationObserver(draw)
  observer.observe(stage, { attributes: true, attributeFilter: ["data-home-frames"] })
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
    if (["a", "b", "0"].includes(event.key.toLowerCase()))
      study.setVariant(event.key === "0" ? "none" : event.key.toLowerCase())
  }
  document.addEventListener("keydown", onKey)
  Object.assign(study, {
    stats,
    setVariant(name) {
      if (!["a", "b", "none"].includes(name)) throw new Error("Unknown study variant")
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
        changedProtected = 0
      // A and B may differ only in the sky. Leave an 8px safety band at the
      // anti-aliased silhouette; lower mountain/lake samples must be identical.
      for (let y = 0; y < a.height; y += 3)
        for (let x = 0; x < a.width; x += 3) {
          const i = (y * a.width + x) * 4
          if (
            a.data[i] === b.data[i] &&
            a.data[i + 1] === b.data[i + 1] &&
            a.data[i + 2] === b.data[i + 2]
          )
            continue
          if (outputs[0].ctx.isPointInPath(sky, x, y)) changedSky++
          else if (!outputs[0].ctx.isPointInPath(sky, x, y - 8 * ratio)) changedProtected++
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
