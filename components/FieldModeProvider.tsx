"use client"

import { createContext, useContext, useMemo, useSyncExternalStore } from "react"

export type PerformanceMode = "normal" | "field"
const STORAGE_KEY = "blog-performance-mode"
let fallbackMode: PerformanceMode = "field"
let storageFailed = false
const CHANGE_EVENT = "field-mode-change"
function readMode(): PerformanceMode {
  if (storageFailed) return fallbackMode
  try {
    return localStorage.getItem(STORAGE_KEY) === "normal" ? "normal" : "field"
  } catch {
    return fallbackMode
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}
const FieldModeContext = createContext({
  performanceMode: "field" as PerformanceMode,
  togglePerformanceMode: () => {},
})
export function FieldModeProvider({ children }: { children: React.ReactNode }) {
  const performanceMode = useSyncExternalStore(subscribe, readMode, () => "field" as const)
  const value = useMemo(
    () => ({
      performanceMode,
      togglePerformanceMode: () => {
        fallbackMode = readMode() === "field" ? "normal" : "field"
        try {
          localStorage.setItem(STORAGE_KEY, fallbackMode)
        } catch {
          storageFailed = true
        }
        window.dispatchEvent(new Event(CHANGE_EVENT))
      },
    }),
    [performanceMode],
  )
  return <FieldModeContext.Provider value={value}>{children}</FieldModeContext.Provider>
}
export const useFieldMode = () => useContext(FieldModeContext)
