"use client"

import { useSyncExternalStore } from "react"

export type ImageListKind = "anime" | "chatter"

export type ImageLoadingEnvironment = {
  desktop: boolean
  saveData?: boolean
  effectiveType?: string
}

export function getImageEagerBudget(kind: ImageListKind, environment: ImageLoadingEnvironment) {
  const constrained = environment.saveData || /(^|-)2g$/i.test(environment.effectiveType ?? "")

  if (kind === "chatter") return constrained ? 1 : 2
  if (constrained) return 2
  return environment.desktop ? 6 : 4
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

export function useImageEagerBudget(kind: ImageListKind) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  const [viewport, dataMode, effectiveType] = snapshot.split("|")
  return getImageEagerBudget(kind, {
    desktop: viewport === "desktop",
    saveData: dataMode === "save-data",
    effectiveType,
  })
}
