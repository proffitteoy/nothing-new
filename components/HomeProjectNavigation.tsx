"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
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
import { dampWorldProgress } from "../lib/home-scene"
import type { RoomSceneProps } from "../app/projects/RoomScene"

const UnifiedScene = dynamic(
  () => import("../app/projects/RoomScene").then((module) => module.UnifiedScene),
  { ssr: false },
)

type Mode = "narrative" | "free" | "returning"
type Stage = "window" | "room" | "landscape" | "transition"
const noop = () => {}
const Context = createContext({
  enabled: false,
  progress: { current: 0 },
  mode: "narrative" as Mode,
  setFreeView: noop as (free: boolean) => void,
  returnWindow: noop as (delay?: number) => void,
  sceneStatus: "loading" as "loading" | "ready" | "error",
  setRoomProps: noop as (props: RoomSceneProps | null) => void,
  retryScene: noop,
})
export const useHomeProjectState = () => useContext(Context)
export const useHomeProjectNavigation = () => useContext(Context).enabled
const subscribe = () => () => {}
const capable = () => !isMobileHomeClient()
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

// The shared layout owns one renderer, scene and camera across both URLs.
export default function HomeProjectNavigator({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    router = useRouter()
  const desktop = useSyncExternalStore(subscribe, capable, () => false)
  const active = desktop && (pathname === "/" || pathname === "/projects")
  const progress = useRef(pathname === "/projects" ? -1 : 0)
  const modeRef = useRef<Mode>("narrative")
  const [mode, updateMode] = useState<Mode>("narrative")
  const [atWindow, setAtWindow] = useState(true)
  const [roomProps, setRoomProps] = useState<RoomSceneProps | null>(null)
  const [sceneStatus, setSceneStatus] = useState<"loading" | "ready" | "error">("loading")
  const statusRef = useRef(sceneStatus)
  const [sceneVersion, setSceneVersion] = useState(0)
  const ready = useCallback(() => setSceneStatus("ready"), [])
  const failed = useCallback(() => setSceneStatus("error"), [])
  const retryScene = useCallback(() => {
    setSceneStatus("loading")
    setSceneVersion((v) => v + 1)
  }, [])
  useLayoutEffect(() => {
    statusRef.current = sceneStatus
  }, [sceneStatus])
  const height = useRef(1),
    frame = useRef(0),
    lockUntil = useRef(0)
  const automatic = useRef<string | null>(null),
    previous = useRef<string | null>(null),
    restoring = useRef(false)
  const navigating = useRef(false)
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
    navigating.current = false
    if (!active) {
      previous.current = null
      cancelReturn()
      return
    }
    const root = document.getElementById("app-scroll-root")!
    const sceneHandoff = !restoring.current && automatic.current === pathname
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
    if (!sceneHandoff) root.scrollTop = homeProjectScroll(progress.current, height.current)
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
    let motionFrame = 0,
      previousTime = 0
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const blocked = () =>
      navigating.current ||
      modeRef.current === "free" ||
      performance.now() < lockUntil.current ||
      !!root.querySelector(
        '[data-home-preview][data-open="true"],dialog[open],[role="dialog"],details[open],[data-project-navigation-blocked="true"],[data-home-music-dragging="true"]',
      ) ||
      !document.documentElement.classList.contains("splash-seen") ||
      statusRef.current !== "ready"
    const updateLock = () => {
      const locked = blocked()
      root.style.overflowY = locked ? "hidden" : "auto"
      if (locked && frame.current && performance.now() >= lockUntil.current) cancelReturn()
      if (!locked && !motionFrame) motionFrame = requestAnimationFrame(sync)
    }
    const sync = (now = performance.now()) => {
      motionFrame = 0
      // A Link owns the next URL once clicked, including while its RSC response is pending.
      if (
        navigating.current ||
        (currentPath.current !== "/" && currentPath.current !== "/projects")
      )
        return
      const target = homeProjectProgress(root.scrollTop, height.current)
      const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60
      previousTime = now
      const p = blocked()
        ? progress.current
        : reduced.matches
          ? target
          : dampWorldProgress(progress.current, target, dt)
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
      const outside = smooth(Math.abs(p) / 0.18)
      root.style.setProperty("--home-navigation-opacity", String(1 - outside))
      const controls = root.querySelector<HTMLElement>("[data-home-ui]")
      if (controls) controls.inert = outside === 1
      setAtWindow(Math.abs(p) < 0.002)
      root.dispatchEvent(new Event("home-project-frame"))
      if (p === target && location.pathname === currentPath.current && automatic.current === null)
        history.replaceState(
          { ...history.state, homeProjectCheckpoint: { path: location.pathname, progress: p } },
          "",
        )
      const destination = p === -1 ? "/projects" : p > -0.999 ? "/" : currentPath.current
      if (
        destination !== currentPath.current &&
        automatic.current !== destination &&
        statusRef.current === "ready"
      ) {
        automatic.current = destination
        router.replace(destination, { scroll: false })
      }
      if (p !== target && !blocked() && !document.hidden) motionFrame = requestAnimationFrame(sync)
      else previousTime = 0
    }
    const scroll = () => {
      if (blocked()) {
        root.scrollTop = homeProjectScroll(progress.current, height.current)
        return
      }
      if (!motionFrame) motionFrame = requestAnimationFrame(sync)
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
      // Wheel and keyboard input share the same native scroll target.
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
      const target = homeProjectProgress(root.scrollTop, height.current)
      height.current = root.clientHeight
      root.scrollTop = homeProjectScroll(target, height.current)
    }
    const visibility = () => {
      if (document.hidden) cancelReturn()
      previousTime = 0
      if (document.hidden) {
        cancelAnimationFrame(motionFrame)
        motionFrame = 0
      } else updateLock()
    }
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]")
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return
      const destination = new URL(link.href)
      if (destination.origin !== location.origin || destination.pathname === currentPath.current)
        return
      navigating.current = true
      cancelReturn()
      cancelAnimationFrame(motionFrame)
      motionFrame = 0
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
    root.addEventListener("click", navigate)
    root.addEventListener("wheel", wheel, { passive: false })
    root.addEventListener("home-project-mode", updateLock)
    root.addEventListener("home-project-status", updateLock)
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
      cancelAnimationFrame(motionFrame)
      root.style.overflowY = oldOverflow
      root.style.removeProperty("--home-navigation-opacity")
      delete root.dataset.homeProjectStage
      delete root.dataset.homeProjectProgress
      delete root.dataset.homeProjectMode
      root.removeEventListener("scroll", scroll)
      root.removeEventListener("click", navigate)
      root.removeEventListener("wheel", wheel)
      root.removeEventListener("home-project-mode", updateLock)
      root.removeEventListener("home-project-status", updateLock)
      window.removeEventListener("keydown", keyboard)
      window.removeEventListener("resize", resize)
      window.removeEventListener("site-startup-phase", updateLock)
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [active, router, cancelReturn])
  useEffect(() => {
    document.getElementById("app-scroll-root")?.dispatchEvent(new Event("home-project-status"))
  }, [sceneStatus])
  const value = useMemo(
    () => ({
      enabled: active,
      progress,
      mode,
      setFreeView,
      returnWindow,
      sceneStatus,
      setRoomProps,
      retryScene,
    }),
    [active, mode, setFreeView, returnWindow, sceneStatus, retryScene],
  )

  return (
    <Context.Provider value={value}>
      {active ? (
        <div
          data-home-project-track
          style={{ height: "500dvh", position: "relative", flexShrink: 0 }}
        >
          <div style={{ position: "sticky", top: 0, height: "100dvh", isolation: "isolate" }}>
            <UnifiedScene
              key={sceneVersion}
              reduceMotion={false}
              rotationEnabled={roomProps?.rotationEnabled ?? false}
              wheelNavigation
              paused={roomProps?.paused ?? false}
              showLabels={roomProps?.showLabels ?? false}
              resetKey={roomProps?.resetKey ?? 0}
              onReady={ready}
              onError={failed}
              onChoose={roomProps?.onChoose ?? noop}
            />
            {children}
            {sceneStatus === "error" && pathname === "/" && (
              <div
                data-home-project-controls
                style={{
                  position: "fixed",
                  bottom: 24,
                  left: 24,
                  zIndex: 30,
                  padding: 16,
                  background: "var(--site-surface)",
                }}
                role="status"
              >
                暂时无法加载山湖小屋。<button onClick={retryScene}>重试</button>{" "}
                <Link href="/projects">项目目录</Link>
              </div>
            )}
          </div>
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
