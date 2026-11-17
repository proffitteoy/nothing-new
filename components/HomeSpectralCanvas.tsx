"use client"

import Image from "next/image"
import { useRef } from "react"
import type { createHomeVisitClock } from "../lib/home-scene"
import landscape from "../public/home-window/convict-lake-day-study.webp"
import styles from "./HomeScene.module.css"

declare global {
  interface Window {
    __homeVisitClock?: ReturnType<typeof createHomeVisitClock> & { stop: () => void }
  }
}

// P0: one continuous landscape. Object response follows visual approval.
// Keep the existing name and Splash artwork readiness contract.
export default function HomeSpectralCanvas() {
  const artwork = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={artwork}
      className={styles.poster}
      data-home-artwork="loading"
      data-home-artwork-kind="daylight"
    >
      <Image
        src={landscape}
        alt="蓝天下的雪山、树林与连续的湖面"
        fill
        preload
        unoptimized
        sizes="82vw"
        onLoad={() => {
          if (artwork.current) artwork.current.dataset.homeArtwork = "ready"
        }}
        onError={(event) => {
          event.currentTarget.hidden = true
          if (artwork.current) artwork.current.dataset.homeArtwork = "error"
        }}
      />
      <p className={styles.artworkError} role="status">
        暂时无法加载窗外景观
      </p>
    </div>
  )
}
