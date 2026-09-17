"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, FolderOpen, Search } from "lucide-react"
import {
  useImageLoadingPolicy,
  type ImageLoadingPolicy,
} from "@/lib/image-loading"
import type { ImageLabConfig } from "@/lib/image-loading-lab"
import type { ChatterItem } from "@/lib/notes/chatter"
import { ImageLoadingLabProvider, useImageLoadingLabImage } from "./ImageLoadingLab"

function isSiteImage(src: string) {
  return src.startsWith("/") && !src.startsWith("//")
}
function isNextOptimizableFolderCover(src: string) {
  if (isSiteImage(src)) return true
  try {
    const url = new URL(src)
    return url.protocol === "https:" && url.hostname === "bu.dusays.com"
  } catch {
    return false
  }
}

export default function ChatterBoard({
  items,
  imageLab,
}: {
  items: ChatterItem[]
  imageLab: ImageLabConfig
}) {
  return (
    <ImageLoadingLabProvider
      key={`${imageLab.enabled}:${imageLab.variant}:${imageLab.runId ?? ""}`}
      config={imageLab}
      listKind="chatter"
    >
      <ChatterBoardContent items={items} />
    </ImageLoadingLabProvider>
  )
}

function ChatterBoardContent({ items }: { items: ChatterItem[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const loadingPolicy = useImageLoadingPolicy("chatter")

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("zh-CN")
    return items.filter((item) => !query || item.title.toLocaleLowerCase("zh-CN").includes(query))
  }, [items, searchQuery])

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl px-3 pb-16 pt-24 sm:px-6 md:pt-28 lg:px-10">
      <header className="mb-8 text-center md:mb-14">
        <p className="text-[10px] font-black tracking-[0.3em] text-indigo-600 dark:text-indigo-300">
          FIELD NOTES
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white md:text-5xl">
          杂谈
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
          零散想法与项目记录按最后修改时间排列，点击后按原始笔记继续展开。
        </p>
      </header>

      <div className="mb-8 flex justify-center md:mb-12">
        <label className="group relative block w-full max-w-lg">
          <span className="sr-only">搜索杂谈</span>
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500 md:left-5 md:h-5 md:w-5"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="搜寻被遗忘的思绪……"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-white/50 bg-white/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-xl backdrop-blur-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-900/50 dark:text-white md:py-4 md:pl-14 md:text-base"
          />
        </label>
      </div>

      {filteredItems.length > 0 ? (
        <motion.div layout className="columns-2 gap-3 md:gap-6 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const imageIndex =
                item.kind === "note"
                  ? filteredItems.slice(0, index).filter((candidate) => candidate.kind === "note")
                      .length
                  : -1
              return (
                <ChatterCard
                  key={item.route}
                  item={item}
                  imageIndex={imageIndex}
                  loadingPolicy={loadingPolicy}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/60 bg-white/35 p-10 text-center text-sm font-medium text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-400">
          没有找到符合当前搜索的内容。
        </div>
      )}
    </div>
  )
}

function ChatterCard({
  item,
  imageIndex,
  loadingPolicy,
}: {
  item: ChatterItem
  imageIndex: number
  loadingPolicy: ImageLoadingPolicy
}) {
  const immediate = item.kind === "note" && imageIndex < loadingPolicy.immediateBudget
  const { elementRef, shouldLoad, onLoad, onError } = useImageLoadingLabImage({
    id: `chatter:${item.route}`,
    immediate,
    nearViewportMarginPx: loadingPolicy.nearViewportMarginPx,
  })
  const lowPriorityImmediate = immediate && imageIndex > 0

  return (
    <motion.article
      ref={elementRef}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="mb-3 break-inside-avoid md:mb-6"
    >
                  {item.kind === "folder" ? (
                    <Link
                      href={item.route}
                      className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/55 bg-slate-900 p-5 text-white shadow-md transition-all duration-500 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transform-none dark:border-white/10 sm:p-6 md:rounded-[2rem]"
                    >
                      {shouldLoad &&
                        (isNextOptimizableFolderCover(item.cover) ? (
                          <Image
                            src={item.cover}
                            alt=""
                            fill
                            sizes="(max-width: 1023px) calc((100vw - 2.25rem) / 2), 390px"
                            loading="lazy"
                            decoding="async"
                            onLoad={onLoad}
                            onError={onError}
                            className="object-cover opacity-60 transition duration-1000 group-hover:scale-105 group-hover:opacity-70"
                          />
                        ) : (
                          // Unknown third-party folder covers intentionally bypass Next optimization.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onLoad={onLoad}
                            onError={onError}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-1000 group-hover:scale-105 group-hover:opacity-70"
                          />
                        ))}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-indigo-950/20" />
                      <div
                        aria-hidden="true"
                        className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl transition-transform duration-700 group-hover:scale-125"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-sky-300/15 blur-3xl"
                      />
                      <div className="relative flex items-center justify-between gap-4">
                        <span className="inline-flex rounded-2xl bg-white/15 p-3 shadow-inner shadow-white/10 backdrop-blur">
                          <FolderOpen className="h-7 w-7" aria-hidden="true" />
                        </span>
                        <span className="text-[10px] font-black tracking-[0.2em] text-white/70">
                          PROJECT FOLDER
                        </span>
                      </div>
                      <div className="relative mt-auto pt-12">
                        <h2 className="break-words text-2xl font-black leading-tight tracking-tight drop-shadow-lg sm:text-3xl">
                          {item.title}
                        </h2>
                        <div className="mt-5 flex items-center justify-between gap-4 text-xs font-bold text-white/75">
                          <span>{item.noteCount} 篇记录</span>
                          <ArrowRight
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={item.route}
                      className="group relative block overflow-hidden rounded-2xl border border-white/55 bg-slate-800 shadow-md transition-all duration-500 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transform-none dark:border-white/10 md:rounded-[2rem]"
                    >
                      {item.coverDimensions ? (
                        <span
                          className="relative block w-full bg-slate-800"
                          style={{
                            aspectRatio: `${item.coverDimensions.width} / ${item.coverDimensions.height}`,
                          }}
                        >
                          {shouldLoad &&
                            (isSiteImage(item.cover) ? (
                              <Image
                                src={item.cover}
                                alt=""
                                fill
                                sizes="(max-width: 1023px) calc((100vw - 2.25rem) / 2), 390px"
                                loading={immediate ? "eager" : "lazy"}
                                fetchPriority={lowPriorityImmediate ? "low" : undefined}
                                decoding="async"
                                onLoad={onLoad}
                                onError={onError}
                                className="object-cover opacity-90 transition duration-1000 group-hover:scale-105 group-hover:opacity-100 dark:opacity-80"
                              />
                            ) : (
                              // External images intentionally keep their original URL and referrer policy.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.cover}
                                alt=""
                                width={item.coverDimensions.width}
                                height={item.coverDimensions.height}
                                loading={immediate ? "eager" : "lazy"}
                                fetchPriority={lowPriorityImmediate ? "low" : undefined}
                                decoding="async"
                                onLoad={onLoad}
                                onError={onError}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-1000 group-hover:scale-105 group-hover:opacity-100 dark:opacity-80"
                              />
                            ))}
                        </span>
                      ) : shouldLoad ? (
                        // External images and legacy artifacts without dimensions intentionally bypass Next optimization.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover}
                          alt=""
                          loading={immediate ? "eager" : "lazy"}
                          fetchPriority={lowPriorityImmediate ? "low" : undefined}
                          decoding="async"
                          onLoad={onLoad}
                          onError={onError}
                          referrerPolicy={isSiteImage(item.cover) ? undefined : "no-referrer"}
                          className="block h-auto w-full opacity-90 transition duration-1000 group-hover:scale-105 group-hover:opacity-100 dark:opacity-80"
                        />
                      ) : (
                        <span className="block aspect-[4/3] w-full bg-slate-800" aria-hidden="true" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                      <h2 className="absolute inset-x-0 bottom-0 line-clamp-2 break-words p-3 text-sm font-black leading-tight text-white drop-shadow-lg transition-colors group-hover:text-indigo-200 sm:p-5 sm:text-lg md:p-6 md:text-xl">
                        {item.title}
                      </h2>
                    </Link>
                  )}
    </motion.article>
  )
}
