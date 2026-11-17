import { spectralDirectionAt } from "./SpectralTracerLayer"
import { SPECTRAL_PLAYBACK_RATE } from "./spectralField"

// Interleaved direction x/y and curvature. This is a sampled view of the
// original six-mode field, never a second noise field or a new spectral model.
export function sampleSpectralScene(
  width: number,
  height: number,
  time: number,
  columns = 16,
  rows = 9,
  values = new Float32Array(columns * rows * 3),
) {
  const dx = width / Math.max(1, columns - 1) / 4
  const dy = height / Math.max(1, rows - 1) / 4
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column / Math.max(1, columns - 1)) * width
      const y = (row / Math.max(1, rows - 1)) * height
      const direction = spectralDirectionAt(x, y, time, width, height, 6)
      const left = spectralDirectionAt(x - dx, y, time, width, height, 6)
      const right = spectralDirectionAt(x + dx, y, time, width, height, 6)
      const above = spectralDirectionAt(x, y - dy, time, width, height, 6)
      const below = spectralDirectionAt(x, y + dy, time, width, height, 6)
      const offset = (row * columns + column) * 3
      values[offset] = direction.x
      values[offset + 1] = direction.y
      // Mean angular change across two axes, in [0, 1]. A normalized
      // direction's magnitude cannot encode light intensity.
      values[offset + 2] = Math.max(
        0,
        Math.min(
          1,
          (2 - left.x * right.x - left.y * right.y - above.x * below.x - above.y * below.y) / 4,
        ),
      )
    }
  }
  return { width, height, time, columns, rows, values }
}

export function interpolateSpectralScene(
  grid: ReturnType<typeof sampleSpectralScene>,
  x: number,
  y: number,
) {
  const gx = Math.max(0, Math.min(1, x)) * (grid.columns - 1)
  const gy = Math.max(0, Math.min(1, y)) * (grid.rows - 1)
  const left = Math.floor(gx)
  const top = Math.floor(gy)
  const right = Math.min(left + 1, grid.columns - 1)
  const bottom = Math.min(top + 1, grid.rows - 1)
  const blend = (channel: number) => {
    const at = (column: number, row: number) =>
      grid.values[(row * grid.columns + column) * 3 + channel]
    const a = at(left, top) * (1 - gx + left) + at(right, top) * (gx - left)
    const b = at(left, bottom) * (1 - gx + left) + at(right, bottom) * (gx - left)
    return a * (1 - gy + top) + b * (gy - top)
  }
  return { x: blend(0), y: blend(1), light: blend(2) }
}

export function smoothHomePointer(current: number, target: number, seconds: number) {
  return current + (target - current) * (1 - Math.exp(-2.2 * Math.min(Math.max(seconds, 0), 0.05)))
}

export const HOME_LANDSCAPE_WIDTH = 1672
export const HOME_LANDSCAPE_HEIGHT = 877
export function homeLandscapeRect(width: number, height: number) {
  const scale = Math.max((width + 48) / HOME_LANDSCAPE_WIDTH, (height + 48) / HOME_LANDSCAPE_HEIGHT)
  return {
    x: (width - HOME_LANDSCAPE_WIDTH * scale) / 2,
    y: (height - HOME_LANDSCAPE_HEIGHT * scale) / 2,
    width: HOME_LANDSCAPE_WIDTH * scale,
    height: HOME_LANDSCAPE_HEIGHT * scale,
  }
}
// The approved daylight plate; shared by production DOM, optical clipping and review.
export const HOME_MOUNTAIN_PROFILE = [
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
].map(([x, y]) => [x / HOME_LANDSCAPE_WIDTH, (y - 4) / HOME_LANDSCAPE_HEIGHT] as const)
export const HOME_SHORELINE = [
  [0, 579],
  [103, 558],
  [252, 552],
  [459, 549],
  [802, 548],
  [1118, 545],
  [1414, 546],
  [1672, 544],
].map(([x, y]) => [x / HOME_LANDSCAPE_WIDTH, y / HOME_LANDSCAPE_HEIGHT] as const)
export const HOME_NEAR_SHORE = [
  [0, 681],
  [25, 679],
  [63, 696],
  [83, 726],
  [112, 755],
  [106, 799],
  [90, 844],
  [100, 877],
  [0, 877],
].map(([x, y]) => [x / HOME_LANDSCAPE_WIDTH, y / HOME_LANDSCAPE_HEIGHT] as const)

// Optical buffers only: the caller owns the tracer controller, time, RAF and output.
// The previously approved review compositor is used by the real homepage too.
export function createHomeSpectralLight() {
  const probe = document.createElement("canvas"),
    fog = document.createElement("canvas"),
    mask = document.createElement("canvas")
  const radiance = document.createElement("canvas"),
    core = document.createElement("canvas")
  const resources = [probe, fog, mask, radiance, core]
  const probeCtx = probe.getContext("2d", { willReadFrequently: true }),
    fogCtx = fog.getContext("2d"),
    maskCtx = mask.getContext("2d")
  const lightCtx = radiance.getContext("2d"),
    coreCtx = core.getContext("2d")
  if (!probeCtx || !fogCtx || !maskCtx || !lightCtx || !coreCtx) {
    resources.forEach((c) => {
      c.width = c.height = 0
    })
    return null
  }
  let width = 0,
    height = 0,
    lightScale = 0.5,
    rect = homeLandscapeRect(1, 1),
    sky = new Path2D(),
    lake = new Path2D()
  let maskX = NaN,
    maskY = NaN,
    sampledAt = -Infinity,
    previousLightTime: number | null = null
  let target = new Float32Array(0),
    envelope = new Float32Array(0)
  let fogPixels = fogCtx.createImageData(1, 1),
    maskPixels = maskCtx.createImageData(1, 1)
  const stats = { densityMax: 0, envelopeMin: 0, envelopeMax: 0, coreFraction: 0, gridTime: 0 }
  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  const smooth = (a: number, b: number, v: number) => {
    const t = clamp((v - a) / (b - a))
    return t * t * (3 - 2 * t)
  }
  const resize = (w: number, h: number, low: boolean) => {
    const cols = low ? 40 : 64,
      rows = low ? 24 : 40
    if (width === w && height === h && probe.width === cols) return
    width = w
    height = h
    rect = homeLandscapeRect(width, height)
    for (const c of [probe, fog, mask]) {
      c.width = cols
      c.height = rows
    }
    lightScale = Math.min(0.5, 768 / width)
    for (const c of [radiance, core]) {
      c.width = Math.round(width * lightScale)
      c.height = Math.round(height * lightScale)
    }
    fogPixels = fogCtx.createImageData(cols, rows)
    maskPixels = maskCtx.createImageData(cols, rows)
    target = new Float32Array(cols * rows)
    envelope = new Float32Array(cols * rows)
    sampledAt = -Infinity
    previousLightTime = null
    maskX = maskY = NaN
  }
  const updateMasks = (camera: { x: number; y: number }) => {
    if (maskX === camera.x && maskY === camera.y) return
    maskX = camera.x
    maskY = camera.y
    sky = new Path2D()
    sky.moveTo(-48, -48)
    sky.lineTo(width + 48, -48)
    for (const [x, y] of [...HOME_MOUNTAIN_PROFILE].reverse())
      sky.lineTo(rect.x + x * rect.width + maskX * 10, rect.y + y * rect.height + maskY * 6)
    sky.closePath()
    lake = new Path2D()
    HOME_SHORELINE.forEach(([x, y], i) => {
      const px = rect.x + x * rect.width + maskX * 10,
        py = rect.y + y * rect.height + maskY * 6
      if (i) lake.lineTo(px, py)
      else lake.moveTo(px, py)
    })
    lake.lineTo(width + 48, height + 48)
    lake.lineTo(-48, height + 48)
    lake.closePath()
    HOME_NEAR_SHORE.forEach(([x, y], i) => {
      const px = rect.x + x * rect.width + maskX * 16,
        py = rect.y + y * rect.height + maskY * 10
      if (i) lake.lineTo(px, py)
      else lake.moveTo(px, py)
    })
    lake.closePath()
  }
  const updateLight = (
    back: HTMLCanvasElement,
    front: HTMLCanvasElement,
    grid: ReturnType<typeof sampleSpectralScene>,
    time: number,
  ) => {
    if (grid.time !== sampledAt) {
      sampledAt = grid.time
      stats.gridTime = grid.time
      probeCtx.clearRect(0, 0, probe.width, probe.height)
      probeCtx.drawImage(back, 0, 0, probe.width, probe.height)
      probeCtx.drawImage(front, 0, 0, probe.width, probe.height)
      const density = probeCtx.getImageData(0, 0, probe.width, probe.height).data
      stats.densityMax = 0
      for (let y = 0; y < fog.height; y++)
        for (let x = 0; x < fog.width; x++) {
          const index = y * fog.width + x,
            offset = index * 4
          const field = interpolateSpectralScene(grid, x / (fog.width - 1), y / (fog.height - 1))
          // A two-cell displacement reads the actual common direction field.
          // Density is accumulated trail coverage; curvature is angular change.
          // Neither is the (unit) direction vector's length or a new noise field.
          const sx = Math.max(0, Math.min(probe.width - 1, Math.round(x - field.x * 1.5)))
          const sy = Math.max(0, Math.min(probe.height - 1, Math.round(y - field.y * 1.5)))
          const coverage = density[(sy * probe.width + sx) * 4 + 3] / 255
          const localDensity = clamp(coverage / 0.055)
          stats.densityMax = Math.max(stats.densityMax, localDensity)
          // Display transfer only: small angular changes remain legible in
          // daylight without modifying any eigenmode or tracer integration.
          const bend = clamp(Math.sqrt(field.light) * 4)
          target[index] = smooth(0.2, 0.7, localDensity) * (0.45 + 0.55 * bend)
          const violet = 0.2 + 0.8 * bend
          const rose = 0.12 * smooth(0.72, 1, field.light) * localDensity
          fogPixels.data[offset] = Math.round(96 + 89 * violet + 70 * rose)
          fogPixels.data[offset + 1] = Math.round(199 - 55 * violet - 66 * rose)
          fogPixels.data[offset + 2] = 255
        }
    }
    const dt =
      previousLightTime === null
        ? 1
        : Math.max(0, (time - previousLightTime) / SPECTRAL_PLAYBACK_RATE)
    previousLightTime = time
    const blend = 1 - Math.exp(-Math.min(dt, 1) / 0.45)
    let coreCells = 0
    stats.envelopeMin = 1
    stats.envelopeMax = 0
    for (let i = 0; i < target.length; i++) {
      envelope[i] += (target[i] - envelope[i]) * blend
      const light = clamp(envelope[i])
      fogPixels.data[i * 4 + 3] = Math.round(light * 255)
      const visibleCore = smooth(0.5, 0.75, light)
      if (visibleCore > 0.1) coreCells++
      maskPixels.data[i * 4] = maskPixels.data[i * 4 + 1] = maskPixels.data[i * 4 + 2] = 255
      maskPixels.data[i * 4 + 3] = Math.round(visibleCore * 255)
      stats.envelopeMin = Math.min(stats.envelopeMin, light)
      stats.envelopeMax = Math.max(stats.envelopeMax, light)
    }
    stats.coreFraction = coreCells / target.length
    fogCtx.putImageData(fogPixels, 0, 0)
    maskCtx.putImageData(maskPixels, 0, 0)
    lightCtx.setTransform(lightScale, 0, 0, lightScale, 0, 0)
    lightCtx.clearRect(0, 0, width, height)
    lightCtx.save()
    lightCtx.clip(sky)
    // Two diffusion scales turn deposited trajectories into a continuous
    // light volume. Peak regions reveal foreground arcs and a faint trace of
    // the same background paths; the rest never becomes a line drawing.
    lightCtx.globalAlpha = 0.6
    lightCtx.filter = `blur(${42 * lightScale}px)`
    lightCtx.drawImage(fog, 0, 0, width, height)
    lightCtx.globalAlpha = 0.72
    lightCtx.filter = `blur(${16 * lightScale}px)`
    lightCtx.drawImage(fog, 0, 0, width, height)
    lightCtx.filter = "none"
    coreCtx.setTransform(lightScale, 0, 0, lightScale, 0, 0)
    coreCtx.globalCompositeOperation = "source-over"
    coreCtx.clearRect(0, 0, width, height)
    coreCtx.globalAlpha = 0.18
    coreCtx.drawImage(back, 0, 0, width, height)
    coreCtx.globalAlpha = 1
    coreCtx.drawImage(front, 0, 0, width, height)
    coreCtx.globalCompositeOperation = "destination-in"
    coreCtx.drawImage(mask, 0, 0, width, height)
    lightCtx.globalAlpha = 0.4
    lightCtx.drawImage(core, 0, 0, width, height)
    lightCtx.restore()
  }

  const shoreAt = (x: number) => {
    const u = clamp((x - rect.x - maskX * 10) / rect.width)
    let i = 1
    while (i < HOME_SHORELINE.length - 1 && HOME_SHORELINE[i][0] < u) i++
    const a = HOME_SHORELINE[i - 1],
      b = HOME_SHORELINE[i]
    return rect.y + (a[1] + ((b[1] - a[1]) * (u - a[0])) / (b[0] - a[0])) * rect.height + maskY * 6
  }
  return {
    stats,
    get bufferBytes() {
      return resources.reduce((n, c) => n + c.width * c.height * 4, 0)
    },
    render(
      ctx: CanvasRenderingContext2D,
      back: HTMLCanvasElement,
      front: HTMLCanvasElement,
      grid: ReturnType<typeof sampleSpectralScene>,
      w: number,
      h: number,
      time: number,
      low: boolean,
      camera: { x: number; y: number },
    ) {
      resize(w, h, low)
      updateMasks(camera)
      updateLight(back, front, grid, time)
      ctx.save()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      ctx.filter = "none"
      ctx.save()
      ctx.clip(sky)
      ctx.drawImage(radiance, 0, 0, width, height)
      ctx.restore()
      ctx.save()
      ctx.clip(lake, "evenodd")
      for (let x = 0; x < width; x += 14) {
        const shoreline = shoreAt(x + 7),
          flow = interpolateSpectralScene(grid, (x + 7) / width, shoreline / height)
        ctx.save()
        ctx.globalAlpha = 0.28 + 0.12 * flow.light
        ctx.translate(flow.x * 1.8, shoreline * 1.65 + flow.y * 0.5)
        ctx.scale(1, -0.65)
        ctx.drawImage(
          radiance,
          x * lightScale,
          0,
          16 * lightScale,
          radiance.height,
          x,
          0,
          16,
          height,
        )
        ctx.restore()
      }
      ctx.restore()
      ctx.restore()
    },
    release() {
      resources.forEach((c) => {
        c.width = c.height = 0
      })
      width = height = 0
      sampledAt = -Infinity
      previousLightTime = null
      target = new Float32Array(0)
      envelope = new Float32Array(0)
      fogPixels = fogCtx.createImageData(1, 1)
      maskPixels = maskCtx.createImageData(1, 1)
      sky = new Path2D()
      lake = new Path2D()
      maskX = maskY = NaN
    },
  }
}
