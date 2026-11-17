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
  X,
} from "lucide-react"
import { navigationLinks } from "./Navbar"
import CloudPlayer from "./CloudPlayer"
import LyricBar from "./LyricBar"
import PaperMonitor from "./PaperMonitor"
import ProfileActions from "./ProfileActions"
import { ToastProvider } from "./ToastProvider"
import HomeSpectralCanvas from "./HomeSpectralCanvas"
import type { PaperReport } from "../lib/papers"
import styles from "./HomeScene.module.css"

const navigationIcons = [Folder, Clapperboard, MessageCircle, NotebookPen, Link2, UserRound]
const pageEntries = navigationLinks.map((link, index) => ({
  ...link,
  id: link.href.slice(1),
  icon: navigationIcons[index],
}))
const rails = [
  { side: "left", entries: pageEntries.slice(0, 4) },
  {
    side: "right",
    entries: [
      { id: "papers", name: "论文", href: null, icon: BookOpen },
      ...pageEntries.slice(4),
      { id: "contact", name: "联系", href: null, icon: Mail },
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
  const [contactOpen, setContactOpen] = useState(false)
  const contact = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = contact.current
    if (!contactOpen) {
      dialog?.close()
      return
    }
    dialog?.showModal()
    const roots = [document.body, document.getElementById("app-scroll-root")].filter(
      (root): root is HTMLElement => root !== null,
    )
    const previous = roots.map((root) => root.style.overflowY)
    roots.forEach((root) => {
      root.style.overflowY = "hidden"
    })
    return () =>
      roots.forEach((root, index) => {
        root.style.overflowY = previous[index]
      })
  }, [contactOpen])

  return (
    <main
      className={styles.scene}
      data-home-scene
      data-home-quality="static"
      data-home-buffer-bytes="0"
      data-home-effect="none"
      aria-label="Nothing New 山湖观景窗"
    >
      <h1 className="sr-only">阿の宝藏之地 · Nothing New</h1>
      <div className={styles.windowShell} data-home-window>
        <div className={styles.windowViewport} data-home-viewport>
          <HomeSpectralCanvas />
        </div>
      </div>
      {rails.map(({ side, entries }) => (
        <nav
          key={side}
          className={`${styles.rail} ${side === "left" ? styles.left : styles.right}`}
          aria-label={`首页${side === "left" ? "左" : "右"}侧导航`}
          data-home-rail={side}
        >
          {entries.map(({ id, name, href, icon: Icon }) =>
            id === "papers" ? (
              <PaperMonitor
                key={id}
                initialReports={reports}
                compact
                homePanel
                triggerClassName={styles.tab}
              />
            ) : href ? (
              <Link
                key={id}
                href={href === "/blog" ? blogHref : href}
                prefetch={false}
                className={styles.tab}
                data-edge-trigger={id}
                aria-label={`进入${name}`}
              >
                <Icon size={17} aria-hidden />
                <span>{name}</span>
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                className={styles.tab}
                data-edge-trigger={id}
                aria-label={name}
                aria-haspopup="dialog"
                aria-expanded={contactOpen}
                aria-controls="home-contact-panel"
                onClick={() => setContactOpen(true)}
              >
                <Icon size={17} aria-hidden />
                <span>{name}</span>
              </button>
            ),
          )}
        </nav>
      ))}
      <dialog
        ref={contact}
        id="home-contact-panel"
        data-home-panel="contact"
        aria-labelledby="home-contact-title"
        onClose={() => setContactOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setContactOpen(false)
        }}
      >
        <header>
          <h2 id="home-contact-title">联系</h2>
          <button
            type="button"
            aria-label="关闭联系"
            onClick={() => setContactOpen(false)}
            autoFocus
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className={styles.panelBody}>
          <ToastProvider>
            <ProfileActions />
          </ToastProvider>
        </div>
      </dialog>
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
  )
}
