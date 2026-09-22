"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

export type ImageListKind = "anime" | "chatter"

export type ImageLoadingEnvironment = {
  desktop: boolean
  saveData?: boolean
  effectiveType?: string
}

export type ImageLoadingPolicy = {
  immediateBudget: number
  nearViewportMarginPx: number
}

export type MusicCoverSize = 128 | 256

const NETEASE_MUSIC_IMAGE_HOST = /(^|\.)music\.126\.net$/i

export function isNeteaseMusicCoverUrl(src: string) {
  try {
    const url = new URL(src)
    return /^https?:$/.test(url.protocol) && NETEASE_MUSIC_IMAGE_HOST.test(url.hostname)
  } catch {
    return false
  }
}

export function getSizedMusicCoverUrl(src: string, size: MusicCoverSize) {
  if (!isNeteaseMusicCoverUrl(src)) return src

  const url = new URL(src)
  url.searchParams.set("param", `${size}y${size}`)
  return url.toString()
}

export function getImageLoadingPolicy(
  kind: ImageListKind,
  environment: ImageLoadingEnvironment,
): ImageLoadingPolicy {
  const constrained = environment.saveData || /(^|-)2g$/i.test(environment.effectiveType ?? "")
  const immediateBudget =
    kind === "chatter" ? (constrained ? 1 : 2) : constrained ? 2 : environment.desktop ? 6 : 4

  return {
    immediateBudget,
    nearViewportMarginPx: constrained ? 0 : environment.desktop ? 320 : 256,
  }
}

type NavigatorWithConnection = Navigator & {
  connection?: EventTarget & {
    effectiveType?: string
    saveData?: boolean
  }
}

const DESKTOP_QUERY = "(min-width: 1024px)"
const SERVER_SNAPSHOT = "mobile|normal|"

function getSnapshot() {
  if (typeof window === "undefined") return SERVER_SNAPSHOT
  const connection = (navigator as NavigatorWithConnection).connection
  return [
    window.matchMedia(DESKTOP_QUERY).matches ? "desktop" : "mobile",
    connection?.saveData ? "save-data" : "normal",
    connection?.effectiveType ?? "",
  ].join("|")
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY)
  const connection = (navigator as NavigatorWithConnection).connection
  media.addEventListener("change", onChange)
  connection?.addEventListener("change", onChange)
  return () => {
    media.removeEventListener("change", onChange)
    connection?.removeEventListener("change", onChange)
  }
}

export function useImageLoadingPolicy(kind: ImageListKind) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  const [viewport, dataMode, effectiveType] = snapshot.split("|")
  return getImageLoadingPolicy(kind, {
    desktop: viewport === "desktop",
    saveData: dataMode === "save-data",
    effectiveType,
  })
}

export function useNearViewport<T extends Element>(
  immediate: boolean,
  nearViewportMarginPx: number,
) {
  const elementRef = useRef<T>(null)
  const [nearViewport, setNearViewport] = useState(immediate)

  // Budget/hash changes may promote a mounted card; keep that admission permanent.
  if (immediate && !nearViewport) setNearViewport(true)

  useEffect(() => {
    if (immediate || nearViewport) return

    const element = elementRef.current
    if (!element) return

    if (typeof IntersectionObserver === "undefined") {
      const fallbackTimer = window.setTimeout(() => setNearViewport(true), 0)
      return () => window.clearTimeout(fallbackTimer)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setNearViewport(true)
        observer.disconnect()
      },
      { rootMargin: `${nearViewportMarginPx}px 0px` },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [immediate, nearViewport, nearViewportMarginPx])

  return {
    elementRef,
    shouldLoad: immediate || nearViewport,
  }
}
