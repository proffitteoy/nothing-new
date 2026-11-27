"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { getImageProps } from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { navigationLinks } from "./Navbar"
import { loadAnimeSnapshot } from "../lib/anime/client"
import { loadPaperReports } from "../lib/paper-reports-client"
import { preloadRoomAssets } from "../app/projects/room-preload"
import {
  HOME_ROOM,
  homeOpeningRevealPath,
  homeWindowProjection,
  isMobileHomeClient,
} from "../lib/home-scene"
import contours from "../data/opening-contours.json"
import styles from "./SplashScreen.module.css"
import homeStyles from "./HomeScene.module.css"

type Phase = "loading" | "preparing" | "exiting" | "ready"

// Contours use the existing artwork's 1672×877 coordinates. Display them through
// the same window projection as the homepage; colour comes from that live scene.
const ridgePoints = contours.ridge
  .slice(1)
  .split(" L")
  .map((point) => point.split(" ").map(Number))
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort)
      resolve()
    }, ms)
    signal.addEventListener("abort", abort, { once: true })
  })

export default function SplashScreen({ blogHref }: { blogHref: string }) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [opening, setOpening] = useState<"animated" | "static" | null>(null)
  const surface = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState([1600, 1000])
  const maskId = useId().replace(/:/g, "")
  const [width, height] = size
  const view = homeWindowProjection(width, height)
  const lakeTransform = `translate(${view.lake.x} ${view.lake.y}) scale(${view.lake.width / 1672})`
  const signatureY = view.room.y + (view.room.height * HOME_ROOM.sillCenterY) / HOME_ROOM.height
  const router = useRouter()
  const pathname = usePathname()
  const entryPath = useRef(pathname)
  const changePhase = useCallback((next: Phase) => {
    document.documentElement.dataset.startupPhase = next
    performance.mark(`site:${next}`)
    window.dispatchEvent(new Event("site-startup-phase"))
    setPhase(next)
  }, [])
  const reveal = useCallback(() => {
    document.documentElement.classList.add("splash-seen")
    document.querySelectorAll<HTMLElement>("[data-startup-inert]").forEach((element) => {
      element.inert = false
      element.removeAttribute("data-startup-inert")
    })
    if (document.documentElement.dataset.startupPhase !== "ready") changePhase("ready")
    else setPhase("ready")
  }, [changePhase])
  const finishOpening = useRef(reveal)

  useEffect(() => {
    if (pathname !== entryPath.current) finishOpening.current()
  }, [pathname])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    let finished = false
    let exiting = false
    let frame = 0
    let timelineTimer: number | undefined
    let deadlineTimer: number | undefined
    let readinessTimer: number | undefined
    const resize = () => setSize([innerWidth, innerHeight])
    queueMicrotask(() => {
      if (!signal.aborted) resize()
    })
    window.addEventListener("resize", resize)
    const stop = () => {
      controller.abort()
      cancelAnimationFrame(frame)
      window.clearTimeout(timelineTimer)
      window.clearTimeout(deadlineTimer)
      window.clearTimeout(readinessTimer)
      window.removeEventListener("site-startup-phase", onPhase)
      window.removeEventListener("resize", resize)
    }
    const finish = () => {
      if (finished) return
      finished = true
      stop()
      reveal()
    }
    const onPhase = () => {
      if (document.documentElement.dataset.startupPhase === "ready") finish()
    }
    finishOpening.current = finish
    window.addEventListener("site-startup-phase", onPhase)
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection
    const constrained = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")
    // Snapshot the entry route once. Soft navigation keeps this layout and
    // must not change the startup sequence or replay it.
    const homeEntry = window.location.pathname === "/"
    const mobile = isMobileHomeClient()
    if (homeEntry && mobile) {
      queueMicrotask(() => {
        if (!signal.aborted) finish()
      })
      return stop
    }
    const alreadyRevealed = document.documentElement.classList.contains("splash-seen")
    if (alreadyRevealed) {
      queueMicrotask(() => {
        if (!signal.aborted) finish()
      })
      return stop
    }

    // Router prefetch has no completion promise. It warms all navigation targets,
    // including the resolved note URL and the otherwise hidden mobile menu.
    const prefetchNavigation = async () => {
      for (const link of navigationLinks) {
        if (signal.aborted) return
        if (mobile && link.href === "/") continue
        router.prefetch(link.href === "/blog" ? blogHref : link.href)
        await sleep(constrained ? 180 : 80, signal)
      }
    }
    const warm = async () => {
      await sleep(300, signal)
      const routes = prefetchNavigation()
      if (constrained || mobile) {
        await routes
        return
      }
      const noteStyle = document.createElement("link")
      noteStyle.rel = "preload"
      noteStyle.as = "style"
      noteStyle.href = "/quartz-assets/note.css"
      document.head.appendChild(noteStyle)
      const { props } = getImageProps({
        src: "/about-cover.png",
        alt: "",
        fill: true,
        sizes: "(max-width: 767px) 95vw, 896px",
        quality: 75,
      })
      const cover = new window.Image()
      cover.decoding = "async"
      cover.fetchPriority = "low"
      cover.sizes = props.sizes ?? ""
      cover.srcset = props.srcSet ?? ""
      cover.src = props.src
      try {
        await Promise.allSettled([
          routes,
          preloadRoomAssets(),
          loadAnimeSnapshot(),
          loadPaperReports(),
          cover.decode(),
        ])
      } finally {
        noteStyle.remove()
      }
    }
    // Sidebar artwork remains warm, but does not gate the homepage handoff.
    const critical = async () => {
      const started = performance.now()
      while (performance.now() - started < 4000) {
        const roomLoading =
          document.querySelector<HTMLElement>("[data-room-status]")?.dataset.roomStatus ===
          "loading"
        const homeArtwork = document.querySelector<HTMLElement>("[data-home-artwork-kind]")?.dataset
          .homeArtwork
        const homeLoading = homeEntry && homeArtwork !== "ready" && homeArtwork !== "error"
        if (!roomLoading && !homeLoading) break
        await sleep(32, signal)
      }
      // HomeScene reports its room and exterior readiness above. Warm the
      // restored sidebar screenshots while the opening plays.
      const images = Array.from(document.images).filter((img) => {
        if (homeEntry && img.closest("[data-home-preview]")) return true
        if (!img.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false
        const rect = img.getBoundingClientRect()
        return img.loading !== "lazy" || (rect.top < innerHeight && rect.bottom > 0)
      })
      await Promise.allSettled([document.fonts.ready, ...images.map((img) => img.decode())])
    }

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
    const animateHome =
      homeEntry &&
      matchMedia("(min-width: 768px)").matches &&
      !reducedMotion.matches &&
      !constrained

    const entryReady = Promise.race([critical(), sleep(4000, signal)])
    const preloads = Promise.allSettled([warm(), entryReady])

    if (homeEntry) {
      queueMicrotask(() => {
        if (signal.aborted) return
        changePhase(animateHome ? "loading" : "preparing")
        setOpening(animateHome ? "animated" : "static")
      })
      const exit = () => {
        if (signal.aborted || exiting) return
        exiting = true
        cancelAnimationFrame(frame)
        window.clearTimeout(timelineTimer)
        window.clearTimeout(readinessTimer)
        window.clearTimeout(deadlineTimer)
        document.querySelectorAll<HTMLElement>("#app-mount-root").forEach((element) => {
          if (element.inert) return
          element.inert = true
          element.setAttribute("data-startup-inert", "")
        })
        changePhase("exiting")
        const wash = surface.current?.querySelector<SVGPathElement>("[data-opening-wash]")
        if (wash) {
          const started = performance.now()
          const advance = (now: number) => {
            if (signal.aborted) return
            if (animateHome && reducedMotion.matches) {
              finish()
              return
            }
            const progress = animateHome ? Math.min(1, (now - started) / 1550) : 1
            wash.setAttribute("d", homeOpeningRevealPath(progress, ridgePoints))
            wash.setAttribute("data-reveal-progress", String(progress))
            if (progress < 1) frame = requestAnimationFrame(advance)
          }
          advance(started)
        }
        if (!signal.aborted) timelineTimer = window.setTimeout(finish, animateHome ? 1550 : 150)
      }
      const checkHome = () => {
        if (signal.aborted || exiting) return
        if (
          document.querySelector<HTMLElement>("[data-home-artwork-kind]")?.dataset.homeArtwork ===
          "ready"
        )
          exit()
        else readinessTimer = window.setTimeout(checkHome, 50)
      }
      const start = () => {
        if (signal.aborted || exiting) return
        const svg = surface.current?.querySelector("svg")
        if (!svg || !surface.current) {
          frame = requestAnimationFrame(start)
          return
        }
        surface.current.dataset.started = "true"
        performance.mark("site:opening")
        timelineTimer = window.setTimeout(checkHome, animateHome ? 850 : 0)
      }
      // Reserve the 1.55s scene reveal inside the same absolute 4.75s bound.
      deadlineTimer = window.setTimeout(exit, animateHome ? 3200 : 2500)
      frame = requestAnimationFrame(start)
    } else {
      queueMicrotask(() => {
        if (!signal.aborted) changePhase("preparing")
      })
      // Non-home and accessibility fallbacks stay short; preload work may
      // continue without blocking the site.
      void Promise.race([
        entryPath.current === "/papers" ? entryReady : preloads,
        sleep(2500, signal),
      ])
        .then(() => {
          if (!signal.aborted) finish()
        })
        .catch(() => {
          if (!signal.aborted) finish()
        })
    }

    return () => {
      stop()
      if (exiting && !finished) reveal()
    }
  }, [blogHref, changePhase, reveal, router])

  return (
    <>
      {phase !== "ready" && (
        <div
          ref={surface}
          data-startup-overlay
          data-startup-loading
          data-opening-mode={opening ?? undefined}
          className={styles.opening}
        >
          {opening && (
            <>
              <svg className={styles.stage} width="100%" height="100%" aria-hidden="true">
                <defs>
                  <clipPath id={`${maskId}-window`}>
                    <rect
                      data-opening-window
                      x={view.opening.x}
                      y={view.opening.y}
                      width={view.opening.width}
                      height={view.opening.height}
                    />
                  </clipPath>
                  <filter
                    id={`${maskId}-feather`}
                    filterUnits="userSpaceOnUse"
                    x="-64"
                    y="-64"
                    width="1800"
                    height="1005"
                  >
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                  <mask
                    id={`${maskId}-paper`}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width={width}
                    height={height}
                  >
                    <rect width={width} height={height} fill="white" />
                    <g clipPath={`url(#${maskId}-window)`}>
                      <g transform={lakeTransform}>
                        <path
                          className={styles.wash}
                          data-opening-wash
                          d={homeOpeningRevealPath(0, ridgePoints)}
                          fill="black"
                          filter={`url(#${maskId}-feather)`}
                        />
                      </g>
                    </g>
                  </mask>
                </defs>
                <rect
                  className={styles.paper}
                  width="100%"
                  height="100%"
                  fill="#f7f8f7"
                  mask={`url(#${maskId}-paper)`}
                />
                <g className={styles.lines} mask={`url(#${maskId}-paper)`}>
                  <g clipPath={`url(#${maskId}-window)`}>
                    <g className={styles.ink} data-opening-lake transform={lakeTransform}>
                      <path
                        className={styles.ridge}
                        data-opening-ridge
                        pathLength={1}
                        d={contours.ridge}
                      />
                      {contours.folds.map((d, i) => (
                        <path key={i} className={styles.fold} pathLength={1} d={d} />
                      ))}
                      <path className={styles.shore} pathLength={1} d={contours.shore} />
                      <path className={styles.water} d={contours.water} />
                    </g>
                  </g>
                </g>
              </svg>
              <p
                className={homeStyles.signature}
                style={{ left: Math.max(64, view.opening.x + 18), top: signatureY }}
              >
                阿の宝藏之地
              </p>
            </>
          )}
        </div>
      )}
      {phase !== "ready" && (
        <div data-startup-overlay className={styles.actions}>
          <button type="button" onClick={() => finishOpening.current()}>
            跳过开场
          </button>
        </div>
      )}
    </>
  )
}
