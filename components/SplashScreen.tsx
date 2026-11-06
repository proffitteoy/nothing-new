"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getImageProps } from "next/image"
import { useRouter } from "next/navigation"
import { navigationLinks } from "./Navbar"
import { loadAnimeSnapshot } from "../lib/anime/client"
import { preloadRoomAssets } from "../app/projects/room-preload"
import { isMobileHomeClient } from "../lib/home-scene"

type Phase = "loading" | "preparing" | "ready"
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
  const [showAnimation, setShowAnimation] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const skipped = useRef(false)
  const changePhase = useCallback((next: Phase) => {
    document.documentElement.dataset.startupPhase = next
    performance.mark(`site:${next}`)
    window.dispatchEvent(new Event("site-startup-phase"))
    setPhase(next)
  }, [])
  const reveal = useCallback(() => {
    document.documentElement.classList.add("splash-seen")
    changePhase("ready")
  }, [changePhase])

  useEffect(() => {
    const controller = new AbortController()
    skipped.current = false
    const { signal } = controller
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
        if (!signal.aborted) reveal()
      })
      return () => controller.abort()
    }
    const alreadyRevealed = document.documentElement.classList.contains("splash-seen")
    if (alreadyRevealed) {
      queueMicrotask(() => {
        if (!signal.aborted) reveal()
      })
      return () => controller.abort()
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
        await Promise.allSettled([routes, preloadRoomAssets(), loadAnimeSnapshot(), cover.decode()])
      } finally {
        noteStyle.remove()
      }
    }
    // Only entry artwork belongs in the readiness gate. Unrelated routes,
    // model downloads and image decoding wait until the opening is finished.
    const critical = async () => {
      const started = performance.now()
      const images = Array.from(document.images).filter((img) => {
        // Hidden sidebars can contain lazy covers whose decode never starts.
        // Only visible entry artwork belongs in the startup readiness gate.
        if (!img.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false
        const rect = img.getBoundingClientRect()
        return img.loading !== "lazy" || (rect.top < innerHeight && rect.bottom > 0)
      })
      await Promise.allSettled([document.fonts.ready, ...images.map((img) => img.decode())])
      while (performance.now() - started < 4000) {
        const roomLoading =
          document.querySelector<HTMLElement>("[data-room-status]")?.dataset.roomStatus ===
          "loading"
        const homeArtwork =
          document.querySelector<HTMLElement>("[data-home-artwork]")?.dataset.homeArtwork
        const homeLoading = homeEntry && homeArtwork !== "ready" && homeArtwork !== "error"
        if (!roomLoading && !homeLoading) break
        await sleep(32, signal)
      }
    }

    // Never load the large SVG scene on subpages, small screens or in reduced
    // motion / data-saving modes.
    const animateHome =
      homeEntry &&
      matchMedia("(min-width: 768px)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !constrained

    let logoFinished = false
    let preloadFinished = false
    let logoHoldTimer: number | undefined
    let animationFallbackTimer: number | undefined

    const checkReady = () => {
      if (logoFinished && preloadFinished && !signal.aborted && !skipped.current) {
        if (logoHoldTimer !== undefined) window.clearTimeout(logoHoldTimer)
        reveal()
      }
    }

    const finishLogo = () => {
      if (logoFinished || signal.aborted || skipped.current) return
      logoFinished = true
      if (animationFallbackTimer !== undefined) window.clearTimeout(animationFallbackTimer)
      // Hold the generated Alpha complex while entry resources finish.
      changePhase("preparing")
      logoHoldTimer = window.setTimeout(() => {
        if (!signal.aborted && !skipped.current) reveal()
      }, 10_000)
      checkReady()
    }

    const onAnimationMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== "alpha-splash:complete"
      )
        return
      finishLogo()
    }

    const onFrameLoaded = () => {
      // Fail open if the embedded animation cannot signal its completion.
      if (animationFallbackTimer !== undefined) window.clearTimeout(animationFallbackTimer)
      animationFallbackTimer = window.setTimeout(finishLogo, 9500)
    }

    window.addEventListener("message", onAnimationMessage)
    window.addEventListener("alpha-splash:frame-loaded", onFrameLoaded)

    let warming = false
    const startWarm = () => {
      if (warming || signal.aborted || document.documentElement.dataset.startupPhase === "loading")
        return
      warming = true
      void warm().catch(() => {})
    }
    window.addEventListener("site-startup-phase", startWarm)

    const preloads = Promise.race([critical(), sleep(4000, signal)])
      .catch(() => {})
      .then(() => {
        preloadFinished = true
        checkReady()
      })

    if (animateHome) {
      queueMicrotask(() => {
        if (signal.aborted) return
        changePhase("loading")
        setShowAnimation(true)
      })
    } else {
      queueMicrotask(() => {
        if (!signal.aborted) changePhase("preparing")
      })
      // Non-home and accessibility fallbacks stay short; preload work may
      // continue without blocking the site.
      void Promise.race([preloads, sleep(2500, signal)])
        .then(() => {
          if (!signal.aborted && !skipped.current) reveal()
        })
        .catch(() => {
          if (!signal.aborted && !skipped.current) reveal()
        })
    }

    return () => {
      controller.abort()
      if (logoHoldTimer !== undefined) window.clearTimeout(logoHoldTimer)
      if (animationFallbackTimer !== undefined) window.clearTimeout(animationFallbackTimer)
      window.removeEventListener("message", onAnimationMessage)
      window.removeEventListener("alpha-splash:frame-loaded", onFrameLoaded)
      window.removeEventListener("site-startup-phase", startWarm)
    }
  }, [blogHref, changePhase, reveal, router])

  return (
    <>
      {phase !== "ready" && (
        <div
          data-startup-overlay
          data-startup-loading
          className="fixed inset-0 z-[100000] overflow-hidden bg-[#07121e]"
        >
          {showAnimation && (
            <iframe
              ref={iframeRef}
              src="/alpha-opening-v6.html"
              title="Alpha 复形开屏动画"
              aria-hidden="true"
              tabIndex={-1}
              onLoad={() => window.dispatchEvent(new Event("alpha-splash:frame-loaded"))}
              className="h-full w-full border-0 pointer-events-none"
            />
          )}
        </div>
      )}
      {phase !== "ready" && (
        <div
          data-startup-overlay
          className="fixed inset-x-0 bottom-8 z-[100001] flex items-center justify-center gap-4 text-xs text-slate-200"
        >
          {phase === "preparing" && showAnimation && (
            <span role="status">开场已完成，正在准备页面…</span>
          )}
          <button
            type="button"
            onClick={() => {
              skipped.current = true
              reveal()
            }}
            className="rounded-full border border-white/25 bg-[#07121e]/75 px-4 py-2 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-sky-300"
          >
            跳过开场
          </button>
        </div>
      )}
    </>
  )
}
