"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search } from "lucide-react"
import { useImageEagerBudget } from "@/lib/image-loading"
import type { ImageDimensions } from "@/lib/notes/types"

type ChatterCard = {
  route: string
  title: string
  cover: string
  coverDimensions?: ImageDimensions
}

function isSiteImage(src: string) {
  return src.startsWith("/") && !src.startsWith("//")
}

export default function ChatterBoard({ chatters }: { chatters: ChatterCard[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const eagerCount = useImageEagerBudget("chatter")

  const filteredChatters = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("zh-CN")
    return chatters.filter(
      (chatter) => !query || chatter.title.toLocaleLowerCase("zh-CN").includes(query),
    )
  }, [chatters, searchQuery])

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
          零散想法、开发记录与日常观察，按原始笔记继续展开。
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

      {filteredChatters.length > 0 ? (
        <motion.div layout className="columns-2 gap-3 md:gap-6 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {filteredChatters.map((chatter, index) => (
              <motion.article
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                key={chatter.route}
                className="mb-3 break-inside-avoid md:mb-6"
              >
                <Link
                  href={chatter.route}
                  className="group relative block overflow-hidden rounded-2xl border border-white/55 bg-slate-800 shadow-md transition-all duration-500 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transform-none dark:border-white/10 md:rounded-[2rem]"
                >
                  {isSiteImage(chatter.cover) && chatter.coverDimensions ? (
                    <Image
                      src={chatter.cover}
                      alt=""
                      width={chatter.coverDimensions.width}
                      height={chatter.coverDimensions.height}
                      sizes="(max-width: 1023px) calc((100vw - 2.25rem) / 2), 390px"
                      loading={index < eagerCount ? "eager" : "lazy"}
                      fetchPriority={index > 0 && index < eagerCount ? "low" : undefined}
                      decoding="async"
                      className="block h-auto w-full opacity-90 transition duration-1000 group-hover:scale-105 group-hover:opacity-100 dark:opacity-80"
                    />
                  ) : (
                    // External images and legacy artifacts without dimensions intentionally bypass Next optimization.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chatter.cover}
                      alt=""
                      width={chatter.coverDimensions?.width}
                      height={chatter.coverDimensions?.height}
                      loading={index < eagerCount ? "eager" : "lazy"}
                      fetchPriority={index > 0 && index < eagerCount ? "low" : undefined}
                      decoding="async"
                      referrerPolicy={isSiteImage(chatter.cover) ? undefined : "no-referrer"}
                      className="block h-auto w-full opacity-90 transition duration-1000 group-hover:scale-105 group-hover:opacity-100 dark:opacity-80"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                  <h2 className="absolute inset-x-0 bottom-0 line-clamp-2 break-words p-3 text-sm font-black leading-tight text-white drop-shadow-lg transition-colors group-hover:text-indigo-200 sm:p-5 sm:text-lg md:p-6 md:text-xl">
                    {chatter.title}
                  </h2>
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/60 bg-white/35 p-10 text-center text-sm font-medium text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-400">
          没有找到符合当前搜索的杂谈。
        </div>
      )}
    </div>
  )
}
