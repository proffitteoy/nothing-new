"use client"

import Image from "next/image"
import { useEffect, useRef, type RefObject } from "react"
import { createHomeVisitClock } from "../lib/home-scene"
import {
  createSpectralTracerController,
  type SpectralTracerFrame,
} from "./field/SpectralTracerLayer"
import { SPECTRAL_PLAYBACK_RATE } from "./field/spectralField"
import {
  HOME_MOUNTAIN_PROFILE,
  HOME_NEAR_SHORE,
  homeLandscapeRect,
  sampleSpectralScene,
  smoothHomePointer,
  createHomeSpectralLight,
} from "./field/homeSpectralScene"
import landscape from "../public/home-window/convict-lake-day-study.webp"
import styles from "./HomeScene.module.css"

declare global {
  interface Window {
    __homeVisitClock?: ReturnType<typeof createHomeVisitClock> & { stop: () => void }
  }
}

// The approved daylight compositor keeps the ambient field and its equations.
const FIELD_COLOURS = [
  [55, 104, 194],
  [112, 75, 188],
  [184, 84, 151],
] as const satisfies NonNullable<SpectralTracerFrame["colours"]>

export default function HomeSpectralCanvas({
  host,
  viewport,
}: {
  host: RefObject<HTMLElement | null>
  viewport: RefObject<HTMLElement | null>
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const artwork = useRef<HTMLDivElement>(null)
  const plates = useRef<HTMLDivElement>(null)
  const ready = (status: "ready" | "error") => {
    if (artwork.current) artwork.current.dataset.homeArtwork = status
  }

  useEffect(() => {
    const surface = canvas.current
    const stage = host.current
    const opening = viewport.current
    const planes = plates.current
    const ctx = surface?.getContext("2d", { alpha: true })
    if (!surface || !stage || !opening || !planes) return
    if (!ctx) {
      stage.setAttribute("data-home-quality", "static")
      stage.setAttribute("data-home-buffer-bytes", "0")
      surface.width = surface.height = 0
      return
    }

    const clock =
      window.__homeVisitClock ?? createHomeVisitClock(performance.now(), !document.hidden)
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const back = document.createElement("canvas")
    const front = document.createElement("canvas")
    const tracers = createSpectralTracerController(back, front)
    const light = createHomeSpectralLight()
    if (!tracers || !light) {
      tracers?.destroy()
      light?.release()
      for (const layer of [surface, back, front]) layer.width = layer.height = 0
      stage.setAttribute("data-home-quality", "static")
      stage.setAttribute("data-home-buffer-bytes", "0")
      return
    }

    let frame = 0
    let previous = 0
    let nextDraw = 0
    let particleClockOrigin: number | null = null
    let width = 0
    let height = 0
    let ratio = 0
    let stopped = false
    let degraded = false
    let staticFallback = false
    let windowStart = 0
    let windowFrames = 0
    let slowWindows = 0
    let totalCost = 0
    let draws = 0
    let maximumCost = 0
    let sampledAt = -Infinity
    let grid: ReturnType<typeof sampleSpectralScene> | undefined
    let bounds = opening.getBoundingClientRect()
    const target = { x: 0, y: 0 }
    const camera = { x: 0, y: 0 }

    const resetCamera = () => {
      camera.x = camera.y = target.x = target.y = 0
      opening.style.setProperty("--look-x", "0")
      opening.style.setProperty("--look-y", "0")
    }
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches || staticFallback) return
      target.x = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1),
      )
      target.y = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1),
      )
    }
    const leave = () => {
      target.x = target.y = 0
    }

    const render = (now: number) => {
      frame = 0
      if (stopped || document.hidden) return
      if (document.documentElement.dataset.startupPhase !== "ready") return

      stage.dataset.homeRenderer = "css"
      if (artwork.current?.dataset.homeArtwork === "error") staticFallback = true
      if (reduced.matches || staticFallback) {
        resetCamera()
        opening.dataset.homeRendering = "static"
        stage.dataset.homeQuality = "static"
        for (const layer of [surface, back, front]) layer.width = layer.height = 0
        light.release()
        ratio = 0
        stage.dataset.homeBufferBytes = String(
          [surface, back, front].reduce((n, c) => n + c.width * c.height * 4, 0) +
            light.bufferBytes,
        )
        return
      }

      // One high-performance baseline, independent of legacy saved mode values.
      const interval = degraded ? 1000 / 24 : 1000 / 45
      if (now < nextDraw - 0.5) {
        frame = requestAnimationFrame(render)
        return
      }

      const dt = previous ? (now - previous) / 1000 : 0
      previous = now
      // Preserve the fractional frame budget on 60/120Hz displays instead
      // of accidentally turning a 45fps target into a 30fps cap.
      nextDraw = Math.max(nextDraw + interval, now - interval)
      if (!windowStart) windowStart = now
      if (!reduced.matches && ++windowFrames && now - windowStart >= 2000) {
        const fps = (windowFrames * 1000) / (now - windowStart)
        stage.dataset.homeFps = fps.toFixed(1)
        slowWindows = fps < (degraded ? 16 : 24) ? slowWindows + 1 : 0
        if (slowWindows >= 2) {
          if (degraded) staticFallback = true
          degraded = true
          slowWindows = 0
          grid = undefined
        }
        windowStart = now
        windowFrames = 0
      }

      const began = performance.now()
      const nextRatio = Math.min(devicePixelRatio || 1, degraded ? 1 : 1.5)
      if (width !== bounds.width || height !== bounds.height || ratio !== nextRatio) {
        width = Math.max(1, bounds.width)
        height = Math.max(1, bounds.height)
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
      const fieldTime = elapsed * SPECTRAL_PLAYBACK_RATE
      camera.x = smoothHomePointer(camera.x, target.x, dt)
      camera.y = smoothHomePointer(camera.y, target.y, dt)
      opening.style.setProperty("--look-x", camera.x.toFixed(5))
      opening.style.setProperty("--look-y", camera.y.toFixed(5))
      tracers.render({
        alpha: 1.25,
        motion: "ambient",
        time: fieldTime,
        backgroundCount: degraded ? 1800 : 3200,
        foregroundCount: degraded ? 64 : 120,
        trailSamples: 8,
        modeCount: 6,
        width,
        height,
        obstacles: [],
        colours: FIELD_COLOURS,
      })

      if (!grid || elapsed - sampledAt >= 1 / (degraded ? 6 : 12)) {
        const columns = degraded ? 8 : 16
        const rows = degraded ? 5 : 9
        grid = sampleSpectralScene(
          width,
          height,
          fieldTime,
          columns,
          rows,
          grid?.values.length === columns * rows * 3 ? grid.values : undefined,
        )
        sampledAt = elapsed
      }
      ctx.clearRect(0, 0, width, height)
      light.render(ctx, back, front, grid, width, height, fieldTime, degraded, camera)
      opening.dataset.homeRendering = "dynamic"

      stage.dataset.homePhase = "field"
      stage.dataset.homeElapsed = elapsed.toFixed(2)
      stage.dataset.homeFieldTime = fieldTime.toFixed(4)
      stage.dataset.homeGridTime = grid.time.toFixed(4)
      stage.dataset.homeQuality = reduced.matches ? "static" : degraded ? "adaptive-low" : "high"
      stage.dataset.homeBufferBytes = String(
        [surface, back, front].reduce((n, c) => n + c.width * c.height, 0) * 4 + light.bufferBytes,
      )
      stage.dataset.homeLightMax = light.stats.envelopeMax.toFixed(5)
      stage.dataset.homeEffect = "spectral-mist"
      const cost = performance.now() - began
      totalCost += cost
      stage.dataset.homeDrawTotalMs = totalCost.toFixed(2)
      draws++
      stage.dataset.homeFrames = String(draws)
      maximumCost = Math.max(maximumCost, cost)
      if (draws % 24 === 0) {
        stage.dataset.homeDrawMs = (totalCost / draws).toFixed(2)
        stage.dataset.homeMaxDrawMs = maximumCost.toFixed(2)
      }

      // Static modes return above and never schedule a continuing loop.
      if (!reduced.matches) frame = requestAnimationFrame(render)
    }

    const redraw = () => {
      cancelAnimationFrame(frame)
      previous = 0
      nextDraw = 0
      windowStart = windowFrames = slowWindows = 0
      if (!document.hidden) render(performance.now())
    }
    const visibility = () => {
      clock.visibility(performance.now(), !document.hidden)
      bounds = opening.getBoundingClientRect()
      redraw()
    }

    window.__homeVisitClock?.stop()
    document.addEventListener("visibilitychange", visibility)
    const resize = () => {
      bounds = opening.getBoundingClientRect()
      const rect = homeLandscapeRect(bounds.width, bounds.height)
      Object.assign(planes.style, {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      })
      grid = undefined
      sampledAt = -Infinity
      redraw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(opening)
    window.addEventListener("blur", leave)
    opening.addEventListener("pointermove", pointer)
    opening.addEventListener("pointerleave", leave)
    window.addEventListener("site-startup-phase", redraw)
    reduced.addEventListener("change", redraw)
    resize()

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      document.removeEventListener("visibilitychange", visibility)
      observer.disconnect()
      window.removeEventListener("blur", leave)
      opening.removeEventListener("pointermove", pointer)
      opening.removeEventListener("pointerleave", leave)
      window.removeEventListener("site-startup-phase", redraw)
      reduced.removeEventListener("change", redraw)
      tracers.destroy()
      light.release()
      for (const layer of [surface, back, front]) {
        layer.width = 0
        layer.height = 0
      }
      resetCamera()
    }
  }, [host, viewport])

  const mountainMask = `polygon(${HOME_MOUNTAIN_PROFILE.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(",")},100% 100%,0% 100%)`
  const shoreMask = `polygon(${HOME_NEAR_SHORE.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(",")})`
  return (
    <>
      <div
        ref={artwork}
        className={styles.poster}
        data-home-artwork="loading"
        data-home-artwork-kind="daylight"
        aria-hidden="true"
      >
        <Image
          src={landscape}
          alt=""
          fill
          preload
          unoptimized
          onLoad={() => ready("ready")}
          onError={(event) => {
            event.currentTarget.hidden = true
            ready("error")
          }}
          sizes="82vw"
        />
      </div>
      <div className={styles.nightSky} aria-hidden="true">
        <Image
          src={landscape}
          alt=""
          fill
          unoptimized
          loading="eager"
          sizes="82vw"
          onError={(event) => {
            event.currentTarget.hidden = true
            ready("error")
          }}
        />
      </div>
      <div ref={plates} className={styles.landscapePlanes} aria-hidden="true">
        <div
          className={styles.mountainPlane}
          style={{ clipPath: mountainMask }}
          data-home-plane="mountains"
        >
          <Image
            src={landscape}
            alt=""
            fill
            unoptimized
            loading="eager"
            sizes="82vw"
            onError={(event) => {
              event.currentTarget.hidden = true
              ready("error")
            }}
          />
        </div>
        <div className={styles.shorePlane} style={{ clipPath: shoreMask }} data-home-plane="shore">
          <Image
            src={landscape}
            alt=""
            fill
            unoptimized
            loading="eager"
            sizes="82vw"
            onError={(event) => {
              event.currentTarget.hidden = true
              ready("error")
            }}
          />
        </div>
      </div>
      <canvas ref={canvas} aria-hidden="true" data-home-canvas />
    </>
  )
}
