"use client"

import { useEffect, useRef, type RefObject } from "react"
import { createHomeVisitClock } from "../lib/home-scene"
import {
  createSpectralTracerController,
  type SpectralTracerFrame,
} from "./field/SpectralTracerLayer"
import { SPECTRAL_PLAYBACK_RATE } from "./field/spectralField"

declare global {
  interface Window {
    __homeVisitClock?: ReturnType<typeof createHomeVisitClock> & { stop: () => void }
  }
}

// Fixed high-contrast palette: preserve the site's original six-mode spectral curves
// without changing their colours with the clock or painting a wallpaper.
const FIELD_COLOURS = [
  [96, 199, 255],
  [185, 144, 255],
  [255, 133, 195],
] as const satisfies NonNullable<SpectralTracerFrame["colours"]>

export default function HomeSpectralCanvas({
  host,
}: {
  host: RefObject<HTMLElement | null>
}) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const surface = canvas.current
    const stage = host.current
    const ctx = surface?.getContext("2d", { alpha: true })
    if (!surface || !stage || !ctx) return

    const clock =
      window.__homeVisitClock ?? createHomeVisitClock(performance.now(), !document.hidden)
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const back = document.createElement("canvas")
    const front = document.createElement("canvas")
    const tracers = createSpectralTracerController(back, front)
    if (!tracers) return

    let frame = 0
    let previous = 0
    let particleClockOrigin: number | null = null
    let width = 0
    let height = 0
    let ratio = 0
    let stopped = false
    let degraded = false
    let windowStart = performance.now()
    let windowFrames = 0
    let slowWindows = 0
    let totalCost = 0
    let draws = 0
    let maximumCost = 0

    // SplashScreen checks this attribute before revealing the homepage.
    // There is no longer any background image to download or decode.
    surface.dataset.homeArtwork = "ready"

    const render = (now: number) => {
      frame = 0
      if (stopped || document.hidden) return
      if (document.documentElement.dataset.startupPhase !== "ready") return

      // One high-performance baseline, independent of legacy saved mode values.
      const interval = reduced.matches ? 1000 : degraded ? 1000 / 18 : 1000 / 45
      if (previous && now - previous < interval) {
        frame = requestAnimationFrame(render)
        return
      }

      previous = now
      if (!reduced.matches && ++windowFrames && now - windowStart >= 2000) {
        const fps = (windowFrames * 1000) / (now - windowStart)
        stage.dataset.homeFps = fps.toFixed(1)
        slowWindows = fps < 24 ? slowWindows + 1 : 0
        if (slowWindows >= 2) degraded = true
        windowStart = now
        windowFrames = 0
      }

      const began = performance.now()
      const nextRatio = Math.min(devicePixelRatio || 1, degraded ? 1 : 1.5)
      if (width !== innerWidth || height !== innerHeight || ratio !== nextRatio) {
        width = innerWidth
        height = innerHeight
        ratio = nextRatio
        surface.width = Math.round(width * ratio)
        surface.height = Math.round(height * ratio)
        tracers.resize(width, height, ratio)
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      // Start the spectral motion at the precise post-splash handoff, so
      // a 7.4-second opening cannot advance or scramble the first curves.
      const activeTime = clock.read(now)
      if (particleClockOrigin === null) particleClockOrigin = activeTime
      const elapsed = Math.max(0, activeTime - particleClockOrigin) / 1000
      tracers.render({
        alpha: 1.25,
        motion: "ambient",
        time: elapsed * SPECTRAL_PLAYBACK_RATE,
        backgroundCount: degraded ? 1800 : 3200,
        foregroundCount: degraded ? 64 : 120,
        trailSamples: 8,
        modeCount: 6,
        width,
        height,
        obstacles: [],
        colours: FIELD_COLOURS,
      })

      // A transparent composition keeps the site surface and examples visible.
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(back, 0, 0, width, height)
      ctx.drawImage(front, 0, 0, width, height)

      stage.dataset.homePhase = "field"
      stage.dataset.homeElapsed = elapsed.toFixed(2)
      stage.dataset.homeQuality = reduced.matches ? "static" : degraded ? "adaptive-low" : "high"
      stage.dataset.homeBufferBytes = String(
        [surface, back, front].reduce((n, c) => n + c.width * c.height, 0) * 4,
      )
      const cost = performance.now() - began
      totalCost += cost
      draws++
      maximumCost = Math.max(maximumCost, cost)
      if (draws % 24 === 0) {
        stage.dataset.homeDrawMs = (totalCost / draws).toFixed(2)
        stage.dataset.homeMaxDrawMs = maximumCost.toFixed(2)
      }

      // Reduced motion shows a single still set of original spectral curves.
      if (!reduced.matches) frame = requestAnimationFrame(render)
    }

    const redraw = () => {
      cancelAnimationFrame(frame)
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
    window.addEventListener("resize", redraw)
    window.addEventListener("site-startup-phase", redraw)
    reduced.addEventListener("change", redraw)
    frame = requestAnimationFrame(render)

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("resize", redraw)
      window.removeEventListener("site-startup-phase", redraw)
      reduced.removeEventListener("change", redraw)
      tracers.destroy()
      for (const layer of [surface, back, front]) {
        layer.width = 0
        layer.height = 0
      }
    }
  }, [host])

  return <canvas ref={canvas} aria-hidden="true" data-home-canvas data-home-artwork="ready" />
}
