"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { homeWindowProjection, HOME_ROOM } from "../lib/home-scene"
import { useHomeProjectState } from "./HomeProjectNavigation"
import landscape from "../public/home-window/convict-lake-day-study.webp"
import room from "../public/home-window/observation-room-open.webp"
import styles from "./HomeScene.module.css"

declare global {
  interface Window {
    __homeVisitClock?: ReturnType<typeof import("../lib/home-scene").createHomeVisitClock> & {
      stop: () => void
    }
  }
}

// Static loading/error fallback only. The shared Three scene owns all live pixels.
export default function HomeSpectralCanvas() {
  const { enabled, sceneStatus } = useHomeProjectState()
  const artwork = useRef<HTMLDivElement>(null)
  const [posterStatus, setPosterStatus] = useState("loading")
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    const images = Array.from(artwork.current?.querySelectorAll("img") ?? [])
    // The poster may be hidden by the startup CSS. Visibility is not evidence
    // that its two images have downloaded or decoded.
    void Promise.all(images.map((image) => image.decode())).then(
      () => {
        if (active && images.length === 2) setPosterStatus("ready")
      },
      () => {
        if (active) setPosterStatus("error")
      },
    )
    return () => {
      active = false
    }
  }, [retry])
  useEffect(() => {
    const stage = artwork.current?.closest<HTMLElement>("[data-home-scene]")
    if (!stage) return
    const viewport = document.getElementById("app-scroll-root")
    const resize = () => {
      const width = viewport?.clientWidth ?? innerWidth
      const height = viewport?.clientHeight ?? innerHeight
      const view = homeWindowProjection(width, height)
      stage.style.setProperty("--home-viewport-width", `${width}px`)
      stage.style.setProperty("--room-x", `${view.room.x}px`)
      stage.style.setProperty("--room-y", `${view.room.y}px`)
      stage.style.setProperty("--room-width", `${view.room.width}px`)
      stage.style.setProperty("--room-height", `${view.room.height}px`)
      stage.style.setProperty("--view-x", `${view.opening.x}px`)
      stage.style.setProperty("--view-y", `${view.opening.y}px`)
      stage.style.setProperty("--view-width", `${view.opening.width}px`)
      stage.style.setProperty("--view-height", `${view.opening.height}px`)
      const frameScale = view.room.width / HOME_ROOM.width
      const [frameX, , frameWidth] = HOME_ROOM.frame
      const [openingX, , openingWidth] = HOME_ROOM.opening
      stage.style.setProperty(
        "--left-rail",
        `${view.room.x + ((frameX + openingX) / 2) * frameScale}px`,
      )
      stage.style.setProperty(
        "--right-rail",
        `${width - (view.room.x + ((frameX + frameWidth + openingX + openingWidth) / 2) * frameScale)}px`,
      )
      stage.style.setProperty("--lake-x", `${view.lake.x - view.opening.x}px`)
      stage.style.setProperty("--lake-y", `${view.lake.y - view.opening.y}px`)
      stage.style.setProperty("--lake-width", `${view.lake.width}px`)
      stage.style.setProperty("--lake-height", `${view.lake.height}px`)
      stage.style.setProperty(
        "--music-y",
        `${view.room.y + (view.room.height * HOME_ROOM.sillCenterY) / HOME_ROOM.height}px`,
      )
    }
    resize()
    const observer = new ResizeObserver(resize)
    if (viewport) observer.observe(viewport)
    window.addEventListener("resize", resize)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", resize)
    }
  }, [])
  return (
    <div
      ref={artwork}
      className={styles.poster}
      hidden={enabled && sceneStatus === "ready"}
      data-home-artwork={
        sceneStatus === "ready" || posterStatus === "ready"
          ? "ready"
          : sceneStatus === "error" && posterStatus === "error"
            ? "error"
            : "loading"
      }
      data-home-artwork-kind={sceneStatus === "ready" ? "scene" : "static-fallback"}
    >
      <div className={styles.windowViewport} data-home-viewport>
        <Image
          className={styles.landscapeImage}
          src={retry ? { ...landscape, src: `${landscape.src}?retry=${retry}` } : landscape}
          alt="蓝天下的雪山与湖水"
          preload
          unoptimized
          sizes="100vw"
        />
      </div>
      <Image
        className={styles.roomImage}
        data-home-room
        src={retry ? { ...room, src: `${room.src}?retry=${retry}` } : room}
        alt="从明亮室内透过浅木观景窗望向山湖"
        preload
        unoptimized
        sizes="100vw"
      />
      {posterStatus === "error" && (
        <div className={styles.artworkError} role="status">
          暂时无法显示窗景。
          <button
            type="button"
            onClick={() => {
              setPosterStatus("loading")
              setRetry((value) => value + 1)
            }}
          >
            重新加载图片
          </button>
        </div>
      )}
    </div>
  )
}
