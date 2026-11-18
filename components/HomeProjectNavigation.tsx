"use client"

import Link from "next/link"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { homeProjectProgress, homeProjectScroll, isMobileHomeClient } from "../lib/home-scene"
import { preloadRoomAssets } from "../app/projects/room-preload"

type Mode = "narrative" | "free" | "returning"
type Stage = "window" | "room" | "landscape" | "transition"
const noop = () => {}
const Context = createContext({
  enabled: false,
  progress: { current: 0 },
  mode: "narrative" as Mode,
  setFreeView: noop as (free: boolean) => void,
  returnWindow: noop as (delay?: number) => void,
})
export const useHomeProjectState = () => useContext(Context)
export const useHomeProjectNavigation = () => useContext(Context).enabled
const subscribe = () => () => {}
const capable = () => !isMobileHomeClient()
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

// This owner controls state and routing. Existing scene renderers/assets stay intact.
export default function HomeProjectNavigator({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    router = useRouter()
  const desktop = useSyncExternalStore(subscribe, capable, () => false)
  const active = desktop && (pathname === "/" || pathname === "/projects")
  const progress = useRef(pathname === "/projects" ? -1 : 0)
  const modeRef = useRef<Mode>("narrative")
  const [mode, updateMode] = useState<Mode>("narrative")
  const [atWindow, setAtWindow] = useState(true)
  const height = useRef(1),
    frame = useRef(0),
    lockUntil = useRef(0)
  const automatic = useRef<string | null>(null),
    previous = useRef<string | null>(null),
    restoring = useRef(false)
  const currentPath = useRef(pathname)
  useLayoutEffect(() => {
    currentPath.current = pathname
  })
  const setMode = useCallback((next: Mode) => {
    modeRef.current = next
    updateMode(next)
    const root = document.getElementById("app-scroll-root")
    if (root) {
      root.dataset.homeProjectMode = next
      root.dispatchEvent(new Event("home-project-mode"))
    }
  }, [])
  const cancelReturn = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    lockUntil.current = 0
    if (modeRef.current === "returning") setMode("narrative")
  }, [setMode])
  const setFreeView = useCallback(
    (free: boolean) => {
      cancelReturn()
      setMode(free ? "free" : "narrative")
    },
    [cancelReturn, setMode],
  )
  const returnWindow = useCallback(
    (delay = 0) => {
      if (document.querySelector('dialog[open],[role="dialog"]')) return
      document
        .querySelectorAll<HTMLDetailsElement>("[data-home-project-controls] details[open]")
        .forEach((item) => {
          item.open = false
        })
      cancelReturn()
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
      const started = performance.now() + (reduced ? 0 : delay),
        from = progress.current
      lockUntil.current = started
      setMode("returning")
      const tick = (now: number) => {
        if (document.hidden) {
          cancelReturn()
          return
        }
        const root = document.getElementById("app-scroll-root")
        if (!root) return
        if (now < started) {
          frame.current = requestAnimationFrame(tick)
          return
        }
        const t = reduced ? 1 : Math.min(1, (now - started) / 1200)
        root.style.overflowY = "auto"
        root.scrollTop = homeProjectScroll(from * (1 - smooth(t)), height.current)
        root.dispatchEvent(new Event("scroll"))
        if (t < 1) frame.current = requestAnimationFrame(tick)
        else {
          frame.current = 0
          setMode("narrative")
        }
      }
      frame.current = requestAnimationFrame(tick)
    },
    [cancelReturn, setMode],
  )

  useEffect(() => {
    const pop = () => {
      restoring.current = true
      cancelReturn()
    }
    window.addEventListener("popstate", pop)
    return () => window.removeEventListener("popstate", pop)
  }, [cancelReturn])

  useLayoutEffect(() => {
    if (!active) {
      previous.current = null
      cancelReturn()
      return
    }
    const root = document.getElementById("app-scroll-root")!
    height.current = root.clientHeight || innerHeight
    const saved = history.state?.homeProjectCheckpoint
    if (
      (restoring.current || previous.current === null) &&
      saved?.path === pathname &&
      Number.isFinite(saved.progress)
    ) {
      progress.current = Math.max(-1, Math.min(1, saved.progress))
      setMode("narrative")
    } else if (previous.current !== pathname && automatic.current !== pathname) {
      cancelReturn()
      progress.current = pathname === "/projects" ? -1 : 0
      setMode("narrative")
    }
    previous.current = pathname
    restoring.current = false
    automatic.current = null
    root.scrollTop = homeProjectScroll(progress.current, height.current)
    root.dispatchEvent(new Event("scroll"))
  }, [active, pathname, cancelReturn, setMode])

  useLayoutEffect(() => {
    if (!active) return
    const root = document.getElementById("app-scroll-root")!
    const old = { height: root.style.height, flex: root.style.flex }
    root.style.height = "100dvh"
    root.style.flex = "none"
    document.documentElement.dataset.homeProjectNavigation = "true"
    return () => {
      root.style.height = old.height
      root.style.flex = old.flex
      delete document.documentElement.dataset.homeProjectNavigation
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const root = document.getElementById("app-scroll-root")!
    const oldOverflow = root.style.overflowY
    const blocked = () =>
      modeRef.current === "free" ||
      performance.now() < lockUntil.current ||
      !!root.querySelector(
        '[data-home-preview][data-open="true"],dialog[open],[role="dialog"],details[open],[data-project-navigation-blocked="true"],[data-home-music-dragging="true"]',
      ) ||
      !document.documentElement.classList.contains("splash-seen")
    const updateLock = () => {
      const locked = blocked()
      root.style.overflowY = locked ? "hidden" : "auto"
      if (locked && frame.current && performance.now() >= lockUntil.current) cancelReturn()
    }
    const sync = () => {
      const p = homeProjectProgress(root.scrollTop, height.current)
      progress.current = p
      const stage: Stage =
        p <= -0.999
          ? "room"
          : p >= 0.999
            ? "landscape"
            : Math.abs(p) < 0.002
              ? "window"
              : "transition"
      root.dataset.homeProjectStage = stage
      root.dataset.homeProjectProgress = p.toFixed(5)
      root.dataset.homeProjectMode = modeRef.current
      const outside = smooth(Math.max(0, p) / 0.18)
      root.style.setProperty("--home-navigation-opacity", String(1 - outside))
      const controls = root.querySelector<HTMLElement>("[data-home-ui]")
      if (controls) controls.inert = outside === 1
      setAtWindow(Math.abs(p) < 0.002)
      if (location.pathname === currentPath.current)
        history.replaceState(
          { ...history.state, homeProjectCheckpoint: { path: location.pathname, progress: p } },
          "",
        )
      const destination = p <= -0.999 ? "/projects" : "/"
      if (destination !== currentPath.current && automatic.current !== destination) {
        automatic.current = destination
        router.replace(destination, { scroll: false })
      }
    }
    const scroll = () => {
      if (blocked()) {
        root.scrollTop = homeProjectScroll(progress.current, height.current)
        return
      }
      sync()
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      const target = event.target as Element
      if (target.closest("[data-home-music],[data-home-project-controls]")) {
        event.preventDefault()
        return
      }
      if (modeRef.current === "free") return
      if (blocked()) {
        if (!target.closest('dialog,[role="dialog"],details[open],[data-home-preview]'))
          event.preventDefault()
        return
      }
      cancelReturn()
      // Both existing scenes are fixed layers; forward to the sole native scroller.
      event.preventDefault()
      root.scrollTop +=
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height.current : 1)
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
          ? -0.85 * height.current
          : event.key === "PageDown" || event.key === " "
            ? 0.85 * height.current
            : event.key === "ArrowUp"
              ? -48
              : event.key === "ArrowDown"
                ? 48
                : 0
      if (amount) {
        event.preventDefault()
        cancelReturn()
        root.scrollTop += amount
      }
    }
    const resize = () => {
      height.current = root.clientHeight
      root.scrollTop = homeProjectScroll(progress.current, height.current)
    }
    const visibility = () => {
      if (document.hidden) cancelReturn()
    }
    const observer = new MutationObserver(updateLock)
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "open",
        "data-open",
        "data-project-navigation-blocked",
        "data-home-music-dragging",
      ],
    })
    root.addEventListener("scroll", scroll, { passive: true })
    root.addEventListener("wheel", wheel, { passive: false })
    root.addEventListener("home-project-mode", updateLock)
    window.addEventListener("keydown", keyboard)
    window.addEventListener("resize", resize)
    window.addEventListener("site-startup-phase", updateLock)
    document.addEventListener("visibilitychange", visibility)
    router.prefetch("/projects")
    router.prefetch("/")
    void preloadRoomAssets().catch(() => {})
    root.scrollTop = homeProjectScroll(progress.current, height.current)
    sync()
    updateLock()
    return () => {
      observer.disconnect()
      cancelReturn()
      root.style.overflowY = oldOverflow
      root.style.removeProperty("--home-navigation-opacity")
      delete root.dataset.homeProjectStage
      delete root.dataset.homeProjectProgress
      delete root.dataset.homeProjectMode
      root.removeEventListener("scroll", scroll)
      root.removeEventListener("wheel", wheel)
      root.removeEventListener("home-project-mode", updateLock)
      window.removeEventListener("keydown", keyboard)
      window.removeEventListener("resize", resize)
      window.removeEventListener("site-startup-phase", updateLock)
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [active, router, cancelReturn])
  const value = useMemo(
    () => ({ enabled: active, progress, mode, setFreeView, returnWindow }),
    [active, mode, setFreeView, returnWindow],
  )

  return (
    <Context.Provider value={value}>
      {active ? (
        <div
          data-home-project-track
          style={{ height: "500dvh", position: "relative", flexShrink: 0 }}
        >
          <div style={{ position: "sticky", top: 0, height: "100dvh" }}>{children}</div>
          {!atWindow && (
            <div
              data-home-project-controls
              style={{
                position: "fixed",
                left: 24,
                bottom: 24,
                zIndex: 30,
                display: "flex",
                gap: 16,
              }}
            >
              <button
                type="button"
                data-return-window
                hidden={mode === "free"}
                onClick={() => returnWindow()}
              >
                返回窗前
              </button>
              <details>
                <summary>快速导航</summary>
                <nav
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 12,
                    background: "var(--site-surface)",
                  }}
                  aria-label="场景快速导航"
                >
                  {[
                    ["项目", "/projects"],
                    ["笔记", "/blog"],
                    ["番剧", "/anime"],
                    ["杂谈", "/chatter"],
                    ["友链", "/friends"],
                    ["关于", "/about"],
                  ].map(([name, href]) => (
                    <Link key={href} href={href}>
                      {name}
                    </Link>
                  ))}
                </nav>
              </details>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  )
}
