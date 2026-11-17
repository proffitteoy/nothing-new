import { spectralDirectionAt } from "./SpectralTracerLayer"

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

export function homeLandscapeRect(width: number, height: number) {
  // 24px of overscan exceeds the maximum 16px camera displacement.
  const scale = Math.max((width + 48) / 1536, (height + 48) / 868)
  return {
    x: (width - 1536 * scale) / 2,
    y: (height - 868 * scale) / 2,
    width: 1536 * scale,
    height: 868 * scale,
  }
}

// Audited against the licensed matte plate, after its 156px top crop.
// Used by both the DOM mountain mask and the canvas sky clip.
export const HOME_MOUNTAIN_PROFILE = [
  [0, 0.44],
  [0.065, 0.444],
  [0.101, 0.472],
  [0.139, 0.484],
  [0.171, 0.442],
  [0.194, 0.428],
  [0.215, 0.415],
  [0.235, 0.404],
  [0.25, 0.395],
  [0.268, 0.392],
  [0.282, 0.405],
  [0.31, 0.405],
  [0.333, 0.44],
  [0.35, 0.446],
  [0.372, 0.474],
  [0.404, 0.49],
  [0.437, 0.514],
  [0.469, 0.55],
  [0.491, 0.566],
  [0.514, 0.557],
  [0.53, 0.545],
  [0.553, 0.529],
  [0.579, 0.517],
  [0.595, 0.51],
  [0.613, 0.485],
  [0.638, 0.476],
  [0.663, 0.45],
  [0.697, 0.434],
  [0.719, 0.427],
  [0.746, 0.433],
  [0.774, 0.437],
  [0.793, 0.446],
  [0.814, 0.44],
  [0.834, 0.409],
  [0.856, 0.389],
  [0.872, 0.383],
  [0.886, 0.391],
  [0.906, 0.4],
  [0.93, 0.381],
  [0.948, 0.365],
  [0.967, 0.343],
  [0.986, 0.328],
  [1, 0.317],
].map(([x, y]) => [x, (y * 1024 - 156) / 868] as const)

export function drawHomeSpectralLight(
  ctx: CanvasRenderingContext2D,
  back: HTMLCanvasElement,
  front: HTMLCanvasElement,
  grid: ReturnType<typeof sampleSpectralScene>,
  width: number,
  height: number,
  camera: { x: number; y: number },
) {
  const rect = homeLandscapeRect(width, height)
  const shoreline = rect.y + rect.height * 0.623 + camera.y * 6
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(-48, -48)
  ctx.lineTo(width + 48, -48)
  for (let i = HOME_MOUNTAIN_PROFILE.length - 1; i >= 0; i--) {
    const [x, y] = HOME_MOUNTAIN_PROFILE[i]
    ctx.lineTo(rect.x + x * rect.width + camera.x * 10, rect.y + y * rect.height + camera.y * 6)
  }
  ctx.closePath()
  ctx.clip()
  ctx.globalCompositeOperation = "screen"
  ctx.globalAlpha = 0.022
  ctx.drawImage(back, 0, 0, width, height)
  ctx.globalAlpha = 0.035
  ctx.drawImage(front, 0, 0, width, height)
  for (let column = 2; column <= 13; column += 2) {
    const sample = interpolateSpectralScene(grid, column / 15, 0.36)
    const x = (column / 15) * width + sample.x * 22 + camera.x * 4
    const y = height * 0.36 + sample.y * 28
    const radius = width * 0.17
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
    const tint = column % 4 ? "96,199,255" : "185,144,255"
    glow.addColorStop(0, `rgba(${tint},${0.025 + sample.light * 0.08})`)
    glow.addColorStop(1, `rgba(${tint},0)`)
    ctx.globalAlpha = 1
    ctx.fillStyle = glow
    ctx.save()
    ctx.translate(0, y * 0.45)
    ctx.scale(1, 0.55)
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    ctx.restore()
  }
  ctx.restore()
  // Reflect the same curve buffer, with local displacements from the same
  // sampled direction/curvature. No independent wave or aurora clock.
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, shoreline, width, Math.max(0, height - shoreline))
  ctx.clip()
  ctx.globalCompositeOperation = "screen"
  const depth = Math.max(1, height - shoreline)
  const ratio = back.width / width
  for (let row = 0; row < depth; row += grid.columns === 16 ? 5 : 9) {
    const sample = interpolateSpectralScene(grid, 0.5, (shoreline + row) / height)
    const fade = Math.pow(1 - row / depth, 2)
    const sourceY = Math.max(0, shoreline - row * 1.5)
    const reflectionWidth = width * (0.48 + (row / depth) * 0.12)
    ctx.globalAlpha = 0.035 * fade
    ctx.drawImage(
      back,
      width * 0.26 * ratio,
      sourceY * ratio,
      reflectionWidth * ratio,
      3 * ratio,
      width * 0.26 + sample.x * (1 + (row / depth) * 6),
      shoreline + row,
      reflectionWidth,
      3,
    )
    const x = width * 0.48 + sample.x * width * 0.035
    const glow = ctx.createLinearGradient(x - width * 0.18, 0, x + width * 0.18, 0)
    glow.addColorStop(0, "rgba(96,199,255,0)")
    glow.addColorStop(0.5, `rgba(122,158,211,${(0.045 + sample.light * 0.12) * fade})`)
    glow.addColorStop(1, "rgba(185,144,255,0)")
    ctx.globalAlpha = 1
    ctx.fillStyle = glow
    ctx.fillRect(x - width * 0.18, shoreline + row, width * 0.36, 1)
  }
  ctx.restore()
}
