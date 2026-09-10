"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Clapperboard, Play, RotateCcw, Sparkles, Star } from "lucide-react"
import BackButton from "../../components/BackButton"
import { ANIME_BATCH_SIZE, getAnimeTitle, type AnimeItem, type AnimeLatestPointer, type AnimeSnapshot } from "../../lib/anime/schema"
import AnimeCoverImage from "./AnimeCoverImage"
import { groupAnimeByScore, sortAnimeByScore } from "./collection"

function isSnapshot(value: unknown): value is AnimeSnapshot {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<AnimeSnapshot>
  return candidate.version === 1 && typeof candidate.username === "string" && Array.isArray(candidate.items)
}

async function fetchSnapshot(signal: AbortSignal) {
  try {
    const latestResponse = await fetch("/anime/latest.json", { signal })
    if (!latestResponse.ok) throw new Error(`latest.json returned ${latestResponse.status}`)
    const latest = (await latestResponse.json()) as AnimeLatestPointer
    const snapshotResponse = await fetch(latest.snapshot, {
      cache: "force-cache",
      signal,
    })
    if (!snapshotResponse.ok) throw new Error(`snapshot returned ${snapshotResponse.status}`)
    const snapshot = await snapshotResponse.json()
    if (!isSnapshot(snapshot)) throw new Error("snapshot schema is invalid")
    return snapshot
  } catch (error) {
    if (signal.aborted) throw error
    console.warn(
      "[AnimeShelf] snapshot load failed, falling back to the Vercel API:",
      error instanceof Error ? error.message : "unknown error",
    )
  }

  const fallbackResponse = await fetch("/api/anime", {
    cache: "no-cache",
    signal,
  })
  if (!fallbackResponse.ok) throw new Error(`fallback API returned ${fallbackResponse.status}`)
  const fallback = await fallbackResponse.json()
  if (!isSnapshot(fallback)) throw new Error("fallback snapshot schema is invalid")
  return fallback
}

function useProgressiveCount(total: number) {
  const [count, setCount] = useState(Math.min(ANIME_BATCH_SIZE, total))
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCount(Math.min(ANIME_BATCH_SIZE, total))
  }, [total])

  const loadMore = useCallback(() => {
    setCount((current) => Math.min(total, current + ANIME_BATCH_SIZE))
  }, [total])

  useEffect(() => {
    const element = sentinelRef.current
    if (!element || count >= total) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { rootMargin: "320px 0px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [count, loadMore, total])

  return {
    count,
    remaining: Math.max(0, total - count),
    sentinelRef,
    loadMore,
  }
}

export default function AnimeShelf() {
  const [snapshot, setSnapshot] = useState<AnimeSnapshot | null>(null)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setError(false)

    void fetchSnapshot(controller.signal)
      .then((data) => setSnapshot(data))
      .catch((loadError) => {
        if (controller.signal.aborted) return
        console.error(
          "[AnimeShelf] failed to load anime data:",
          loadError instanceof Error ? loadError.message : "unknown error",
        )
        setError(true)
      })

    return () => controller.abort()
  }, [reloadKey])

  if (!snapshot) {
    return error ? (
      <ShelfState
        title="番剧数据暂时不可用"
        description="快照与实时中转都未能返回数据。"
        action={() => setReloadKey((key) => key + 1)}
      />
    ) : (
      <ShelfState title="正在读取番剧快照" description="先加载 metadata，封面会按视口渐进加载。" />
    )
  }

  return <AnimeShelfContent snapshot={snapshot} />
}

function AnimeShelfContent({ snapshot }: { snapshot: AnimeSnapshot }) {
  const watching = useMemo(
    () => snapshot.items.filter((item) => item.status === "watching"),
    [snapshot.items],
  )
  const watched = useMemo(
    () => sortAnimeByScore(snapshot.items.filter((item) => item.status === "watched")),
    [snapshot.items],
  )
  const watchingBatch = useProgressiveCount(watching.length)
  const watchedBatch = useProgressiveCount(watched.length)
  const visibleWatching = watching.slice(0, watchingBatch.count)
  const visibleWatched = watched.slice(0, watchedBatch.count)
  const watchedGroups = useMemo(() => groupAnimeByScore(visibleWatched), [visibleWatched])

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6 lg:px-10">
      <BackButton />

      <header className="relative mt-3 overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/45 px-4 py-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-500/10" />
        <div className="relative flex items-center justify-between gap-4 sm:justify-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/65 text-indigo-600 shadow-sm dark:border-white/10 dark:bg-slate-950/35 dark:text-indigo-300">
            <Clapperboard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
              ANIME INDEX
            </p>
            <div className="mt-0.5 flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">番剧</h1>
              <a
                href={`https://bgm.tv/user/${encodeURIComponent(snapshot.username)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
              >
                @{snapshot.username}
              </a>
            </div>
          </div>
        </div>

        <nav aria-label="番剧分区" className="relative mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:w-[22rem]">
          <a
            href="#watching"
            className="group flex min-w-0 items-center gap-2 rounded-2xl border border-indigo-200/70 bg-indigo-50/65 px-3 py-2.5 text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-100/70 dark:border-indigo-400/15 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/15"
          >
            <span className="text-[9px] font-black tracking-[0.16em] opacity-55">01</span>
            <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
            <span className="truncate text-xs font-black">正在看</span>
            <span className="ml-auto rounded-full bg-indigo-600/10 px-1.5 py-0.5 text-[9px] font-black dark:bg-white/10">{watching.length}</span>
          </a>
          <a
            href="#watched"
            className="group flex min-w-0 items-center gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/65 px-3 py-2.5 text-amber-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
          >
            <span className="text-[9px] font-black tracking-[0.16em] opacity-55">02</span>
            <Star className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
            <span className="truncate text-xs font-black">看过</span>
            <span className="ml-auto rounded-full bg-amber-600/10 px-1.5 py-0.5 text-[9px] font-black dark:bg-white/10">{watched.length}</span>
          </a>
        </nav>
      </header>

      <section id="watching" aria-labelledby="watching-title" className="mt-10 scroll-mt-24">
        <SectionHeading
          id="watching-title"
          eyebrow="NOW SHOWING"
          title="正在看"
          description="故事还在继续，下一集仍亮着灯。"
          icon="play"
        />
        {visibleWatching.length > 0 ? (
          <AnimeGrid items={visibleWatching} eagerCount={16} />
        ) : (
          <EmptyShelf message="这里暂时没有正在看的故事" />
        )}
        <LoadMoreControl
          containerRef={watchingBatch.sentinelRef}
          remaining={watchingBatch.remaining}
          onLoadMore={watchingBatch.loadMore}
        />
      </section>

      <section id="watched" aria-labelledby="watched-title" className="mt-16 scroll-mt-24">
        <SectionHeading
          id="watched-title"
          eyebrow="RATED ARCHIVE"
          title="看过"
          description="按我的 Bangumi 评分，从高到低归档。"
          icon="star"
        />
        {watchedGroups.length > 0 ? (
          <div className="space-y-12">
            {watchedGroups.map((group) => {
              const groupId = group.score === null ? "anime-unrated" : `anime-rating-${group.score}`
              return (
                <section key={groupId} aria-labelledby={groupId}>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-black shadow-sm " +
                        (group.score === null
                          ? "border-slate-200/70 bg-white/55 text-slate-500 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                          : "border-amber-200/70 bg-amber-50/75 text-amber-700 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-200")
                      }
                    >
                      {group.score ?? "—"}
                    </span>
                    <div>
                      <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">MY SCORE</p>
                      <h3 id={groupId} className="mt-0.5 text-lg font-black text-slate-900 dark:text-white">
                        {group.score === null ? "未评分" : `${group.score} 分`}
                      </h3>
                    </div>
                    <span className="h-px flex-1 bg-gradient-to-r from-slate-300/70 to-transparent dark:from-white/15" />
                  </div>
                  <AnimeGrid items={group.items} showRating />
                </section>
              )
            })}
          </div>
        ) : (
          <EmptyShelf message="这里暂时没有已经看过的故事" />
        )}
        <LoadMoreControl
          containerRef={watchedBatch.sentinelRef}
          remaining={watchedBatch.remaining}
          onLoadMore={watchedBatch.loadMore}
        />
      </section>
    </main>
  )
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  icon,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  icon: "play" | "star"
}) {
  const Icon = icon === "play" ? Sparkles : Star
  return (
    <div className="mb-5 flex items-end justify-between gap-5 px-1">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {eyebrow}
        </div>
        <h2 id={id} className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>
      </div>
    </div>
  )
}

function AnimeGrid({
  items,
  showRating = false,
  eagerCount = 0,
}: {
  items: AnimeItem[]
  showRating?: boolean
  eagerCount?: number
}) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 sm:gap-x-3 sm:gap-y-6 lg:grid-cols-6 lg:gap-x-4 lg:gap-y-8">
      {items.map((anime, index) => {
        const title = getAnimeTitle(anime)
        return (
          <a
            key={anime.id}
            href={`https://bgm.tv/subject/${anime.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group min-w-0"
          >
            <span className="relative block aspect-[3/4] overflow-hidden rounded-xl border border-white/55 bg-slate-200/70 shadow-md transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[0.35deg] group-hover:shadow-xl dark:border-white/10 dark:bg-slate-800/70 sm:rounded-2xl">
              <AnimeCoverImage src={anime.cover} alt={`${title}封面`} eager={index < eagerCount} />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/20 opacity-70 transition-opacity group-hover:opacity-40" />
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 sm:rounded-2xl" />
              {showRating && (
                <span
                  className={
                    "absolute right-1.5 top-1.5 rounded-full border px-1.5 py-0.5 text-[8px] font-black shadow-sm backdrop-blur-md sm:right-2 sm:top-2 sm:text-[9px] " +
                    (anime.score === undefined
                      ? "border-white/40 bg-slate-900/55 text-white"
                      : "border-amber-100/70 bg-amber-400/90 text-amber-950")
                  }
                >
                  {anime.score === undefined ? "未评" : `${anime.score} 分`}
                </span>
              )}
            </span>
            <span className="mt-2 block line-clamp-2 text-center text-[10px] font-black leading-4 text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300 sm:mt-2.5 sm:text-xs sm:leading-5">{title}</span>
          </a>
        )
      })}
    </div>
  )
}

function EmptyShelf({ message }: { message: string }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/60 bg-white/35 px-6 py-14 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
      <Clapperboard className="mx-auto h-8 w-8 text-indigo-400" aria-hidden="true" />
      <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">{message}</p>
    </div>
  )
}

function LoadMoreControl({
  containerRef,
  remaining,
  onLoadMore,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  remaining: number
  onLoadMore: () => void
}) {
  if (remaining <= 0) return null
  return (
    <div ref={containerRef} className="relative mt-8 flex flex-col items-center pt-8">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-28 bg-gradient-to-b from-transparent to-white/20 dark:to-slate-950/15" />
      <button
        type="button"
        onClick={onLoadMore}
        className="relative inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-5 py-3 text-xs font-black text-slate-700 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:text-indigo-300"
      >
        <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
        继续展开 · 还有 {remaining} 部
      </button>
    </div>
  )
}

function ShelfState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: () => void
}) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6 lg:px-10">
      <BackButton />
      <div className="mt-8 rounded-[1.75rem] border border-white/55 bg-white/45 px-6 py-16 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
        <Clapperboard className="mx-auto h-9 w-9 text-indigo-400" aria-hidden="true" />
        <h1 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
        {action && (
          <button
            type="button"
            onClick={action}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2.5 text-xs font-black text-slate-700 shadow-md transition hover:text-indigo-600 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200 dark:hover:text-indigo-300"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            重试
          </button>
        )}
      </div>
    </main>
  )
}
