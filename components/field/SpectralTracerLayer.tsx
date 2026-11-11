"use client"

import type { RefObject } from "react"
import { SPECTRAL_LAMBDAS, SPECTRAL_PLAYBACK_RATE } from "./spectralField"

/*
 * Keep Nothing New's own six-mode spectral stream function and its curves.
 * The independent particle integration / trail lifecycle is informed by the
 * Flow Fields demo: https://github.com/evoluteur/flow-fields .
 * No upstream Perlin implementation or source code is embedded here.
 */

export const SPECTRAL_TRACER_BACKGROUND = 3200
export const SPECTRAL_TRACER_FOREGROUND = 120
// Requested density remains compatible with the historic home animation.
const BACKGROUND_RENDER_CAPACITY = 520
const FOREGROUND_RENDER_CAPACITY = 68
export const SPECTRAL_TRACER_CAPACITY = 520

const BACKGROUND_CLEARANCE = 36
const FOREGROUND_CLEARANCE = 8
const MAX_TRAIL_POINTS = 96
const PREWARM_INTERVAL = 1 / 45
const R2_G = 1.324717957244746
const R2_A1 = 1 / R2_G
const R2_A2 = 1 / (R2_G * R2_G)

// Original spectrum, amplitudes and phases from the spectral tracer system.
const FIELD_KX = [1, 2, 3, 1, 4, 2] as const
const FIELD_KY = [2, -1, 1, -3, 2, 5] as const
const FIELD_AMPLITUDES = [1, 0.72, 0.5, 0.38, 0.26, 0.18] as const
const FIELD_PHASES = [0.31, 2.17, 4.02, 5.41, 1.24, 3.52] as const

type TracerColor = readonly [number, number, number]

const DAY_TRACER_COLORS = [
  [31, 101, 179],
  [45, 126, 190],
  [99, 75, 171],
] as const satisfies readonly TracerColor[]

const NIGHT_TRACER_COLORS = [
  [78, 201, 250],
  [99, 173, 254],
  [177, 142, 254],
] as const satisfies readonly TracerColor[]

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
  colours?: readonly [TracerColor, TracerColor, TracerColor]
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

type TracerParticle = {
  x: number
  y: number
  age: number
  lifetime: number
  bucket: number
  // Circular history, oldest -> newest, for continuous, visible spectral curves.
  trail: Float32Array
  head: number
  length: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function fract(value: number) {
  return value - Math.floor(value)
}

function mixColor(a: TracerColor, b: TracerColor, amount: number) {
  const channel = (index: number) => Math.round(a[index] + (b[index] - a[index]) * amount)
  return "rgb(" + channel(0) + ", " + channel(1) + ", " + channel(2) + ")"
}

/**
 * The original spectral flow: V = J grad(psi), where
 * psi = sum a_k sin(k_x * nx * aspect + k_y * ny + lambda_k*t + phase_k).
 * The common coordinate derivative cancels when calculating direction.
 * In particular, the original eigenfrequencies remain the flow's driver.
 */
export function spectralDirectionAt(
  x: number,
  y: number,
  time: number,
  width: number,
  height: number,
  modeCount: number,
) {
  const safeHeight = Math.max(height, 1)
  const aspect = Math.max(width, 1) / safeHeight
  const nx = (x / Math.max(width, 1)) * 2 - 1
  const ny = (y / safeHeight) * 2 - 1
  let vx = 0
  let vy = 0

  for (let mode = 0; mode < Math.min(Math.max(0, modeCount), FIELD_KX.length); mode++) {
    const phase =
      FIELD_KX[mode] * nx * aspect +
      FIELD_KY[mode] * ny +
      SPECTRAL_LAMBDAS[mode] * time +
      FIELD_PHASES[mode]
    const term = FIELD_AMPLITUDES[mode] * Math.cos(phase)
    vx += FIELD_KY[mode] * term
    vy -= FIELD_KX[mode] * term
  }

  // Keep the original pixel-aspect correction from the old tracer field.
  vx /= Math.max(aspect, 0.65)
  const magnitude = Math.hypot(vx, vy)
  if (magnitude < 1e-6) return { x: 0, y: 0 }
  return { x: vx / magnitude, y: vy / magnitude }
}

function pointInObstacle(
  x: number,
  y: number,
  obstacles: readonly TracerObstacle[],
  clearance: number,
) {
  return obstacles.some(
    (o) =>
      x >= o.left - clearance &&
      x <= o.right + clearance &&
      y >= o.top - clearance &&
      y <= o.bottom + clearance,
  )
}

// Midpoint integration is much less angular than Euler's method and retains
// smooth spectral arcs even as the eigenmode phases evolve in time.
function traceStep(
  x: number,
  y: number,
  time: number,
  seconds: number,
  speed: number,
  width: number,
  height: number,
  modes: number,
) {
  const first = spectralDirectionAt(x, y, time, width, height, modes)
  const middleX = x + first.x * seconds * speed * 0.5
  const middleY = y + first.y * seconds * speed * 0.5
  const middle = spectralDirectionAt(
    middleX,
    middleY,
    time + seconds * SPECTRAL_PLAYBACK_RATE * 0.5,
    width,
    height,
    modes,
  )
  return { x: x + middle.x * seconds * speed, y: y + middle.y * seconds * speed }
}

function pushTrail(p: TracerParticle, x: number, y: number) {
  const offset = p.head * 2
  p.trail[offset] = x
  p.trail[offset + 1] = y
  p.head = (p.head + 1) % MAX_TRAIL_POINTS
  p.length = Math.min(MAX_TRAIL_POINTS, p.length + 1)
}

function createLayerRenderer(canvas: HTMLCanvasElement, layer: 0 | 1) {
  const context = canvas.getContext("2d", { alpha: true })
  if (!context) return null
  const particles: TracerParticle[] = []
  const clearance = layer === 0 ? BACKGROUND_CLEARANCE : FOREGROUND_CLEARANCE
  const speed = layer === 0 ? 86 : 75
  let width = 1
  let height = 1
  let pixelRatio = 1
  let seedIndex = layer === 0 ? 0 : 10007
  let previousTime: number | null = null
  let destroyed = false

  function spawn(p: TracerParticle, frame: SpectralTracerFrame, length: number) {
    // R2 quasirandom positions avoid visual clumping and retain the site's
    // deterministic seed distribution. No per-frame full-screen reseeding.
    for (let attempt = 0; attempt < 36; attempt++) {
      const sample = ++seedIndex
      const x = fract(0.5 + R2_A1 * sample) * width
      const y = fract(0.5 + R2_A2 * sample) * height
      if (pointInObstacle(x, y, frame.obstacles, clearance)) continue

      p.x = x
      p.y = y
      p.age = 0
      p.lifetime = 5 + fract(sample * R2_A1) * 6
      p.bucket = sample % 3
      p.head = 0
      p.length = 0

      // Seed a long *connected* part of the original spectral streamline.
      // Curves are visible immediately, not only after 3 seconds of animation.
      const backward: Array<{ x: number; y: number }> = []
      let cursorX = x
      let cursorY = y
      const warmCount = Math.min(length - 1, 52)
      for (let index = 1; index <= warmCount; index++) {
        const previous = traceStep(
          cursorX,
          cursorY,
          frame.time - (index - 1) * PREWARM_INTERVAL * SPECTRAL_PLAYBACK_RATE,
          -PREWARM_INTERVAL,
          speed,
          width,
          height,
          frame.modeCount,
        )
        if (
          previous.x < 0 || previous.x > width || previous.y < 0 || previous.y > height ||
          pointInObstacle(previous.x, previous.y, frame.obstacles, clearance)
        ) break
        backward.push(previous)
        cursorX = previous.x
        cursorY = previous.y
      }
      for (let index = backward.length - 1; index >= 0; index--) {
        pushTrail(p, backward[index].x, backward[index].y)
      }
      pushTrail(p, x, y)
      return
    }
    p.length = 0
    p.age = p.lifetime
  }

  const resize = (nextWidth: number, nextHeight: number, ratio: number) => {
    if (destroyed) return
    const targetWidth = Math.max(1, nextWidth)
    const targetHeight = Math.max(1, nextHeight)
    const targetRatio = Math.max(1, ratio)
    const physicalWidth = Math.max(1, Math.floor(targetWidth * targetRatio))
    const physicalHeight = Math.max(1, Math.floor(targetHeight * targetRatio))
    const changed =
      width !== targetWidth || height !== targetHeight ||
      canvas.width !== physicalWidth || canvas.height !== physicalHeight
    width = targetWidth
    height = targetHeight
    pixelRatio = targetRatio
    if (canvas.width !== physicalWidth) canvas.width = physicalWidth
    if (canvas.height !== physicalHeight) canvas.height = physicalHeight
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    if (changed) {
      particles.length = 0
      previousTime = null
      context.clearRect(0, 0, width, height)
    }
  }

  const render = (frame: SpectralTracerFrame) => {
    if (destroyed) return
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    const requested = layer === 0 ? frame.backgroundCount : frame.foregroundCount
    const nominal = layer === 0 ? SPECTRAL_TRACER_BACKGROUND : SPECTRAL_TRACER_FOREGROUND
    const capacity = layer === 0 ? BACKGROUND_RENDER_CAPACITY : FOREGROUND_RENDER_CAPACITY
    const count = clamp(Math.round((requested / nominal) * capacity), 0, capacity)

    if (count === 0 || frame.alpha <= 0.001) {
      context.globalCompositeOperation = "source-over"
      context.globalAlpha = 1
      context.clearRect(0, 0, width, height)
      particles.length = 0
      previousTime = frame.time
      return
    }

    // The 300-second home story restarts its eigenmode clock each cycle.
    // Never connect a previous cycle's strokes to the new initial condition.
    if (previousTime !== null && frame.time < previousTime) {
      context.clearRect(0, 0, width, height)
      particles.length = 0
      previousTime = null
    }
    const dt = previousTime === null
      ? 0
      : clamp((frame.time - previousTime) / SPECTRAL_PLAYBACK_RATE, 0, 0.06)
    previousTime = frame.time
    const trailLength = clamp(Math.round(frame.trailSamples * 12), 48, MAX_TRAIL_POINTS)

    if (dt > 0) {
      // Flow Fields accumulation: fade the transparent canvas, then add *only*
      // newly traveled segments. The spectral geometry stays from this site.
      context.globalCompositeOperation = "destination-out"
      context.globalAlpha = 1 - Math.exp(-dt / (layer === 0 ? 2.6 : 2.1))
      context.fillRect(0, 0, width, height)
    }
    context.globalCompositeOperation = "source-over"
    context.globalAlpha = 1

    while (particles.length > count) particles.pop()
    const paths = [new Path2D(), new Path2D(), new Path2D()]
    const appendSeedCurve = (particle: TracerParticle) => {
      if (particle.length < 2) return
      const begin = (particle.head - particle.length + MAX_TRAIL_POINTS) % MAX_TRAIL_POINTS
      const path = paths[particle.bucket]
      let previousValid = false
      for (let index = 0; index < particle.length; index++) {
        const offset = ((begin + index) % MAX_TRAIL_POINTS) * 2
        const x = particle.trail[offset]
        const y = particle.trail[offset + 1]
        const valid = !pointInObstacle(x, y, frame.obstacles, clearance)
        if (valid && !previousValid) path.moveTo(x, y)
        else if (valid) path.lineTo(x, y)
        previousValid = valid
      }
    }

    while (particles.length < count) {
      const particle: TracerParticle = {
        x: 0,
        y: 0,
        age: 0,
        lifetime: 0,
        bucket: 0,
        trail: new Float32Array(MAX_TRAIL_POINTS * 2),
        head: 0,
        length: 0,
      }
      spawn(particle, frame, trailLength)
      particles.push(particle)
      appendSeedCurve(particle)
    }

    for (const particle of particles) {
      if (particle.length === 0 || particle.age >= particle.lifetime) {
        spawn(particle, frame, trailLength)
        appendSeedCurve(particle)
      }
      if (dt <= 0 || particle.length === 0) continue
      const previousX = particle.x
      const previousY = particle.y
      const next = traceStep(
        previousX, previousY, frame.time, dt, speed, width, height, frame.modeCount,
      )
      if (
        next.x < 0 || next.x > width || next.y < 0 || next.y > height ||
        pointInObstacle(next.x, next.y, frame.obstacles, clearance) ||
        pointInObstacle((next.x + previousX) / 2, (next.y + previousY) / 2, frame.obstacles, clearance)
      ) {
        spawn(particle, frame, trailLength)
        appendSeedCurve(particle)
        continue
      }
      particle.x = next.x
      particle.y = next.y
      particle.age += dt
      pushTrail(particle, next.x, next.y)
      const path = paths[particle.bucket]
      path.moveTo(previousX, previousY)
      path.lineTo(next.x, next.y)
    }

    // Strong visible cores over the home's artwork. A fine luminous under-
    // stroke at night adds depth without turning the curves into fuzzy hairs.
    const theme = clamp(frame.theme, 0, 1)
    const gain = clamp(frame.alpha * 0.66, 0, 1)
    context.lineCap = "round"
    context.lineJoin = "round"
    for (let bucket = 0; bucket < 3; bucket++) {
      const colour = frame.colours
        ? mixColor(frame.colours[bucket], frame.colours[bucket], 0)
        : mixColor(DAY_TRACER_COLORS[bucket], NIGHT_TRACER_COLORS[bucket], theme)
      context.strokeStyle = colour
      if (theme > 0.02) {
        context.globalCompositeOperation = "lighter"
        context.globalAlpha = gain * theme * 0.16
        context.lineWidth = layer === 0 ? 5.6 : 6.4
        context.stroke(paths[bucket])
      }
      context.globalCompositeOperation = "source-over"
      context.globalAlpha = gain * (layer === 0 ? 0.76 : 0.92)
      context.lineWidth = layer === 0 ? 1.95 : 2.45
      context.stroke(paths[bucket])
    }

    // The renderer is also used outside the homepage, where obstacles may
    // move with scrolling: remove existing persistent trails beneath them.
    context.globalAlpha = 1
    context.globalCompositeOperation = "source-over"
    for (const obstacle of frame.obstacles) {
      context.clearRect(
        obstacle.left - clearance,
        obstacle.top - clearance,
        obstacle.right - obstacle.left + clearance * 2,
        obstacle.bottom - obstacle.top + clearance * 2,
      )
    }
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    particles.length = 0
    context.globalAlpha = 1
    context.globalCompositeOperation = "source-over"
    context.clearRect(0, 0, width, height)
  }

  return { resize, render, destroy }
}

export function createSpectralTracerController(
  backCanvas: HTMLCanvasElement,
  frontCanvas: HTMLCanvasElement,
): SpectralTracerController | null {
  const back = createLayerRenderer(backCanvas, 0)
  const front = createLayerRenderer(frontCanvas, 1)
  if (!back || !front) return null
  return {
    resize: (width, height, pixelRatio) => {
      back.resize(width, height, pixelRatio)
      front.resize(width, height, pixelRatio)
    },
    render: (frame) => {
      back.render(frame)
      front.render(frame)
    },
    destroy: () => {
      back.destroy()
      front.destroy()
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
