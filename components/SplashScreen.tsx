"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Image, { getImageProps } from "next/image"
import { useRouter } from "next/navigation"
import { siteConfig } from "../siteConfig"
import { navigationLinks } from "./Navbar"
import { loadAnimeSnapshot } from "../lib/anime/client"
import { preloadRoomAssets } from "../app/projects/room-preload"

type Phase = "loading" | "particles" | "ready"
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
  const reduced = useReducedMotion()
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
    try {
      sessionStorage.setItem("hasSeenSplash", "true")
    } catch {
      /* Optional persistence. */
    }
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
    const seen = document.documentElement.classList.contains("splash-seen")

    // Router prefetch has no completion promise. It warms all navigation targets,
    // including the resolved note URL and the otherwise hidden mobile menu.
    const prefetchNavigation = async () => {
      for (const link of navigationLinks) {
        if (signal.aborted) return
        router.prefetch(link.href === "/blog" ? blogHref : link.href)
        await sleep(constrained ? 180 : 80, signal)
      }
    }
    const warm = async () => {
      await sleep(300, signal)
      const routes = prefetchNavigation()
      if (constrained) {
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
          import("../app/projects/RoomScene").then((module) => module.preloadRoomScene()),
          import("../app/music/MusicClient"),
          loadAnimeSnapshot(),
          cover.decode(),
        ])
      } finally {
        noteStyle.remove()
      }
    }
    const important = warm().catch(() => {})
    const run = async () => {
      if (seen) {
        reveal()
        return
      }
      changePhase("loading")
      const critical = async () => {
        const started = performance.now()
        const images = Array.from(document.images).filter((img) => {
          const rect = img.getBoundingClientRect()
          return img.loading !== "lazy" || (rect.top < innerHeight && rect.bottom > 0)
        })
        await Promise.allSettled([document.fonts.ready, ...images.map((img) => img.decode())])
        while (!document.documentElement.dataset.fieldReady && performance.now() - started < 4000)
          await sleep(32, signal)
      }
      // The familiar animation remains, but readiness now has a bounded say in exit.
      await Promise.all([sleep(2200, signal), Promise.race([critical(), sleep(4000, signal)])])
      if (signal.aborted || skipped.current) return
      const motionReduced = matchMedia("(prefers-reduced-motion: reduce)").matches
      const normal = document.documentElement.dataset.performanceMode === "normal"
      if (!motionReduced && !normal) {
        changePhase("particles")
        await Promise.all([sleep(500, signal), Promise.race([important, sleep(2000, signal)])])
      }
      if (!signal.aborted && !skipped.current) reveal()
    }
    void run().catch(() => {
      if (!signal.aborted && !skipped.current) reveal()
    })
    return () => {
      controller.abort()
    }
  }, [blogHref, changePhase, reveal, router])

  return (
    <>
      <AnimatePresence>
        {phase === "loading" && (
          <motion.div
            key="splash-screen-container"
            data-startup-overlay
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
          >
            <div className="relative z-10 flex flex-col items-center">
              {/* 头像光环 */}
              <div className="relative w-24 h-24 mb-8">
                <motion.div
                  animate={reduced ? undefined : { rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]"
                />
                <div className="relative w-full h-full rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl">
                  <Image
                    src={siteConfig.avatarUrl}
                    alt="头像"
                    width={128}
                    height={128}
                    preload
                    sizes="128px"
                    quality={85}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-[0.2em] uppercase">
                {siteConfig.authorName}
              </h1>
              <p
                role="status"
                className="text-[10px] font-black text-slate-400 tracking-[0.5em] mb-12"
              >
                正在初始化站点
              </p>

              <div className="w-40 h-[1.5px] bg-slate-200 dark:bg-slate-800 relative">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                  className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {phase !== "ready" && (
        <div
          data-startup-overlay
          className="fixed inset-x-0 bottom-10 z-[100001] flex items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-300"
        >
          {phase === "particles" && <span role="status">研究、构建，也持续记录。</span>}
          <button
            type="button"
            onClick={() => {
              skipped.current = true
              reveal()
            }}
            className="rounded-full border border-slate-300/60 bg-white/70 px-4 py-2 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-white/20 dark:bg-slate-900/70"
          >
            跳过开场
          </button>
        </div>
      )}
    </>
  )
}
