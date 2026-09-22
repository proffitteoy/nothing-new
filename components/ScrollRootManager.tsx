"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const DESKTOP_QUERY = "(min-width: 768px)"
const SCROLL_ROOT_ID = "app-scroll-root"
const scrollPositions = new Map<string, number>()

export default function ScrollRootManager() {
  const pathname = usePathname()
  const initializedRef = useRef(false)
  const restoreHistoryNavigationRef = useRef(false)

  useEffect(() => {
    const scrollRoot = document.getElementById(SCROLL_ROOT_ID)
    if (!scrollRoot) return

    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = "manual"

    const rememberPosition = () => {
      if (!window.matchMedia(DESKTOP_QUERY).matches) return
      scrollPositions.set(window.location.pathname, scrollRoot.scrollTop)
    }

    const markHistoryNavigation = () => {
      restoreHistoryNavigationRef.current = true
    }

    scrollRoot.addEventListener("scroll", rememberPosition, { passive: true })
    window.addEventListener("popstate", markHistoryNavigation)

    return () => {
      scrollRoot.removeEventListener("scroll", rememberPosition)
      window.removeEventListener("popstate", markHistoryNavigation)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useLayoutEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }

    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      restoreHistoryNavigationRef.current = false
      return
    }

    const scrollRoot = document.getElementById(SCROLL_ROOT_ID)
    if (!scrollRoot) return

    const nextScrollTop = restoreHistoryNavigationRef.current
      ? (scrollPositions.get(pathname) ?? 0)
      : 0
    restoreHistoryNavigationRef.current = false

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        scrollRoot.scrollTo({ top: nextScrollTop, behavior: "auto" })
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [pathname])

  return null
}
