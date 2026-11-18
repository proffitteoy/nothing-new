"use client"

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { isMobileHomeClient } from "../lib/home-scene"
import { preloadRoomAssets } from "../app/projects/room-preload"

const HomeProjectNavigation = createContext(false)
export const useHomeProjectNavigation = () => useContext(HomeProjectNavigation)
const subscribe = () => () => {}
const capable = () => !isMobileHomeClient()

// Route handoff only. Both pages retain their main-branch renderers and cameras.
export default function HomeProjectNavigator({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const desktop = useSyncExternalStore(subscribe, capable, () => false)
  const active = desktop && (pathname === "/" || pathname === "/projects")
  const pending = useRef(false)

  useLayoutEffect(() => {
    if (!active) return
    const root = document.getElementById("app-scroll-root")!
    const previousHeight = root.style.height
    const previousFlex = root.style.flex
    // Desktop preview panes can be narrower than the site's mobile CSS breakpoint.
    root.style.height = "100dvh"
    root.style.flex = "none"
    document.documentElement.dataset.homeProjectNavigation = "true"
    return () => {
      root.style.height = previousHeight
      root.style.flex = previousFlex
      delete document.documentElement.dataset.homeProjectNavigation
    }
  }, [active])

  useLayoutEffect(() => {
    pending.current = false
    if (!active) return
    const root = document.getElementById("app-scroll-root")!
    // Every route has a canonical endpoint, including Back/Forward and direct entry.
    root.scrollTop = pathname === "/" ? root.clientHeight : 0
  }, [active, pathname])

  useEffect(() => {
    if (!active) return
    const root = document.getElementById("app-scroll-root")!
    const previousOverflow = root.style.overflowY
    const blocked = () =>
      !!root.querySelector(
        '[data-home-preview][data-open="true"],dialog[open],[role="dialog"],details[open],[data-project-navigation-blocked="true"]',
      ) || !document.documentElement.classList.contains("splash-seen")
    const updateLock = () => {
      root.style.overflowY = blocked() ? "hidden" : "auto"
    }
    const observer = new MutationObserver(updateLock)
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-open", "open", "data-project-navigation-blocked"],
    })
    window.addEventListener("site-startup-phase", updateLock)
    updateLock()
    router.prefetch(pathname === "/" ? "/projects" : "/")
    if (pathname === "/") void preloadRoomAssets().catch(() => {})

    const scroll = () => {
      if (pending.current || location.pathname !== pathname || blocked()) return
      const atDestination =
        pathname === "/" ? root.scrollTop <= 1 : root.scrollTop >= root.clientHeight - 1
      if (!atDestination) return
      pending.current = true
      router.push(pathname === "/" ? "/projects" : "/", { scroll: false })
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      const target = event.target as Element
      // The player and route controls never scroll the scene beneath them.
      if (target.closest("[data-home-music],[data-home-project-controls]")) event.preventDefault()
      else if (
        blocked() &&
        !target.closest(
          'dialog,[role="dialog"],details[open],[data-home-preview], [data-project-navigation-blocked="true"]',
        )
      )
        event.preventDefault()
      else if (pathname === "/" && !blocked()) {
        // Home is fixed to the viewport, so its wheel chain skips the internal scroller.
        event.preventDefault()
        root.scrollTop +=
          event.deltaY *
          (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1)
      }
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || blocked()) return
      if (
        (event.target as Element).closest(
          'a,button,input,textarea,select,summary,dialog,[role="dialog"],[contenteditable="true"]',
        )
      )
        return
      const amount =
        event.key === "PageUp" || (event.key === " " && event.shiftKey)
          ? -root.clientHeight * 0.85
          : event.key === "PageDown" || event.key === " "
            ? root.clientHeight * 0.85
            : event.key === "ArrowUp"
              ? -48
              : event.key === "ArrowDown"
                ? 48
                : 0
      if (amount) {
        event.preventDefault()
        root.scrollTop += amount
      }
    }
    const resize = () => {
      root.scrollTop = pathname === "/" ? root.clientHeight : 0
    }
    root.addEventListener("scroll", scroll, { passive: true })
    root.addEventListener("wheel", wheel, { passive: false })
    window.addEventListener("keydown", keyboard)
    window.addEventListener("resize", resize)
    return () => {
      observer.disconnect()
      root.style.overflowY = previousOverflow
      root.removeEventListener("scroll", scroll)
      root.removeEventListener("wheel", wheel)
      window.removeEventListener("keydown", keyboard)
      window.removeEventListener("resize", resize)
      window.removeEventListener("site-startup-phase", updateLock)
    }
  }, [active, pathname, router])

  return (
    <HomeProjectNavigation.Provider value={active}>
      {active ? (
        <div
          data-home-project-track
          style={{ height: "200dvh", position: "relative", flexShrink: 0 }}
        >
          <div style={{ position: "sticky", top: 0, height: "100dvh" }}>{children}</div>
        </div>
      ) : (
        children
      )}
    </HomeProjectNavigation.Provider>
  )
}
