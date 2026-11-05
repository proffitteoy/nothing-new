"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react"
import { ArrowUpRight, FolderOpen, Search, X } from "lucide-react"
import {
  useImageLoadingPolicy,
  useNearViewport,
  type ImageLoadingPolicy,
} from "@/lib/image-loading"
import type { ChatterItem } from "@/lib/notes/chatter"
import styles from "./ChatterBoard.module.css"

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

function subscribeColumns(onChange: () => void) {
  const query = window.matchMedia("(min-width: 1024px)")
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export default function ChatterBoard({ items }: { items: ChatterItem[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const loadingPolicy = useImageLoadingPolicy("chatter")
  const columnCount = useSyncExternalStore(
    subscribeColumns,
    () => (window.matchMedia("(min-width: 1024px)").matches ? 3 : 2),
    () => 2,
  )

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("zh-CN")
    let imageIndex = 0
    return items
      .filter((item) => !query || item.title.toLocaleLowerCase("zh-CN").includes(query))
      .map((item) => ({ item, imageIndex: item.kind === "note" ? imageIndex++ : -1 }))
  }, [items, searchQuery])

  return (
    <main className={styles.board} aria-labelledby="chatter-title">
      <header data-field-obstacle className={styles.masthead}>
        <div>
          <p className={styles.eyebrow}>FIELD NOTES</p>
          <div className={styles.headingRow}>
            <h1 id="chatter-title" className={styles.title}>
              杂谈
            </h1>
            <p className={styles.subtitle}>
              零散想法
              <br />
              与项目记录
            </p>
          </div>
        </div>
        <div className={styles.search} role="search" aria-label="杂谈搜索">
          <Search size={17} aria-hidden="true" />
          <label className="sr-only" htmlFor="chatter-search">
            搜索杂谈
          </label>
          <input
            id="chatter-search"
            type="search"
            placeholder="搜寻被遗忘的思绪……"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button type="button" aria-label="清空搜索" onClick={() => setSearchQuery("")}>
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <div data-field-obstacle className={styles.toolbar}>
        <p className={styles.resultCount} role="status" aria-live="polite" aria-atomic="true">
          {searchQuery.trim() ? "搜索结果" : "全部记录"}
          <span>{filteredItems.length}</span>
        </p>
        <p className={styles.sortLabel}>按最后修改时间排列</p>
      </div>

      {filteredItems.length > 0 ? (
        <div className={styles.columns}>
          {Array.from({ length: columnCount }, (_, column) => (
            <div key={column} className={styles.column}>
              {filteredItems
                .slice(
                  column * Math.ceil(filteredItems.length / columnCount),
                  (column + 1) * Math.ceil(filteredItems.length / columnCount),
                )
                .map(({ item, imageIndex }) => (
                  <ChatterCard
                    key={item.route}
                    item={item}
                    imageIndex={imageIndex}
                    loadingPolicy={loadingPolicy}
                  />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div data-field-obstacle className={styles.empty}>
          <h2>没有找到符合当前搜索的内容。</h2>
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")}>
              清空搜索，查看全部记录 <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </main>
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
  const [imageFailed, setImageFailed] = useState(false)
  const immediate = item.kind === "note" && imageIndex < loadingPolicy.immediateBudget
  const { elementRef, shouldLoad } = useNearViewport<HTMLElement>(
    immediate,
    loadingPolicy.nearViewportMarginPx,
  )
  const lowPriorityImmediate = immediate && imageIndex > 0
  const folder = item.kind === "folder"
  const optimized = folder ? isNextOptimizableFolderCover(item.cover) : isSiteImage(item.cover)
  // Reserve space even for legacy covers; extreme ratios get a gentle editorial crop.
  const ratio = folder
    ? 1.25
    : item.coverDimensions
      ? Math.max(0.75, Math.min(1.5, item.coverDimensions.width / item.coverDimensions.height))
      : 4 / 3

  return (
    <article ref={elementRef} className={styles.article} data-kind={item.kind}>
      <Link
        data-field-obstacle
        href={item.route}
        className={styles.card}
        style={{ "--cover-ratio": ratio } as CSSProperties}
      >
        <div className={styles.cover}>
          {shouldLoad && item.cover && !imageFailed ? (
            optimized ? (
              <Image
                src={item.cover}
                alt=""
                fill
                sizes="(max-width: 639px) calc((100vw - 3.5rem) / 2), (max-width: 1023px) calc((100vw - 5rem) / 2), (max-width: 1311px) calc((100vw - 6rem) / 3), 406px"
                loading={immediate ? "eager" : "lazy"}
                fetchPriority={lowPriorityImmediate ? "low" : undefined}
                decoding="async"
                className={styles.image}
                onError={() => setImageFailed(true)}
              />
            ) : (
              // Unknown third-party and legacy covers keep their URL and referrer policy.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.cover}
                alt=""
                loading={immediate ? "eager" : "lazy"}
                fetchPriority={lowPriorityImmediate ? "low" : undefined}
                decoding="async"
                referrerPolicy={isSiteImage(item.cover) ? undefined : "no-referrer"}
                className={styles.image}
                onError={() => setImageFailed(true)}
              />
            )
          ) : (
            <span className={styles.placeholder} aria-hidden="true">
              {folder ? (
                <FolderOpen size={28} />
              ) : (
                <span className={styles.placeholderMark}>杂</span>
              )}
              <span>{imageFailed || !item.cover ? "封面暂缺 · 内容仍在" : "随笔与项目"}</span>
            </span>
          )}
          {folder && (
            <span className={styles.folderTag}>
              <FolderOpen size={13} aria-hidden="true" /> 项目文件夹
            </span>
          )}
        </div>
        <div className={styles.caption}>
          <div className={styles.meta}>
            <span>{folder ? `${item.noteCount} 篇记录` : "随笔"}</span>
            {item.modified && (
              <time dateTime={item.modified}>
                {item.modified.slice(0, 10).replaceAll("-", ".")}
              </time>
            )}
          </div>
          <h2 className={styles.cardTitle}>{item.title}</h2>
          <ArrowUpRight className={styles.readArrow} size={16} aria-hidden="true" />
        </div>
      </Link>
    </article>
  )
}
