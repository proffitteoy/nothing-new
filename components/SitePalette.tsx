"use client"

import { useLayoutEffect, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import {
  isCorePalette,
  pagePaletteForPath,
  PALETTE_CHANGE_EVENT,
  readPaletteSetting,
  setPaletteSetting,
  type PaletteSetting,
} from "../lib/site-palette"

export function SitePaletteRuntime() {
  const pathname = usePathname()
  useLayoutEffect(() => {
    document.documentElement.dataset.pagePalette = pagePaletteForPath(pathname)
  }, [pathname])
  return null
}

function subscribe(onChange: () => void) {
  window.addEventListener(PALETTE_CHANGE_EVENT, onChange)
  return () => window.removeEventListener(PALETTE_CHANGE_EVENT, onChange)
}

function serverSetting(): PaletteSetting {
  return "auto"
}

export function SitePalettePicker() {
  const value = useSyncExternalStore(subscribe, readPaletteSetting, serverSetting)
  return (
    <div className="site-palette-picker">
      <label htmlFor="site-palette-setting">公共配色</label>
      <select
        id="site-palette-setting"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          if (next === "auto" || isCorePalette(next)) setPaletteSetting(next)
        }}
      >
        <option value="auto">随机（每次访问）</option>
        <option value="blue">海岸蓝</option>
        <option value="forest">林间绿</option>
        <option value="rose">杏仁玫瑰</option>
        <option value="violet">冬日紫</option>
      </select>
      {value === "auto" && (
        <button type="button" onClick={() => setPaletteSetting("auto")}>换一套</button>
      )}
    </div>
  )
}
