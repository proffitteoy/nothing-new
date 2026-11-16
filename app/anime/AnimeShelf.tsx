"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Clapperboard, RotateCcw, Sparkles, Star } from "lucide-react"
import {
  ANIME_BATCH_SIZE,
  getAnimeTitle,
  type AnimeItem,
  type AnimeSnapshot,
} from "../../lib/anime/schema"
import { useImageLoadingPolicy } from "../../lib/image-loading"
import AnimeCoverImage from "./AnimeCoverImage"
import { loadAnimeSnapshot } from "../../lib/anime/client"
import { groupAnimeByScore, sortAnimeByScore } from "./collection"

function useProgressiveCount(total: number) {
  const [count, setCount] = useState(Math.min(ANIME_BATCH_SIZE, total))
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    setCount((current) => Math.min(total, current + ANIME_BATCH_SIZE))
  }, [total])

  useEffect(() => {
    const element = sentinelRef.current
    if (!element || count >= total || typeof IntersectionObserver === "undefined") return

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
    let active = true

    void loadAnimeSnapshot()
      .then((data) => {
        if (active) setSnapshot(data)
      })
      .catch((loadError) => {
        if (!active) return
        console.error(
          "[AnimeShelf] failed to load anime data:",
          loadError instanceof Error ? loadError.message : "unknown error",
        )
        setError(true)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  if (!snapshot) {
    return error ? (
      <ShelfState
        title="番剧数据暂时不可用"
        action={() => {
          setError(false)
          setSnapshot(null)
          setReloadKey((key) => key + 1)
        }}
      />
    ) : (
      <ShelfState title="正在加载番剧…" />
    )
  }

  return <AnimeShelfContent snapshot={snapshot} />
}

function AnimeShelfContent({ snapshot }: { snapshot: AnimeSnapshot }) {
  const loadingPolicy = useImageLoadingPolicy("anime")
  const [hashTarget, setHashTarget] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash,
  )
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
  const watchedGroupsWithOffsets = useMemo(
    () =>
      watchedGroups.map((group, index) => ({
        group,
        offset: watchedGroups
          .slice(0, index)
          .reduce((count, previousGroup) => count + previousGroup.items.length, 0),
      })),
    [watchedGroups],
  )
  const prioritizeWatched = hashTarget === "#watched"

  useEffect(() => {
    const updateHashTarget = () => setHashTarget(window.location.hash)
    window.addEventListener("hashchange", updateHashTarget)
    return () => window.removeEventListener("hashchange", updateHashTarget)
  }, [])

  useEffect(() => {
    if (hashTarget !== "#watched") return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("watched")?.scrollIntoView()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hashTarget])

  return (
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-10">
      <section id="watching" aria-labelledby="watching-title" className="scroll-mt-24">
        <SectionHeading
          id="watching-title"
          title="正在看"
          icon="play"
        />
        {visibleWatching.length > 0 ? (
          <AnimeGrid
            items={visibleWatching}
            immediateCount={prioritizeWatched ? 0 : loadingPolicy.immediateBudget}
            nearViewportMarginPx={loadingPolicy.nearViewportMarginPx}
          />
        ) : (
          <EmptyShelf message="这里暂时没有正在看的故事" />
        )}
        <LoadMoreControl
          containerRef={watchingBatch.sentinelRef}
          remaining={watchingBatch.remaining}
          onLoadMore={watchingBatch.loadMore}
        />
      </section>

      <section id="watched" aria-labelledby="watched-title" className="mt-12 scroll-mt-24">
        <SectionHeading
          id="watched-title"
          title="看过"
          icon="star"
        />
        {watchedGroups.length > 0 ? (
          <div className="space-y-12">
            {watchedGroupsWithOffsets.map(({ group, offset }) => {
              const groupId = group.score === null ? "anime-unrated" : `anime-rating-${group.score}`
              return (
                <section key={groupId} aria-labelledby={groupId}>
                  <div className="mb-4 flex items-center gap-3 md:w-fit md:rounded-lg md:bg-[var(--site-surface)] md:py-2 md:pr-4">
                    <span
                      className={
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-black shadow-sm " +
                        (group.score === null
                          ? "border-[var(--site-line)] bg-[var(--site-surface)] text-slate-500"
                          : "border-rose-200/70 bg-rose-50/75 text-rose-700")
                      }
                    >
                      {group.score ?? "—"}
                    </span>
                    <div>
                      <h3 id={groupId} className="mt-0.5 text-lg font-black text-slate-900">
                        {group.score === null ? "未评分" : `${group.score} 分`}
                      </h3>
                    </div>
                    <span className="h-px flex-1 bg-gradient-to-r from-slate-300/70 to-transparent" />
                  </div>
                  <AnimeGrid
                    items={group.items}
                    showRating
                    immediateCount={
                      prioritizeWatched ? Math.max(0, loadingPolicy.immediateBudget - offset) : 0
                    }
                    nearViewportMarginPx={loadingPolicy.nearViewportMarginPx}
                  />
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
  title,
  icon,
}: {
  id: string
  title: string
  icon: "play" | "star"
}) {
  const Icon = icon === "play" ? Sparkles : Star
  return (
    <div
      data-field-obstacle
      className="mb-5 flex items-end gap-3 px-1"
    >
      <div>
        <h2 id={id} className="flex items-center gap-2 text-2xl font-black text-[var(--site-ink)]">
          <Icon className="h-5 w-5 text-[var(--site-accent)]" aria-hidden="true" />
          {title}
        </h2>
      </div>
    </div>
  )
}

function AnimeGrid({
  items,
  showRating = false,
  immediateCount = 0,
  nearViewportMarginPx,
}: {
  items: AnimeItem[]
  showRating?: boolean
  immediateCount?: number
  nearViewportMarginPx: number
}) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 sm:gap-x-3 sm:gap-y-6 lg:grid-cols-6 lg:gap-x-4 lg:gap-y-8">
      {items.map((anime, index) => {
        const title = getAnimeTitle(anime)
        return (
          <a
            data-field-obstacle
            key={anime.id}
            href={`https://bgm.tv/subject/${anime.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group min-w-0"
          >
            <span className="relative block aspect-[3/4] overflow-hidden rounded-xl border border-white/55 bg-slate-200/70 shadow-md transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[0.35deg] group-hover:shadow-xl sm:rounded-2xl">
              <AnimeCoverImage
                src={anime.cover}
                alt={`${title}封面`}
                immediate={index < immediateCount}
                nearViewportMarginPx={nearViewportMarginPx}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/20 opacity-70 transition-opacity group-hover:opacity-40" />
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 sm:rounded-2xl" />
              {showRating && (
                <span
                  className={
                    "absolute right-1.5 top-1.5 rounded-full border px-1.5 py-0.5 text-[8px] font-black shadow-sm sm:right-2 sm:top-2 sm:text-[9px] md:text-xs " +
                    (anime.score === undefined
                      ? "border-white/40 bg-slate-900/55 text-white md:bg-[var(--site-ink)]"
                      : "border-rose-200/70 bg-rose-700/95 text-white")
                  }
                >
                  {anime.score === undefined ? "未评" : `${anime.score} 分`}
                </span>
              )}
            </span>
            <span
              title={title}
              className="mt-2 block line-clamp-2 text-center text-[10px] font-black leading-4 text-slate-800 transition-colors group-hover:text-blue-600 sm:mt-2.5 sm:text-xs sm:leading-5 md:line-clamp-3 md:rounded-md md:bg-[var(--site-surface)] md:px-2 md:py-2 md:text-sm md:font-semibold md:leading-6"
            >
              {title}
            </span>
          </a>
        )
      })}
    </div>
  )
}

function EmptyShelf({ message }: { message: string }) {
  return (
    <div
      data-field-obstacle
      className="rounded-[1.75rem] border border-dashed border-[var(--site-line)] bg-[var(--site-surface)] px-6 py-14 text-center shadow-lg"
    >
      <Clapperboard className="mx-auto h-8 w-8 text-blue-400" aria-hidden="true" />
      <p className="mt-4 text-sm font-black text-slate-700">{message}</p>
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
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-28 bg-gradient-to-b from-transparent to-white/20" />
      <button
        data-field-obstacle
        type="button"
        onClick={onLoadMore}
        className="relative inline-flex items-center gap-2 rounded-full border border-[var(--site-line)] bg-[var(--site-surface)] px-5 py-3 text-xs font-black text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600"
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
  description?: string
  action?: () => void
}) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6 lg:px-10">
      <div
        data-field-obstacle
        className="mt-8 rounded-[1.75rem] border border-[var(--site-line)] bg-[var(--site-surface)] px-6 py-16 text-center shadow-xl"
      >
        <Clapperboard className="mx-auto h-9 w-9 text-blue-400" aria-hidden="true" />
        <h1 className="mt-5 text-xl font-black text-slate-950">{title}</h1>
        {description && (
          <p className="mt-2 text-sm font-medium text-[var(--site-muted)]">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={action}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--site-line)] bg-[var(--site-recess)] px-4 py-2.5 text-xs font-black text-slate-700 shadow-md transition hover:text-blue-600"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            重试
          </button>
        )}
      </div>
    </main>
  )
}
