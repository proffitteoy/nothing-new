"use client"

import { useEffect, useEffectEvent, useRef, type RefObject } from "react"
import { getImageProps } from "next/image"
import { useTheme } from "./ThemeProvider"
import { useFieldMode } from "./FieldModeProvider"
import {
  createHomeVisitClock,
  HOME_IMAGE_SIZE,
  homeCycleAt,
  homeImageRect,
} from "../lib/home-scene"

import {
  createSpectralTracerController,
  type SpectralTracerFrame,
} from "./field/SpectralTracerLayer"
import {
  sampleSpectralFamily,
  spectralParameterAt,
  SPECTRAL_PLAYBACK_RATE,
} from "./field/spectralField"

declare global {
  interface Window {
    __homeVisitClock?: ReturnType<typeof createHomeVisitClock> & { stop: () => void }
  }
}

export default function HomeSpectralCanvas({
  host,
  side,
}: {
  host: RefObject<HTMLElement | null>
  side: "music" | "papers" | null
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { isDark } = useTheme()
  const { performanceMode } = useFieldMode()
  const options = useEffectEvent(() => ({ isDark, performanceMode, side }))

  useEffect(() => {
    const surface = canvas.current,
      stage = host.current
    const ctx = surface?.getContext("2d", { alpha: false })
    if (!surface || !stage || !ctx) return
    const clock =
      window.__homeVisitClock ?? createHomeVisitClock(performance.now(), !document.hidden)
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const ink = document.createElement("canvas"),
      inkCtx = ink.getContext("2d")!
    const art = document.createElement("canvas"),
      artCtx = art.getContext("2d", { alpha: false })!
    const picture = document.createElement("canvas"),
      pictureCtx = picture.getContext("2d")!
    const columns = 12,
      rows = 9
    const back = document.createElement("canvas")
    const front = document.createElement("canvas")
    const tracers = createSpectralTracerController(back, front)
    if (!tracers) return
    const image = new Image()
    const { props } = getImageProps({
      src: "/background.png",
      alt: "",
      width: 1672,
      height: 941,
      sizes: "max(100vw, 177.7vh)",
      quality: 75,
    })
    image.decoding = "async"
    image.sizes = props.sizes ?? ""
    image.srcset = props.srcSet ?? ""
    image.src = props.src
    image.onerror = () => {
      surface.dataset.homeArtwork = "error"
    }
    let frame = 0,
      timer: ReturnType<typeof setTimeout> | undefined
    let previous = 0,
      width = 0,
      height = 0,
      ratio = 0,
      pictureBlend = -1
    let blend = Number(options().isDark),
      pan = 0.5,
      stopped = false,
      degraded = false
    let windowStart = performance.now(),
      windowFrames = 0,
      slowWindows = 0
    let totalCost = 0,
      draws = 0,
      maximumCost = 0

    const render = (now: number) => {
      frame = 0
      if (stopped || document.hidden) return
      // The opening owns the main thread until its final frame. A hidden
      // full-screen spectral renderer must not compete with it for frames.
      if (document.documentElement.dataset.startupPhase !== "ready") return
      const settings = options()
      const interval = reduced.matches
        ? 1000
        : degraded
          ? 1000 / 18
          : settings.performanceMode === "field"
            ? 1000 / 45
            : 1000 / 24
      if (previous && now - previous < interval) {
        frame = requestAnimationFrame(render)
        return
      }
      const dt = previous ? now - previous : interval
      previous = now
      if (!reduced.matches && ++windowFrames && now - windowStart >= 2000) {
        const fps = (windowFrames * 1000) / (now - windowStart)
        stage.dataset.homeFps = fps.toFixed(1)
        slowWindows = fps < (settings.performanceMode === "field" ? 24 : 14) ? slowWindows + 1 : 0
        if (slowWindows >= 2) degraded = true
        windowStart = now
        windowFrames = 0
      }
      const began = performance.now()
      const nextRatio = Math.min(
        devicePixelRatio || 1,
        settings.performanceMode === "field" && !degraded ? 1.5 : 1,
      )
      if (width !== innerWidth || height !== innerHeight || ratio !== nextRatio) {
        width = innerWidth
        height = innerHeight
        ratio = nextRatio
        for (const layer of [surface, ink, art]) {
          layer.width = Math.round(width * ratio)
          layer.height = Math.round(height * ratio)
        }
        for (const context of [ctx, inkCtx, artCtx]) context.setTransform(ratio, 0, 0, ratio, 0, 0)
        tracers.resize(width, height, ratio)
      }
      const elapsed = clock.read(now) / 1000,
        cycle = homeCycleAt(elapsed)
      const disruption = reduced.matches ? 0 : cycle.disruption
      const reset =
        Math.min(1, cycle.seconds / 4) *
        (cycle.seconds < 265 ? 1 : Math.max(0, 1 - (cycle.seconds - 265) / 25))
      const rect = homeImageRect(width, height)
      const targetPan = settings.side === "music" ? 0 : settings.side === "papers" ? 1 : 0.5
      pan += (targetPan - pan) * (reduced.matches ? 1 : 0.16)
      if (Math.abs(targetPan - pan) < 0.001) pan = targetPan
      rect.x = (width - rect.width) * pan
      blend += (Number(settings.isDark) - blend) * (reduced.matches ? 1 : 1 - Math.exp(-dt / 200))
      if (Math.abs(blend - Number(settings.isDark)) < 0.001) blend = Number(settings.isDark)
      const ground = `rgb(${237 - 226 * blend},${245 - 223 * blend},${255 - 215 * blend})`
      if (image.complete && image.naturalWidth) {
        const level = Math.round(blend * 60) / 60
        if (pictureBlend !== level) {
          picture.width = HOME_IMAGE_SIZE.width
          picture.height = HOME_IMAGE_SIZE.height
          // Only day/night lighting grades the original. Visit pigment never
          // enters this cache: visit colour stays on the original spectral layer.
          pictureCtx.filter = `brightness(${1 - level * 0.56}) saturate(${1 - level * 0.18})`
          pictureCtx.drawImage(image, 0, 0, picture.width, picture.height)
          pictureCtx.filter = "none"
          if (level) {
            pictureCtx.globalCompositeOperation = "color"
            pictureCtx.globalAlpha = level * 0.45
            pictureCtx.fillStyle = "#0b1628"
            pictureCtx.fillRect(0, 0, picture.width, picture.height)
          }
          pictureCtx.globalAlpha = 1
          pictureCtx.globalCompositeOperation = "source-over"
          pictureBlend = level
        }
      }

      if (!reduced.matches) {
        // Use the original renderer unchanged: same seeds, density, velocity
        // grid, streamline geometry and glow. Only the carried pigment varies.
        const light = [
          [74, 130, 192],
          [62, 153, 202],
          [86, 116, 196],
        ]
        const dark = [
          [30, 61, 120],
          [25, 88, 132],
          [42, 66, 140],
        ]
        const night = [
          [128, 185, 232],
          [121, 203, 232],
          [147, 177, 245],
        ]
        const pigment = (i: number): readonly [number, number, number] => {
          const channel = (c: number) => {
            const v = light[i][c]
            const day = v + (dark[i][c] - v) * cycle.depth
            return day + (night[i][c] * (1 - cycle.depth * 0.28) - day) * blend
          }
          return [channel(0), channel(1), channel(2)]
        }
        const colours: SpectralTracerFrame["colours"] = [pigment(0), pigment(1), pigment(2)]
        tracers.render({
          alpha: (2.8 - blend * 1.4) * reset,
          theme: blend,
          time: cycle.seconds * SPECTRAL_PLAYBACK_RATE,
          backgroundCount: degraded ? 1800 : 3200,
          foregroundCount: degraded ? 64 : 120,
          trailSamples: 8,
          modeCount: 6,
          width,
          height,
          obstacles: [],
          colours,
        })
        inkCtx.clearRect(0, 0, width, height)
        inkCtx.drawImage(back, 0, 0, width, height)
        inkCtx.drawImage(front, 0, 0, width, height)
        // Keep visit pigment around the central artwork; edge controls and
        // navigation retain a quiet surround throughout the visit cycle.
        inkCtx.globalCompositeOperation = "destination-in"
        const focus = inkCtx.createRadialGradient(
          width / 2,
          height * 0.55,
          0,
          width / 2,
          height * 0.55,
          width * 0.52,
        )
        focus.addColorStop(0, "#fff")
        focus.addColorStop(0.52, "#fff")
        focus.addColorStop(1, "#ffffff00")
        inkCtx.fillStyle = focus
        inkCtx.fillRect(0, 0, width, height)
        inkCtx.globalCompositeOperation = "source-over"
      }
      artCtx.fillStyle = ground
      artCtx.fillRect(0, 0, width, height)
      if (picture.width) artCtx.drawImage(picture, rect.x, rect.y, rect.width, rect.height)
      if (!reduced.matches) artCtx.drawImage(ink, 0, 0, width, height)
      ctx.fillStyle = ground
      ctx.fillRect(0, 0, width, height)
      if (disruption < 0.001) ctx.drawImage(art, 0, 0, width, height)
      else {
        // The source being torn apart already contains the deposited colour.
        // Original spectral displacement drives the fragment shifts;
        // rotation and loss of the intact underlay destroy the whole scene.
        ctx.globalAlpha = disruption * 0.85
        ctx.drawImage(ink, 0, 0, width, height)
        ctx.globalAlpha = 1 - disruption * 0.96
        ctx.drawImage(art, 0, 0, width, height)
        ctx.globalAlpha = 1
        const w = width / columns,
          h = height / rows
        for (let row = 0; row < rows; row++)
          for (let col = 0; col < columns; col++) {
            const fracture = disruption
            const v = sampleSpectralFamily(
              spectralParameterAt(row * columns + col),
              cycle.seconds * SPECTRAL_PLAYBACK_RATE,
            )
            const phase = row * 0.8 + col * 1.3
            const x = (col + 0.5) * w,
              y = (row + 0.5) * h
            ctx.save()
            ctx.translate(
              x + fracture * (v.x * 180 + Math.sin(phase) * 100),
              y + fracture * (v.y * 160 + Math.cos(phase) * 90),
            )
            ctx.rotate(Math.sin(phase) * fracture * 0.32)
            ctx.scale(1 - fracture * 0.28, 1 - fracture * 0.28)
            ctx.drawImage(
              art,
              col * w * ratio,
              row * h * ratio,
              w * ratio,
              h * ratio,
              -w / 2,
              -h / 2,
              w + 0.6,
              h + 0.6,
            )
            ctx.restore()
          }
      }
      stage.style.setProperty("--home-break", String(disruption))
      stage.style.setProperty("--home-chroma", String(disruption))
      stage.style.setProperty(
        "--home-sun-x",
        `${Math.max(56, Math.min(width - 56, rect.x + 1390 * rect.scale))}px`,
      )
      stage.style.setProperty("--home-sun-y", `${Math.max(128, rect.y + 145 * rect.scale)}px`)
      stage.dataset.homePhase = cycle.phase
      stage.dataset.homeElapsed = elapsed.toFixed(2)
      stage.dataset.homeQuality = reduced.matches
        ? "static"
        : degraded
          ? "adaptive-low"
          : settings.performanceMode
      stage.dataset.homeImageRect = JSON.stringify(rect)
      stage.dataset.homeBufferBytes = String(
        [surface, ink, art, picture, back, front].reduce((n, c) => n + c.width * c.height, 0) * 4,
      )
      const cost = performance.now() - began
      totalCost += cost
      draws++
      maximumCost = Math.max(maximumCost, cost)
      if (draws % 24 === 0) {
        stage.dataset.homeDrawMs = (totalCost / draws).toFixed(2)
        stage.dataset.homeMaxDrawMs = maximumCost.toFixed(2)
      }
      if (reduced.matches) timer = setTimeout(() => render(performance.now()), 1000)
      else frame = requestAnimationFrame(render)
    }
    const redraw = () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      previous = 0
      if (!document.hidden) render(performance.now())
    }
    const visibility = () => {
      clock.visibility(performance.now(), !document.hidden)
      windowStart = performance.now()
      windowFrames = 0
      redraw()
    }
    window.__homeVisitClock?.stop()
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("home-scene-settings", redraw)
    window.addEventListener("resize", redraw)
    window.addEventListener("site-startup-phase", redraw)
    reduced.addEventListener("change", redraw)
    image.onload = () => {
      surface.dataset.homeArtwork = "ready"
      pictureBlend = -1
      redraw()
    }
    frame = requestAnimationFrame(render)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("home-scene-settings", redraw)
      window.removeEventListener("resize", redraw)
      window.removeEventListener("site-startup-phase", redraw)
      reduced.removeEventListener("change", redraw)
      image.onload = null
      image.onerror = null
      tracers.destroy()
      for (const layer of [surface, ink, art, picture, back, front]) {
        layer.width = 0
        layer.height = 0
      }
    }
  }, [host])
  useEffect(() => {
    window.dispatchEvent(new Event("home-scene-settings"))
  }, [isDark, performanceMode, side])
  return <canvas ref={canvas} aria-hidden="true" data-home-canvas data-home-artwork="loading" />
}
