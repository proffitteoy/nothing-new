"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Music2, BookOpen, X } from "lucide-react"
import { navigationLinks } from "./Navbar"
import CloudPlayer from "./CloudPlayer"
import LyricBar from "./LyricBar"
import PaperMonitor from "./PaperMonitor"
import ProfileActions from "./ProfileActions"
import { ToastProvider } from "./ToastProvider"
import HomeCelestialControl from "./HomeCelestialControl"
import HomeSpectralCanvas from "./HomeSpectralCanvas"
import type { PaperReport } from "../lib/papers"
import styles from "./HomeScene.module.css"

type Side = "music" | "papers"

export default function HomeScene({
  reports,
  blogHref,
}: {
  reports: PaperReport[]
  blogHref: string
}) {
  const [open, setOpen] = useState<Side | null>(null)
  const [contact, setContact] = useState(false)
  const root = useRef<HTMLElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pinned = useRef(false)
  const clear = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }
  const close = (restore = false) => {
    clear()
    if (restore && open)
      root.current?.querySelector<HTMLButtonElement>(`[data-edge-trigger="${open}"]`)?.focus()
    pinned.current = false
    setOpen(null)
  }

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Element
      if (!target.closest("[data-home-edge], dialog, [data-home-contact], [data-home-reading]")) {
        clearTimeout(openTimer.current)
        clearTimeout(closeTimer.current)
        pinned.current = false
        setOpen(null)
        setContact(false)
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
        aria-label="首页人物场景"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !(event.target as Element).closest("dialog")) {
            close(true)
            setContact(false)
          }
        }}
      >
        <h1 className="sr-only">阿の宝藏之地 · Nothing New</h1>
        <HomeSpectralCanvas host={root} side={open} />
        <nav className={styles.nav} aria-label="首页主导航">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href === "/blog" ? blogHref : link.href}
              prefetch={false}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <HomeCelestialControl />
        {(["music", "papers"] as const).map((side) => {
          const expanded = open === side
          const label = side === "music" ? "音乐" : "周报"
          return (
            <aside
              key={side}
              className={`${styles.edge} ${side === "music" ? styles.left : styles.right}`}
              data-home-edge={side}
              data-open={expanded}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return
                clearTimeout(closeTimer.current)
              }}
              onPointerLeave={() => {
                clearTimeout(openTimer.current)
                if (pinned.current) return
                closeTimer.current = setTimeout(() => {
                  if (
                    !document.querySelector("dialog[open]") &&
                    !root.current
                      ?.querySelector(`[data-home-edge="${side}"]`)
                      ?.contains(document.activeElement)
                  )
                    setOpen((current) => (current === side ? null : current))
                }, 500)
              }}
              onBlur={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                if ((event.relatedTarget as Element | null)?.closest("dialog, [data-home-reading]"))
                  return
                closeTimer.current = setTimeout(() => {
                  if (document.querySelector("dialog[open]")) return
                  pinned.current = false
                  setOpen(null)
                }, 500)
              }}
            >
              <button
                type="button"
                className={styles.tab}
                data-edge-trigger={side}
                aria-label={`${expanded ? "收起" : "展开"}${label}`}
                aria-expanded={expanded}
                aria-controls={`home-${side}-panel`}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return
                  clearTimeout(openTimer.current)
                  openTimer.current = setTimeout(() => {
                    pinned.current = false
                    setOpen(side)
                  }, 350)
                }}
                onFocus={() => {
                  clear()
                  setOpen(side)
                }}
                onClick={() => {
                  clear()
                  // Focus may have already opened the panel on pointerdown.
                  if (pinned.current && expanded) close()
                  else {
                    pinned.current = true
                    setOpen(side)
                  }
                }}
              >
                {side === "music" ? (
                  <Music2 size={17} aria-hidden />
                ) : (
                  <BookOpen size={17} aria-hidden />
                )}
                <span>{label}</span>
              </button>
              <div
                id={`home-${side}-panel`}
                className={styles.panel}
                inert={!expanded}
                aria-hidden={!expanded}
              >
                <div className={styles.panelContent}>
                  <div className={styles.panelHeader}>
                    <span>{side === "music" ? "正在聆听" : "每周选读"}</span>
                    <button
                      type="button"
                      aria-label={`关闭${label}侧栏`}
                      onClick={() => close(true)}
                    >
                      <X size={16} aria-hidden />
                    </button>
                  </div>
                  {side === "music" ? <CloudPlayer className={styles.music} /> : null}
                  {side === "music" && <p className={styles.panelNote}>让一首歌，陪你停留。</p>}
                </div>
              </div>
            </aside>
          )
        })}
        {/* Keep dialogs outside inert panels so native focus restoration and the
            two-level report reader survive panel dismissal and stage fracture. */}
        <div
          className={styles.paperSlot}
          data-open={open === "papers"}
          data-home-reading
          onPointerEnter={() => clearTimeout(closeTimer.current)}
          onPointerLeave={() => {
            if (!pinned.current)
              closeTimer.current = setTimeout(() => {
                if (
                  !document.querySelector("dialog[open]") &&
                  !root.current
                    ?.querySelector("[data-home-reading]")
                    ?.contains(document.activeElement)
                )
                  setOpen(null)
              }, 500)
          }}
        >
          <PaperMonitor initialReports={reports} compact active={open === "papers"} />
        </div>
        <div className={styles.contact} data-home-contact>
          <button
            type="button"
            aria-expanded={contact}
            aria-controls="home-contact"
            onClick={() => setContact(!contact)}
          >
            联系
          </button>
          {contact && (
            <div id="home-contact" className={styles.contactPanel}>
              <ProfileActions />
            </div>
          )}
        </div>
        <LyricBar className={styles.lyrics} />
      </main>
    </ToastProvider>
  )
}
