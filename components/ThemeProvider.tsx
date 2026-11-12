"use client"

import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} })
const THEME_KEY = "blog-theme"
const OVERRIDE_UNTIL_KEY = "blog-theme-override-until"

function shouldUseDarkTheme(date: Date) {
  const hour = date.getHours()
  return hour >= 18 || hour < 6
}

function getNextThemeBoundary(date: Date) {
  const boundary = new Date(date)
  boundary.setMinutes(0, 0, 0)

  if (date.getHours() < 6) {
    boundary.setHours(6)
  } else if (date.getHours() < 18) {
    boundary.setHours(18)
  } else {
    boundary.setDate(boundary.getDate() + 1)
    boundary.setHours(6)
  }

  return boundary
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    let boundaryTimer = 0

    const applyCurrentTheme = () => {
      const now = new Date()
      const savedTheme = localStorage.getItem(THEME_KEY)
      const overrideUntil = Number(localStorage.getItem(OVERRIDE_UNTIL_KEY))
      const hasActiveOverride =
        (savedTheme === "dark" || savedTheme === "light") && overrideUntil > now.getTime()

      if (!hasActiveOverride) {
        localStorage.removeItem(THEME_KEY)
        localStorage.removeItem(OVERRIDE_UNTIL_KEY)
      }

      setIsDark(hasActiveOverride ? savedTheme === "dark" : shouldUseDarkTheme(now))
    }

    const scheduleNextBoundary = () => {
      const now = new Date()
      const delay = getNextThemeBoundary(now).getTime() - now.getTime() + 100
      boundaryTimer = window.setTimeout(() => {
        localStorage.removeItem(THEME_KEY)
        localStorage.removeItem(OVERRIDE_UNTIL_KEY)
        applyCurrentTheme()
        scheduleNextBoundary()
      }, delay)
    }

    const initializationTimer = window.setTimeout(applyCurrentTheme, 0)
    scheduleNextBoundary()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") applyCurrentTheme()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearTimeout(initializationTimer)
      window.clearTimeout(boundaryTimer)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [isDark])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem(THEME_KEY, newDark ? "dark" : "light")
    localStorage.setItem(OVERRIDE_UNTIL_KEY, String(getNextThemeBoundary(new Date()).getTime()))
  }

  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
