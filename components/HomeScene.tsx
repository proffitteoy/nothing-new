"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  BookOpen,
  Clapperboard,
  Folder,
  Link2,
  Mail,
  MessageCircle,
  NotebookPen,
  UserRound,
} from "lucide-react"
import { navigationLinks } from "./Navbar"
import CloudPlayer from "./CloudPlayer"
import LyricBar from "./LyricBar"
import PaperMonitor, { SidebarPreview } from "./PaperMonitor"
import ProfileActions from "./ProfileActions"
import { ToastProvider } from "./ToastProvider"
import HomeSpectralCanvas from "./HomeSpectralCanvas"
import type { PaperReport } from "../lib/papers"
import styles from "./HomeScene.module.css"
import projectsPreview from "../public/page-previews/projects.webp"
import animePreview from "../public/page-previews/anime.webp"
import chatterPreview from "../public/page-previews/chatter.webp"
import blogPreview from "../public/page-previews/blog.webp"
import friendsPreview from "../public/page-previews/friends.webp"
import aboutPreview from "../public/page-previews/about.webp"

const navigationIcons = [Folder, Clapperboard, MessageCircle, NotebookPen, Link2, UserRound]
// Static imports give regenerated screenshots content-based URLs instead of stale image caches.
const pagePreviews = [
  projectsPreview,
  animePreview,
  chatterPreview,
  blogPreview,
  friendsPreview,
  aboutPreview,
]
const pageEntries = navigationLinks.map((link, index) => ({
  ...link,
  id: link.href.slice(1),
  icon: navigationIcons[index],
  preview: pagePreviews[index],
}))
const rails = [
  { side: "left", entries: pageEntries.slice(0, 4) },
  {
    side: "right",
    entries: [
      { id: "papers", name: "论文", href: null, icon: BookOpen, preview: null },
      ...pageEntries.slice(4),
      { id: "contact", name: "联系", href: null, icon: Mail, preview: null },
    ],
  },
]

export default function HomeScene({
  reports,
  blogHref,
}: {
  reports: PaperReport[]
  blogHref: string
}) {
  const [open, setOpen] = useState<string | null>(null)
  const root = useRef<HTMLElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pinned = useRef(false)
  const keyboardSide = useRef<string | null>(null)
  const clear = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }
  const close = (restore = false) => {
    clear()
    if (restore && open)
      root.current?.querySelector<HTMLButtonElement>(`[data-edge-trigger="${open}"]`)?.focus()
    pinned.current = false
    keyboardSide.current = null
    setOpen(null)
  }
  const scheduleClose = (id: string) => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      if (pinned.current || document.querySelector("dialog[open]")) return
      const hovered = root.current?.querySelector(
        `[data-edge-trigger="${id}"]:hover, [data-home-preview="${id}"] [data-edge-summary]:hover, [data-home-preview="${id}"] [data-paper-summary]:hover`,
      )
      const focused = (document.activeElement as Element | null)?.closest(
        `[data-home-edge="${id}"]`,
      )
      if (!hovered && !(keyboardSide.current === id && focused))
        setOpen((current) => (current === id ? null : current))
    }, 120)
  }

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Element
      if (!target.closest("[data-home-edge], dialog")) {
        clearTimeout(openTimer.current)
        clearTimeout(closeTimer.current)
        pinned.current = false
        setOpen(null)
      }
    }
    document.addEventListener("pointerdown", outside)
    return () => {
      clearTimeout(openTimer.current)
      clearTimeout(closeTimer.current)
      document.removeEventListener("pointerdown", outside)
    }
  }, [])

  return (
    <ToastProvider>
      <main
        ref={root}
        className={styles.scene}
        data-home-scene
        aria-label="Nothing New 山湖观景窗"
        data-home-quality="loading"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !(event.target as Element).closest("dialog")) {
            close(true)
          }
        }}
      >
        <h1 className="sr-only">阿の宝藏之地 · Nothing New</h1>
        <HomeSpectralCanvas />
        {rails.map(({ side, entries }) => (
          <nav
            key={side}
            className={`${styles.rail} ${side === "left" ? styles.left : styles.right}`}
            aria-label={`首页${side === "left" ? "左" : "右"}侧导航`}
            data-home-rail={side}
          >
            {entries.map(({ id, name, href, icon: Icon, preview }) => {
              const expanded = open === id
              return (
                <aside
                  key={id}
                  className={styles.edge}
                  data-home-edge={id}
                  data-open={expanded}
                  onPointerEnter={(event) => {
                    if (
                      event.pointerType !== "mouse" ||
                      (event.target as Element).closest("dialog")
                    )
                      return
                    keyboardSide.current = null
                    clearTimeout(closeTimer.current)
                  }}
                  onPointerLeave={() => scheduleClose(id)}
                  onBlur={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                    if ((event.relatedTarget as Element | null)?.closest("dialog")) return
                    if (!document.querySelector("dialog[open]")) pinned.current = false
                    scheduleClose(id)
                  }}
                >
                  <button
                    type="button"
                    className={styles.tab}
                    data-edge-trigger={id}
                    aria-label={`${expanded ? "收起" : "展开"}${name}`}
                    aria-expanded={expanded}
                    aria-controls={`home-${id}-panel`}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "mouse") return
                      clearTimeout(openTimer.current)
                      openTimer.current = setTimeout(() => {
                        pinned.current = false
                        setOpen(id)
                      }, 350)
                    }}
                    onPointerLeave={() => scheduleClose(id)}
                    onFocus={(event) => {
                      clear()
                      keyboardSide.current = event.currentTarget.matches(":focus-visible")
                        ? id
                        : null
                      setOpen(id)
                    }}
                    onClick={() => {
                      clear()
                      // Pointer focus may already have opened this preview.
                      if (pinned.current && expanded) close()
                      else {
                        pinned.current = true
                        setOpen(id)
                      }
                    }}
                  >
                    <Icon size={17} aria-hidden />
                    <span>{name}</span>
                  </button>
                  <div
                    id={`home-${id}-panel`}
                    className={styles.preview}
                    data-home-preview={id}
                    data-open={expanded}
                    // Keep the native paper dialogs outside inert/aria-hidden trees.
                    inert={id !== "papers" && !expanded}
                    aria-hidden={id !== "papers" && !expanded ? true : undefined}
                    onPointerDownCapture={(event) => {
                      if (
                        (event.target as Element).closest(
                          "[data-edge-summary], [data-paper-summary]",
                        )
                      )
                        keyboardSide.current = null
                    }}
                    onKeyDownCapture={(event) => {
                      if (
                        (event.key === "Enter" || event.key === " ") &&
                        (event.target as Element).closest(
                          "[data-edge-summary], [data-paper-summary]",
                        )
                      )
                        keyboardSide.current = id
                    }}
                  >
                    {href && preview ? (
                      <Link
                        href={href === "/blog" ? blogHref : href}
                        prefetch={false}
                        className={styles.previewLink}
                        data-edge-summary
                        aria-label={`进入${name}`}
                      >
                        <SidebarPreview src={preview} alt={`${name}页面预览`} />
                      </Link>
                    ) : id === "papers" ? (
                      <PaperMonitor
                        initialReports={reports}
                        compact
                        active={expanded}
                        onIssueClose={() => {
                          pinned.current = false
                          scheduleClose("papers")
                        }}
                      />
                    ) : (
                      <div className={styles.contactPanel} data-edge-summary>
                        <ProfileActions />
                      </div>
                    )}
                  </div>
                </aside>
              )
            })}
          </nav>
        ))}
        <div className={styles.windowSill} data-home-sill>
          <div className={styles.musicDock} data-home-music>
            <LyricBar className={styles.lyrics} />
            <CloudPlayer dock className={styles.sillPlayer} />
          </div>
          <a
            className={styles.artCredit}
            href="/home-window/NOTICE-day-study.txt"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="景观来源与许可：TheDailyNathan、Hike395，CC BY-SA 3.0，已改编"
          >
            景观来源
          </a>
        </div>
      </main>
    </ToastProvider>
  )
}
