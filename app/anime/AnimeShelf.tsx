"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, Clapperboard, Play, Sparkles } from "lucide-react"
import Image from "next/image"
import BackButton from "../../components/BackButton"
import type { AnimeEntry } from "./bangumi"

type ShelfStatus = "watching" | "watched"

type AnimeShelfProps = {
  username: string
  watching: AnimeEntry[]
  watched: AnimeEntry[]
}

const INITIAL_VISIBLE_COUNT = 5
const EXPAND_COUNT = 10

const statusDetails = {
  watching: {
    label: "正在看",
    eyebrow: "NOW SHOWING",
    description: "故事还在继续，下一集仍亮着灯。",
    icon: Play,
  },
  watched: {
    label: "看过",
    eyebrow: "END CREDITS",
    description: "已经抵达片尾，也曾在这里停留。",
    icon: Check,
  },
} satisfies Record<
  ShelfStatus,
  { label: string; eyebrow: string; description: string; icon: typeof Play }
>

export default function AnimeShelf({ username, watching, watched }: AnimeShelfProps) {
  const [activeStatus, setActiveStatus] = useState<ShelfStatus>("watching")
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const [hasScrolled, setHasScrolled] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const lists = useMemo(() => ({ watching, watched }), [watching, watched])
  const currentList = lists[activeStatus]
  const visibleAnime = currentList.slice(0, visibleCount)
  const hasMore = visibleCount < currentList.length
  const currentDetails = statusDetails[activeStatus]

  useEffect(() => {
    const markScrolled = () => {
      if (window.scrollY > 120) setHasScrolled(true)
    }

    markScrolled()
    window.addEventListener("scroll", markScrolled, { passive: true })
    return () => window.removeEventListener("scroll", markScrolled)
  }, [])

  useEffect(() => {
    if (!hasScrolled || !hasMore || !loadMoreRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + EXPAND_COUNT, currentList.length))
        }
      },
      { rootMargin: "120px 0px" },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [activeStatus, currentList.length, hasMore, hasScrolled])

  const selectStatus = (status: ShelfStatus) => {
    setActiveStatus(status)
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-24 sm:px-6 md:pt-28 lg:px-10">
      <BackButton />

      <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-white/50 bg-white/45 px-5 py-7 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-pink-300/25 blur-3xl dark:bg-pink-500/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-72 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/10" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 text-[10px] font-black tracking-[0.24em] text-indigo-600 shadow-sm dark:border-white/10 dark:bg-slate-950/35 dark:text-indigo-300">
              <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
              ANIME LOG
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              放映清单
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              正在看的故事，与已经抵达片尾的故事。封面来自 Bangumi，并随着我的观看记录同步更新。
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/55 p-1.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/35">
            {(Object.keys(statusDetails) as ShelfStatus[]).map((status) => {
              const details = statusDetails[status]
              const Icon = details.icon
              const count = lists[status].length
              const isActive = status === activeStatus

              return (
                <button
                  type="button"
                  key={status}
                  aria-pressed={isActive}
                  onClick={() => selectStatus(status)}
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black transition-colors sm:text-sm ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="anime-status-pill"
                      className="absolute inset-0 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/25"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" fill={status === "watching" && isActive ? "currentColor" : "none"} aria-hidden="true" />
                  <span className="relative">{details.label}</span>
                  <span className={`relative rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-white/20" : "bg-slate-900/5 dark:bg-white/10"}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mt-8" aria-live="polite" aria-labelledby="anime-shelf-title">
        <div className="mb-5 flex items-end justify-between gap-5 px-1">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {currentDetails.eyebrow}
            </div>
            <h2 id="anime-shelf-title" className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {currentDetails.label}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
              {currentDetails.description}
            </p>
          </div>
          <a
            href={`https://bgm.tv/user/${encodeURIComponent(username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs font-black text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 sm:block"
          >
            @{username}
          </a>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStatus}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {currentList.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:gap-y-8 lg:grid-cols-5 lg:gap-x-5">
                {visibleAnime.map((anime, index) => (
                  <motion.a
                    key={anime.id}
                    href={`https://bgm.tv/subject/${anime.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: Math.min(index % EXPAND_COUNT, 5) * 0.045 }}
                    className="group min-w-0"
                  >
                    <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl border border-white/55 bg-slate-200/70 shadow-lg transition duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[0.4deg] group-hover:shadow-2xl dark:border-white/10 dark:bg-slate-800/70 sm:rounded-3xl">
                      {anime.cover ? (
                        <Image
                          src={anime.cover}
                          alt={`${anime.title}封面`}
                          fill
                          sizes="(max-width: 639px) 31vw, (max-width: 1023px) 23vw, 210px"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200/80 via-white/60 to-pink-200/80 px-3 text-center text-[10px] font-black tracking-[0.18em] text-indigo-700 dark:from-indigo-950 dark:via-slate-900 dark:to-pink-950 dark:text-indigo-200">
                          NO COVER
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/20 opacity-70 transition-opacity group-hover:opacity-40" />
                      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 sm:rounded-3xl" />
                    </span>
                    <span className="mt-3 block line-clamp-2 text-center text-xs font-black leading-5 text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300 sm:text-sm">
                      {anime.title}
                    </span>
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-white/60 bg-white/35 px-6 py-16 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
                <Clapperboard className="mx-auto h-9 w-9 text-indigo-400" aria-hidden="true" />
                <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">
                  这一格胶片还是空的
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {hasMore && (
          <div ref={loadMoreRef} className="relative mt-8 flex flex-col items-center pt-10">
            <div className="pointer-events-none absolute inset-x-0 -top-20 h-28 bg-gradient-to-b from-transparent to-white/20 dark:to-slate-950/15" />
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + EXPAND_COUNT, currentList.length))}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-5 py-3 text-xs font-black text-slate-700 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:text-indigo-300"
            >
              <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
              继续展开 · 还有 {currentList.length - visibleCount} 部
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
