"use client"

import type { RefObject } from "react"
import { SPECTRAL_LAMBDAS } from "./spectralField"

export const SPECTRAL_TRACER_BACKGROUND = 3200
export const SPECTRAL_TRACER_FOREGROUND = 120
export const SPECTRAL_TRACER_CAPACITY = 4096
export const SPECTRAL_TRACER_MAX_OBSTACLES = 8

const BACKGROUND_RENDER_CAPACITY = 1280
const FOREGROUND_RENDER_CAPACITY = 72
const FIELD_KX = [1.0, 2.0, 3.0, 1.0, 4.0, 2.0] as const
const FIELD_KY = [2.0, -1.0, 1.0, -3.0, 2.0, 5.0] as const
const FIELD_AMPLITUDES = [1.0, 0.72, 0.5, 0.38, 0.26, 0.18] as const
const FIELD_PHASES = [0.31, 2.17, 4.02, 5.41, 1.24, 3.52] as const
const R2_G = 1.324717957244746
const R2_A1 = 1 / R2_G
const R2_A2 = 1 / (R2_G * R2_G)

export type TracerObstacle = {
  left: number
  top: number
  right: number
  bottom: number
}

export type SpectralTracerFrame = {
  alpha: number
  theme: number
  time: number
  backgroundCount: number
  foregroundCount: number
  trailSamples: number
  modeCount: number
  width: number
  height: number
  obstacles: TracerObstacle[]
}

export type SpectralTracerController = {
  resize: (width: number, height: number, pixelRatio: number) => void
  render: (frame: SpectralTracerFrame) => void
  destroy: () => void
}

type SpectralTracerLayerProps = {
  backCanvasRef: RefObject<HTMLCanvasElement | null>
  frontCanvasRef: RefObject<HTMLCanvasElement | null>
  interactionCanvasRef: RefObject<HTMLCanvasElement | null>
}

type LayerRenderer = {
  resize: (width: number, height: number, pixelRatio: number) => void
  render: (frame: SpectralTracerFrame) => void
  destroy: () => void
}

function fract(value: number) {
  return value - Math.floor(value)
}

function seedAt(index: number, width: number, height: number) {
  const sample = index + 1
  const u = fract(0.5 + R2_A1 * sample)
  const v = fract(0.5 + R2_A2 * sample)
  return {
    x: (-0.04 + u * 1.08) * width,
    y: (-0.04 + v * 1.08) * height,
  }
}

function velocityAt(
  x: number,
  y: number,
  time: number,
  width: number,
  height: number,
  modeCount: number,
) {
  const safeWidth = Math.max(width, 1)
  const safeHeight = Math.max(height, 1)
  const aspect = safeWidth / safeHeight
  const nx = (x / safeWidth) * 2 - 1
  const ny = (y / safeHeight) * 2 - 1
  let vx = 0
  let vy = 0
  const activeModes = Math.min(modeCount, FIELD_KX.length)

  for (let mode = 0; mode < activeModes; mode++) {
    const phase =
      FIELD_KX[mode] * nx * aspect +
      FIELD_KY[mode] * ny +
      SPECTRAL_LAMBDAS[mode] * time +
      FIELD_PHASES[mode]
    const cosine = Math.cos(phase)
    const amplitude = FIELD_AMPLITUDES[mode]

    // V = J grad(psi): analytic, smooth and divergence free.
    vx += amplitude * FIELD_KY[mode] * cosine
    vy -= amplitude * FIELD_KX[mode] * cosine
  }

  vx /= Math.max(aspect, 0.65)
  const magnitude = Math.hypot(vx, vy)
  if (magnitude < 1e-5) return { x: 1, y: 0 }
  return { x: vx / magnitude, y: vy / magnitude }
}

type VelocityGrid = {
  columns: number
  rows: number
  width: number
  height: number
  values: Float32Array
}

type VelocityGridAt = (
  time: number,
  width: number,
  height: number,
  modeCount: number,
) => VelocityGrid

function createVelocityGridCache(): VelocityGridAt {
  let grid: VelocityGrid | null = null
  let lastTime = Number.NaN
  let lastModeCount = -1

  return (time, width, height, modeCount) => {
    const columns = Math.max(36, Math.min(72, Math.ceil(width / 22) + 1))
    const rows = Math.max(24, Math.min(48, Math.ceil(height / 22) + 1))
    if (
      !grid ||
      grid.columns !== columns ||
      grid.rows !== rows ||
      grid.width !== width ||
      grid.height !== height
    ) {
      grid = {
        columns,
        rows,
        width,
        height,
        values: new Float32Array(columns * rows * 2),
      }
      lastTime = Number.NaN
    }

    if (time === lastTime && modeCount === lastModeCount) return grid

    for (let row = 0; row < rows; row++) {
      const y = (row / (rows - 1)) * height
      for (let column = 0; column < columns; column++) {
        const x = (column / (columns - 1)) * width
        const velocity = velocityAt(x, y, time, width, height, modeCount)
        const offset = (row * columns + column) * 2
        grid.values[offset] = velocity.x
        grid.values[offset + 1] = velocity.y
      }
    }

    lastTime = time
    lastModeCount = modeCount
    return grid
  }
}

function sampleVelocityGrid(grid: VelocityGrid, x: number, y: number) {
  const gridX = Math.min(grid.columns - 1, Math.max(0, (x / grid.width) * (grid.columns - 1)))
  const gridY = Math.min(grid.rows - 1, Math.max(0, (y / grid.height) * (grid.rows - 1)))
  const left = Math.floor(gridX)
  const top = Math.floor(gridY)
  const right = Math.min(grid.columns - 1, left + 1)
  const bottom = Math.min(grid.rows - 1, top + 1)
  const mixX = gridX - left
  const mixY = gridY - top
  const topLeft = (top * grid.columns + left) * 2
  const topRight = (top * grid.columns + right) * 2
  const bottomLeft = (bottom * grid.columns + left) * 2
  const bottomRight = (bottom * grid.columns + right) * 2
  const vxTop = grid.values[topLeft] + (grid.values[topRight] - grid.values[topLeft]) * mixX
  const vyTop =
    grid.values[topLeft + 1] + (grid.values[topRight + 1] - grid.values[topLeft + 1]) * mixX
  const vxBottom =
    grid.values[bottomLeft] + (grid.values[bottomRight] - grid.values[bottomLeft]) * mixX
  const vyBottom =
    grid.values[bottomLeft + 1] +
    (grid.values[bottomRight + 1] - grid.values[bottomLeft + 1]) * mixX
  const vx = vxTop + (vxBottom - vxTop) * mixY
  const vy = vyTop + (vyBottom - vyTop) * mixY
  const magnitude = Math.hypot(vx, vy)
  if (magnitude < 1e-5) return { x: 1, y: 0 }
  return { x: vx / magnitude, y: vy / magnitude }
}

function appendStreamline(
  path: Path2D,
  seedX: number,
  seedY: number,
  direction: 1 | -1,
  steps: number,
  stepLength: number,
  grid: VelocityGrid,
) {
  let x = seedX
  let y = seedY
  path.moveTo(x, y)

  for (let step = 0; step < steps; step++) {
    const velocity = sampleVelocityGrid(grid, x, y)
    x += velocity.x * stepLength * direction
    y += velocity.y * stepLength * direction

    if (x < -24 || x > grid.width + 24 || y < -24 || y > grid.height + 24) break
    path.lineTo(x, y)
  }
}

function createLayerRenderer(
  canvas: HTMLCanvasElement,
  parameterOffset: number,
  capacity: number,
  layer: 0 | 1,
  velocityGridAt: VelocityGridAt,
): LayerRenderer | null {
  const context = canvas.getContext("2d", { alpha: true })
  if (!context) return null

  let logicalWidth = 1
  let logicalHeight = 1
  let logicalPixelRatio = 1

  const resize = (width: number, height: number, pixelRatio: number) => {
    logicalWidth = Math.max(1, width)
    logicalHeight = Math.max(1, height)
    logicalPixelRatio = Math.max(1, pixelRatio)
    const physicalWidth = Math.max(1, Math.floor(logicalWidth * logicalPixelRatio))
    const physicalHeight = Math.max(1, Math.floor(logicalHeight * logicalPixelRatio))
    if (canvas.width !== physicalWidth) canvas.width = physicalWidth
    if (canvas.height !== physicalHeight) canvas.height = physicalHeight
    canvas.style.width = logicalWidth + "px"
    canvas.style.height = logicalHeight + "px"
    context.setTransform(logicalPixelRatio, 0, 0, logicalPixelRatio, 0, 0)
  }

  const render = ({
    alpha,
    theme,
    time,
    backgroundCount,
    foregroundCount,
    trailSamples,
    modeCount,
    width,
    height,
    obstacles,
  }: SpectralTracerFrame) => {
    context.setTransform(logicalPixelRatio, 0, 0, logicalPixelRatio, 0, 0)
    context.clearRect(0, 0, logicalWidth, logicalHeight)
    if (alpha <= 0.001) return

    const requested = layer === 0 ? backgroundCount : foregroundCount
    const scale =
      layer === 0
        ? BACKGROUND_RENDER_CAPACITY / SPECTRAL_TRACER_BACKGROUND
        : FOREGROUND_RENDER_CAPACITY / SPECTRAL_TRACER_FOREGROUND
    const count = Math.max(0, Math.min(Math.round(requested * scale), capacity))
    if (count <= 0) return

    const velocityGrid = velocityGridAt(time, width, height, modeCount)
    const steps =
      layer === 0
        ? Math.max(6, Math.min(10, Math.round(trailSamples * 0.65)))
        : Math.max(5, Math.min(8, Math.round(trailSamples * 0.55)))
    const baseStep = Math.min(width, height) / (layer === 0 ? 112 : 128)
    const stepLength = Math.max(
      layer === 0 ? 6.2 : 5.2,
      Math.min(layer === 0 ? 9.5 : 7.5, baseStep),
    )
    const palette =
      theme < 0.5
        ? ["rgba(64,145,220,1)", "rgba(68,170,228,1)", "rgba(105,112,210,1)"]
        : ["rgba(145,218,255,1)", "rgba(115,192,250,1)", "rgba(184,162,255,1)"]

    context.lineCap = "round"
    context.lineJoin = "round"

    for (let bucket = 0; bucket < 3; bucket++) {
      const path = new Path2D()

      for (let localIndex = bucket; localIndex < count; localIndex += 3) {
        const index = parameterOffset + localIndex
        const seed = seedAt(index, width, height)
        appendStreamline(path, seed.x, seed.y, 1, steps, stepLength, velocityGrid)
        appendStreamline(path, seed.x, seed.y, -1, steps, stepLength, velocityGrid)
      }

      context.globalCompositeOperation = "lighter"
      context.strokeStyle = palette[bucket]
      context.globalAlpha = alpha * (layer === 0 ? 0.075 + theme * 0.025 : 0.07 + theme * 0.035)
      context.lineWidth = layer === 0 ? 3.2 : 2.8
      context.stroke(path)

      context.globalCompositeOperation = "source-over"
      context.globalAlpha = alpha * (layer === 0 ? 0.22 + theme * 0.08 : 0.22 + theme * 0.1)
      context.lineWidth = layer === 0 ? 0.92 : 1.08
      context.stroke(path)
    }

    context.globalAlpha = 1
    context.globalCompositeOperation = "source-over"

    if (layer === 0) {
      for (const obstacle of obstacles.slice(0, SPECTRAL_TRACER_MAX_OBSTACLES)) {
        const padding = 10
        context.clearRect(
          obstacle.left - padding,
          obstacle.top - padding,
          obstacle.right - obstacle.left + padding * 2,
          obstacle.bottom - obstacle.top + padding * 2,
        )
      }
    } else {
      context.globalCompositeOperation = "source-atop"
      context.globalAlpha = 0.74
      context.fillStyle = theme < 0.5 ? "rgb(132, 151, 174)" : "rgb(180, 211, 232)"
      for (const obstacle of obstacles.slice(0, SPECTRAL_TRACER_MAX_OBSTACLES)) {
        context.fillRect(
          obstacle.left,
          obstacle.top,
          obstacle.right - obstacle.left,
          obstacle.bottom - obstacle.top,
        )
      }
      context.globalAlpha = 1
      context.globalCompositeOperation = "source-over"
    }
  }

  const destroy = () => {
    context.clearRect(0, 0, logicalWidth, logicalHeight)
  }

  return { resize, render, destroy }
}

export function createSpectralTracerController(
  backCanvas: HTMLCanvasElement,
  frontCanvas: HTMLCanvasElement,
): SpectralTracerController | null {
  const velocityGridAt = createVelocityGridCache()
  const backRenderer = createLayerRenderer(
    backCanvas,
    0,
    BACKGROUND_RENDER_CAPACITY,
    0,
    velocityGridAt,
  )
  const frontRenderer = createLayerRenderer(
    frontCanvas,
    SPECTRAL_TRACER_BACKGROUND,
    FOREGROUND_RENDER_CAPACITY,
    1,
    velocityGridAt,
  )

  if (!backRenderer || !frontRenderer) return null

  return {
    resize: (width, height, pixelRatio) => {
      backRenderer.resize(width, height, pixelRatio)
      frontRenderer.resize(width, height, pixelRatio)
    },
    render: (frame) => {
      backRenderer.render(frame)
      frontRenderer.render(frame)
    },
    destroy: () => {
      backRenderer.destroy()
      frontRenderer.destroy()
    },
  }
}

export function SpectralTracerLayer({
  backCanvasRef,
  frontCanvasRef,
  interactionCanvasRef,
}: SpectralTracerLayerProps) {
  return (
    <>
      <canvas
        ref={backCanvasRef}
        className="pointer-events-none fixed inset-0 z-[3] hidden h-full w-full md:block"
        data-field-layer="back"
        aria-hidden="true"
      />
      <canvas
        ref={frontCanvasRef}
        className="pointer-events-none fixed inset-0 z-20 hidden h-full w-full md:block"
        data-field-layer="front"
        aria-hidden="true"
      />
      <canvas
        ref={interactionCanvasRef}
        className="pointer-events-none fixed inset-0 z-[21] hidden h-full w-full md:block"
        data-field-layer="interaction"
        aria-hidden="true"
      />
    </>
  )
}
