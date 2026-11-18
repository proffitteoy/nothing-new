"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import {
  createHomeVisitClock,
  homeWindowProjection,
  homeWindowLook,
  HOME_ROOM,
  HOME_LAKE,
} from "../lib/home-scene"
import { SPECTRAL_PLAYBACK_RATE, SPECTRAL_DIRECTION_GLSL } from "./field/spectralField"
import landscape from "../public/home-window/convict-lake-day-study.webp"
import room from "../public/home-window/observation-room.webp"
import styles from "./HomeScene.module.css"

declare global {
  interface Window {
    __homeVisitClock?: ReturnType<typeof createHomeVisitClock> & { stop: () => void }
  }
}

const VERTEX = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`
const FRAGMENT = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 colour;
uniform sampler2D uLake;
uniform sampler2D uRoom;
uniform vec2 uSize;
uniform vec4 uRoomRect;
uniform vec4 uLakeRect;
uniform vec2 uLook;
uniform float uStrength;
uniform float uTime;
${SPECTRAL_DIRECTION_GLSL}
float rise(float a,float b,float x){ float v=clamp((x-a)/(b-a),0.,1.); return v*v*(3.-2.*v); }
float waterMask(vec2 p){
  float xs[8]=float[8](0.,103.,252.,459.,802.,1118.,1414.,1672.);
  float ys[8]=float[8](579.,558.,552.,549.,548.,545.,546.,544.);
  float edge=ys[7]/877.; float x=clamp(p.x*1672.,0.,1672.);
  for(int i=0;i<7;i++) if(x>=xs[i] && x<=xs[i+1]) edge=mix(ys[i],ys[i+1],(x-xs[i])/(xs[i+1]-xs[i]))/877.;
  return rise(edge+.012,edge+.06,p.y)*(1.-rise(.80,.86,p.y))*rise(.09,.16,p.x)*(1.-rise(.96,.99,p.x));
}
// Water's parameter domain: fine waves at the distant bank, broader nearby.
// The field itself is unchanged; the object supplies its own coordinate map.
vec2 waterDomain(vec2 p) {
  float depth = max(p.y - .62, 0.);
  return vec2((p.x-.5)*2. / (depth+.20), log(depth+.025)*1.4);
}
void main(){
  vec2 pixel=vec2(uv.x,1.-uv.y)*uSize;
  vec2 r=(pixel-uRoomRect.xy)/uRoomRect.zw;
  vec4 interior=texture(uRoom,vec2(r.x,1.-r.y));
  if(interior.a>.99999){ colour=vec4(interior.rgb,1.); return; }
  vec2 p=(pixel-uLakeRect.xy+uLook)/uLakeRect.zw;
  float mask=waterMask(p);
  vec2 response=vec2(0.);
  if(mask>0. && uStrength>0.) response=spectralWaterDirection(waterDomain(p),uTime)*mask*uStrength/uLakeRect.zw;
  vec2 samplePoint=p+response;
  vec3 exterior=texture(uLake,vec2(samplePoint.x,1.-samplePoint.y)).rgb;
  colour=vec4(mix(exterior,interior.rgb,interior.a),1.);
}`

export default function HomeSpectralCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const artwork = useRef<HTMLDivElement>(null)
  const loaded = useRef(new Set<string>())
  function ready(name: string, status: "ready" | "error") {
    loaded.current.add(name)
    if (artwork.current && (status === "error" || loaded.current.size === 2)) {
      if (artwork.current.dataset.homeArtwork !== "error")
        artwork.current.dataset.homeArtwork = status
    }
  }

  useEffect(() => {
    const stage = canvas.current?.closest<HTMLElement>("[data-home-scene]"),
      surface = canvas.current
    if (!stage || !surface) return
    let disposed = false,
      frame = 0,
      gl: WebGL2RenderingContext | null = null
    let program: WebGLProgram | null = null,
      buffer: WebGLBuffer | null = null
    let textures: WebGLTexture[] = [],
      shaders: WebGLShader[] = []
    const uniforms: Record<string, WebGLUniformLocation | null> = {}
    let projection = homeWindowProjection(stage.clientWidth, stage.clientHeight)
    const target = { x: 0, y: 0 },
      look = { x: 0, y: 0 }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const fallbackClock = createHomeVisitClock(performance.now(), !document.hidden)
    let origin: number | null = null,
      previous = 0,
      nextDraw = 0,
      frames = 0,
      totalCost = 0
    let windowStart = 0,
      windowFrames = 0,
      slowWindows = 0,
      degraded = false,
      staticOnly = false
    let sources: HTMLImageElement[] = []
    surface.width = surface.height = 0
    const fallback = () => {
      stage.dataset.homeRendering = "static"
      stage.dataset.homeQuality = "static"
      stage.dataset.homeEffect = "none"
      stage.dataset.homeBufferBytes = "0"
    }
    fallback()
    const release = () => {
      cancelAnimationFrame(frame)
      frame = 0
      if (gl) {
        textures.forEach((t) => gl?.deleteTexture(t))
        shaders.forEach((s) => gl?.deleteShader(s))
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
      }
      textures = []
      shaders = []
      buffer = null
      program = null
      surface.width = surface.height = 0
    }
    const resize = () => {
      projection = homeWindowProjection(stage.clientWidth, stage.clientHeight)
      const { room, opening, lake } = projection
      for (const [key, value] of Object.entries({
        "--room-x": room.x,
        "--room-y": room.y,
        "--room-width": room.width,
        "--room-height": room.height,
        "--view-x": opening.x,
        "--view-y": opening.y,
        "--view-width": opening.width,
        "--view-height": opening.height,
        "--lake-x": lake.x - opening.x,
        "--lake-y": lake.y - opening.y,
        "--lake-width": lake.width,
        "--lake-height": lake.height,
        "--sill-y": room.y + room.height * 0.714,
        "--music-y": room.y + room.height * 0.736,
        "--left-rail": Math.max(0, room.x + room.width * 0.038 - 28),
        "--right-rail": Math.max(0, stage.clientWidth - (room.x + room.width * 0.962) - 28),
      }))
        stage.style.setProperty(key, `${value}px`)
      if (gl && program) {
        const ratio = Math.min(devicePixelRatio || 1, degraded ? 1 : 1.5)
        surface.width = Math.round(stage.clientWidth * ratio)
        surface.height = Math.round(stage.clientHeight * ratio)
        gl.viewport(0, 0, surface.width, surface.height)
      }
    }
    const render = (now: number) => {
      frame = 0
      if (disposed || document.hidden || reduced.matches || staticOnly || !gl || !program) return
      if (document.documentElement.dataset.startupPhase !== "ready") return
      const interval = 1000 / (degraded ? 24 : 40)
      if (now < nextDraw - 0.5) {
        frame = requestAnimationFrame(render)
        return
      }
      const dt = previous ? Math.min((now - previous) / 1000, 0.08) : 0
      previous = now
      nextDraw = Math.max(now - interval, nextDraw + interval)
      const began = performance.now()
      const smoothing = 1 - Math.exp(-5 * dt)
      look.x += (target.x - look.x) * smoothing
      look.y += (target.y - look.y) * smoothing
      const offset = homeWindowLook(look.x, look.y, projection.opening.height)
      const active = (window.__homeVisitClock ?? fallbackClock).read(now)
      if (origin === null) origin = active
      const time = (Math.max(0, active - origin) / 1000) * SPECTRAL_PLAYBACK_RATE
      gl.useProgram(program)
      gl.uniform2f(uniforms.uSize, stage.clientWidth, stage.clientHeight)
      gl.uniform4f(
        uniforms.uRoomRect,
        projection.room.x,
        projection.room.y,
        projection.room.width,
        projection.room.height,
      )
      gl.uniform4f(
        uniforms.uLakeRect,
        projection.lake.x,
        projection.lake.y,
        projection.lake.width,
        projection.lake.height,
      )
      gl.uniform2f(uniforms.uLook, offset.x, offset.y)
      const requested = Number(stage.dataset.homeWaterStrength ?? "2.8")
      gl.uniform1f(
        uniforms.uStrength,
        Number.isFinite(requested) ? Math.max(0, Math.min(4, requested)) : 2.8,
      )
      gl.uniform1f(uniforms.uTime, time)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      stage.dataset.homeRendering = "dynamic"
      stage.dataset.homeQuality = degraded ? "adaptive-low" : "high"
      stage.dataset.homeEffect = "water-response"
      stage.dataset.homeFieldTime = time.toFixed(4)
      stage.dataset.homeLook = `${offset.x.toFixed(3)},${offset.y.toFixed(3)}`
      stage.dataset.homeFrames = String(++frames)
      stage.dataset.homeBufferBytes = String(
        surface.width * surface.height * 4 +
          (HOME_ROOM.width * HOME_ROOM.height + HOME_LAKE.width * HOME_LAKE.height) * 4,
      )
      totalCost += performance.now() - began
      stage.dataset.homeDrawMs = (totalCost / frames).toFixed(2)
      windowFrames++
      if (!windowStart) windowStart = now
      if (now - windowStart >= 2000) {
        const fps = (windowFrames * 1000) / (now - windowStart)
        stage.dataset.homeFps = fps.toFixed(1)
        slowWindows = fps < (degraded ? 12 : 20) ? slowWindows + 1 : 0
        if (slowWindows >= 2) {
          if (degraded) {
            staticOnly = true
            stage.dataset.homeFallbackReason = "Persistent low frame rate"
            fallback()
            release()
            return
          }
          degraded = true
          resize()
          slowWindows = 0
        }
        windowStart = now
        windowFrames = 0
      }
      frame = requestAnimationFrame(render)
    }
    const wake = () => {
      cancelAnimationFrame(frame)
      previous = 0
      nextDraw = 0
      windowStart = 0
      windowFrames = 0
      if (!document.hidden) frame = requestAnimationFrame(render)
    }
    const install = () => {
      if (disposed || sources.length !== 2 || reduced.matches || staticOnly) return
      release()
      try {
        gl = surface.getContext("webgl2", {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "low-power",
        })
        if (!gl) throw Error("WebGL2 unavailable")
        const shader = (type: number, source: string) => {
          const value = gl!.createShader(type)
          if (!value) throw Error("Shader allocation failed")
          shaders.push(value)
          gl!.shaderSource(value, source)
          gl!.compileShader(value)
          if (!gl!.getShaderParameter(value, gl!.COMPILE_STATUS))
            throw Error(gl!.getShaderInfoLog(value) || "Shader compile failed")
          return value
        }
        program = gl.createProgram()
        if (!program) throw Error("Program allocation failed")
        gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
          throw Error(gl.getProgramInfoLog(program) || "Program link failed")
        gl.useProgram(program)
        buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const position = gl.getAttribLocation(program, "position")
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
        for (const name of [
          "uLake",
          "uRoom",
          "uSize",
          "uRoomRect",
          "uLakeRect",
          "uLook",
          "uStrength",
          "uTime",
        ])
          uniforms[name] = gl.getUniformLocation(program, name)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        sources.forEach((image, index) => {
          const texture = gl!.createTexture()
          if (!texture) throw Error("Texture allocation failed")
          textures.push(texture)
          gl!.activeTexture(gl!.TEXTURE0 + index)
          gl!.bindTexture(gl!.TEXTURE_2D, texture)
          for (const axis of [gl!.TEXTURE_WRAP_S, gl!.TEXTURE_WRAP_T])
            gl!.texParameteri(gl!.TEXTURE_2D, axis, gl!.CLAMP_TO_EDGE)
          for (const filter of [gl!.TEXTURE_MIN_FILTER, gl!.TEXTURE_MAG_FILTER])
            gl!.texParameteri(gl!.TEXTURE_2D, filter, gl!.LINEAR)
          gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image)
        })
        gl.uniform1i(uniforms.uLake, 0)
        gl.uniform1i(uniforms.uRoom, 1)
        resize()
        wake()
      } catch (error) {
        stage.dataset.homeFallbackReason =
          error instanceof Error ? error.message : "Renderer unavailable"
        fallback()
        release()
      }
    }
    const load = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = url
      })
    Promise.all([load(landscape.src), load(room.src)])
      .then((images) => {
        if (!disposed) {
          sources = images
          install()
        }
      })
      .catch(() => fallback())
    const move = (event: PointerEvent) => {
      if ((event.target as Element).closest("[data-home-edge], [data-home-music], dialog")) {
        target.x = target.y = 0
        return
      }
      const x = event.clientX - projection.opening.x,
        y = event.clientY - projection.opening.y
      if (
        event.pointerType !== "mouse" ||
        x < 0 ||
        y < 0 ||
        x > projection.opening.width ||
        y > projection.opening.height
      ) {
        target.x = target.y = 0
        return
      }
      target.x = (x / projection.opening.width) * 2 - 1
      target.y = (y / projection.opening.height) * 2 - 1
    }
    const leave = () => {
      target.x = target.y = 0
    }
    const visibility = () => {
      fallbackClock.visibility(performance.now(), !document.hidden)
      wake()
    }
    const mode = () => {
      leave()
      if (reduced.matches) {
        fallback()
        release()
      } else {
        staticOnly = false
        install()
      }
    }
    const lost = (event: Event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      fallback()
    }
    const observer = new ResizeObserver(() => {
      resize()
      wake()
    })
    observer.observe(stage)
    stage.addEventListener("pointermove", move)
    stage.addEventListener("pointerleave", leave)
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("site-startup-phase", wake)
    reduced.addEventListener("change", mode)
    surface.addEventListener("webglcontextlost", lost)
    surface.addEventListener("webglcontextrestored", install)
    resize()
    return () => {
      disposed = true
      release()
      observer.disconnect()
      stage.removeEventListener("pointermove", move)
      stage.removeEventListener("pointerleave", leave)
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("site-startup-phase", wake)
      reduced.removeEventListener("change", mode)
      surface.removeEventListener("webglcontextlost", lost)
      surface.removeEventListener("webglcontextrestored", install)
    }
  }, [])

  return (
    <>
      <div
        ref={artwork}
        className={styles.poster}
        data-home-artwork="loading"
        data-home-artwork-kind="coupled-room"
      >
        <div className={styles.windowViewport} data-home-viewport data-home-window>
          <Image
            className={styles.landscapeImage}
            src={landscape}
            alt="蓝天下的雪山与湖水"
            preload
            unoptimized
            sizes="100vw"
            onLoad={() => ready("lake", "ready")}
            onError={() => ready("lake", "error")}
          />
        </div>
        <Image
          className={styles.roomImage}
          src={room}
          alt="从室内透过深木窗洞望向山湖"
          fill
          preload
          unoptimized
          sizes="100vw"
          onLoad={() => ready("room", "ready")}
          onError={() => ready("room", "error")}
        />
        <p className={styles.artworkError} role="status">
          暂时无法加载窗外景观
        </p>
      </div>
      <canvas ref={canvas} className={styles.sceneSurface} data-home-canvas aria-hidden="true" />
    </>
  )
}
