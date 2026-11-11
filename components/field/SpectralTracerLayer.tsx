"use client"

import type { RefObject } from "react"
import { SPECTRAL_PLAYBACK_RATE } from "./spectralField"

/*
 * Flow-field motion and the seeded 3D Perlin implementation are adapted from
 * evoluteur/flow-fields, Copyright (c) 2026 Olivier Giulieri (MIT).
 * See third_party/flow-fields/LICENSE for the upstream license.
 */

export const SPECTRAL_TRACER_BACKGROUND = 400
export const SPECTRAL_TRACER_FOREGROUND = 32
export const SPECTRAL_TRACER_CAPACITY = 512

const BACKGROUND_CLEARANCE = 24
const FOREGROUND_CLEARANCE = 12
const MAX_SPAWN_ATTEMPTS = 20
const TAU = Math.PI * 2

type TracerColor = readonly [number, number, number]

const DAY_COLORS = [
  [57, 117, 177],
  [79, 147, 192],
  [113, 113, 169],
] as const satisfies readonly TracerColor[]

const NIGHT_COLORS = [
  [100, 166, 210],
  [123, 177, 221],
  [157, 149, 213],
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

type LayerRenderer = SpectralTracerController

type Particle = {
  x: number
  y: number
  life: number
  color: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function randomGenerator(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

// Ported from the seeded improved-Perlin implementation in evoluteur/flow-fields.
// The permutation is local to each renderer: mounting a field cannot mutate
// global noise state or the state of another canvas.
function createPerlinNoise(seed: number) {
  const permutation = new Uint8Array(512)
  const source = Array.from({ length: 256 }, (_, index) => index)
  let state = seed >>> 0 || 1
  const random = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }

  for (let index = 255; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[source[index], source[other]] = [source[other], source[index]]
  }
  for (let index = 0; index < 512; index++) {
    permutation[index] = source[index & 255]
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (t: number, from: number, to: number) => from + t * (to - from)
  const grad = (hash: number, x: number, y: number, z: number) => {
    const u = (hash & 15) < 8 ? x : y
    const v = (hash & 15) < 4 ? y : (hash & 15) === 12 || (hash & 15) === 14 ? x : z
    return ((hash & 1) === 0 ? u : -u) + ((hash & 2) === 0 ? v : -v)
  }

  return (x: number, y: number, z: number) => {
    const fx = Math.floor(x)
    const fy = Math.floor(y)
    const fz = Math.floor(z)
    const X = fx & 255
    const Y = fy & 255
    const Z = fz & 255
    x -= fx
    y -= fy
    z -= fz
    const u = fade(x)
    const v = fade(y)
    const w = fade(z)
    const A = permutation[X] + Y
    const AA = permutation[A] + Z
    const AB = permutation[A + 1] + Z
    const B = permutation[X + 1] + Y
    const BA = permutation[B] + Z
    const BB = permutation[B + 1] + Z

    return lerp(
      w,
      lerp(
        v,
        lerp(u, grad(permutation[AA], x, y, z), grad(permutation[BA], x - 1, y, z)),
        lerp(u, grad(permutation[AB], x, y - 1, z), grad(permutation[BB], x - 1, y - 1, z)),
      ),
      lerp(
        v,
        lerp(u, grad(permutation[AA + 1], x, y, z - 1), grad(permutation[BA + 1], x - 1, y, z - 1)),
        lerp(u, grad(permutation[AB + 1], x, y - 1, z - 1), grad(permutation[BB + 1], x - 1, y - 1, z - 1)),
      ),
    )
  }
}

function intersectsObstacle(
  x: number,
  y: number,
  obstacles: readonly TracerObstacle[],
  clearance: number,
) {
  return obstacles.some(
    (obstacle) =>
      x >= obstacle.left - clearance &&
      x <= obstacle.right + clearance &&
      y >= obstacle.top - clearance &&
      y <= obstacle.bottom + clearance,
  )
}

function mixColor(a: TracerColor, b: TracerColor, theme: number) {
  const mix = (index: number) => Math.round(a[index] + (b[index] - a[index]) * theme)
  return "rgb(" + mix(0) + ", " + mix(1) + ", " + mix(2) + ")"
}

function createLayerRenderer(
  canvas: HTMLCanvasElement,
  layer: 0 | 1,
): LayerRenderer | null {
  const context = canvas.getContext("2d", { alpha: true })
  if (!context) return null

  const random = randomGenerator(0x2a6b8f03 + layer * 317)
  const noise = createPerlinNoise(0x5d12c1ef)
  const particles: Particle[] = []
  const clearance = layer === 0 ? BACKGROUND_CLEARANCE : FOREGROUND_CLEARANCE
  let width = 1
  let height = 1
  let pixelRatio = 1
  let previousTime: number | null = null
  let destroyed = false

  const spawn = (particle: Particle, obstacles: readonly TracerObstacle[]) => {
    for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
      const x = random() * width
      const y = random() * height
      if (intersectsObstacle(x, y, obstacles, clearance)) continue
      particle.x = x
      particle.y = y
      particle.life = 3.5 + random() * 6
      particle.color = Math.floor(random() * 3)
      return true
    }
    particle.life = 0
    return false
  }

  const resize = (nextWidth: number, nextHeight: number, ratio: number) => {
    if (destroyed) return
    const actualWidth = Math.max(1, nextWidth)
    const actualHeight = Math.max(1, nextHeight)
    const actualRatio = Math.max(1, ratio)
    const physicalWidth = Math.max(1, Math.floor(actualWidth * actualRatio))
    const physicalHeight = Math.max(1, Math.floor(actualHeight * actualRatio))
    const changed =
      canvas.width !== physicalWidth || canvas.height !== physicalHeight ||
      actualWidth !== width || actualHeight !== height
    width = actualWidth
    height = actualHeight
    pixelRatio = actualRatio
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

  const maskObstacles = (obstacles: readonly TracerObstacle[]) => {
    // Persistent trails must be erased under the latest layout, even after
    // scrolling or a panel entering a previously unobstructed region.
    for (const obstacle of obstacles) {
      context.clearRect(
        obstacle.left - clearance,
        obstacle.top - clearance,
        obstacle.right - obstacle.left + clearance * 2,
        obstacle.bottom - obstacle.top + clearance * 2,
      )
    }
  }

  const render = (frame: SpectralTracerFrame) => {
    if (destroyed) return
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    const requested = layer === 0 ? frame.backgroundCount : frame.foregroundCount
    const count = clamp(Math.round(requested), 0, SPECTRAL_TRACER_CAPACITY)
    if (frame.alpha <= 0.001 || count === 0) {
      context.clearRect(0, 0, width, height)
      particles.length = 0
      previousTime = frame.time
      return
    }

    const rawDelta =
      previousTime === null ? 1 / 60 : Math.max(0, (frame.time - previousTime) / SPECTRAL_PLAYBACK_RATE)
    previousTime = frame.time
    const dt = Math.min(rawDelta, 0.05)
    if (dt <= 0) {
      maskObstacles(frame.obstacles)
      return
    }

    while (particles.length > count) particles.pop()
    while (particles.length < count) {
      const particle: Particle = { x: 0, y: 0, life: 0, color: 0 }
      spawn(particle, frame.obstacles)
      particles.push(particle)
    }

    // Translucent destination-out fading retains the actual trajectory of each
    // moving particle without painting an opaque background over the page.
    const persistence = clamp(frame.trailSamples / 8, 0.6, 1.3)
    context.globalCompositeOperation = "destination-out"
    context.globalAlpha = 1 - Math.exp(-dt / ((layer === 0 ? 1.5 : 1.1) * persistence))
    context.fillRect(0, 0, width, height)

    const paths = [new Path2D(), new Path2D(), new Path2D()]
    const speed = layer === 0 ? 34 : 26
    const movement = Math.min(speed * dt, 2.4)
    const fieldScale = 0.0018
    const twist = 2.6 + 0.12 * (clamp(frame.modeCount, 1, 6) - 4)
    for (const particle of particles) {
      if (particle.life <= 0 && !spawn(particle, frame.obstacles)) continue
      // Perlin angular flow from flow-fields: positions, not fixed seeds,
      // are integrated through the field as time advances.
      const angle = noise(
        particle.x * fieldScale,
        particle.y * fieldScale,
        frame.time * 0.11,
      ) * twist + 0.18
      const nextX = particle.x + Math.cos(angle) * movement
      const nextY = particle.y + Math.sin(angle) * movement
      if (
        nextX < 0 || nextY < 0 || nextX > width || nextY > height ||
        intersectsObstacle(nextX, nextY, frame.obstacles, clearance)
      ) {
        spawn(particle, frame.obstacles)
        continue
      }
      const path = paths[particle.color]
      path.moveTo(particle.x, particle.y)
      path.lineTo(nextX, nextY)
      particle.x = nextX
      particle.y = nextY
      particle.life -= dt
    }

    context.globalCompositeOperation = "source-over"
    context.lineCap = "round"
    context.lineJoin = "round"
    context.lineWidth = layer === 0 ? 0.85 : 1.05
    context.globalAlpha = clamp(frame.alpha, 0, 1) * (layer === 0 ? 0.22 : 0.3)

    const theme = clamp(frame.theme, 0, 1)
    for (let index = 0; index < paths.length; index++) {
      context.strokeStyle = frame.colours
        ? mixColor(frame.colours[index], frame.colours[index], 0)
        : mixColor(DAY_COLORS[index], NIGHT_COLORS[index], theme)
      context.stroke(paths[index])
    }
    maskObstacles(frame.obstacles)
    context.globalAlpha = 1
    context.globalCompositeOperation = "source-over"
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    particles.length = 0
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
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
    resize: (width, height, ratio) => {
      back.resize(width, height, ratio)
      front.resize(width, height, ratio)
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
