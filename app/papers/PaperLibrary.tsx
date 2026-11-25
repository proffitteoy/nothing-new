"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUpRight, BookOpen, Check, Search, X } from "lucide-react"
import {
  buildPaperLibrary,
  type LibraryPaper,
  type PublicPaperNote,
  type ZoteroPaper,
} from "@/lib/paper-library"
import type { PaperReport } from "@/lib/papers"
import reading from "@/components/PaperMonitor.module.css"
import styles from "./PaperLibrary.module.css"
import PaperFolderGraph from "./PaperFolderGraph"

function Badges({ paper }: { paper: LibraryPaper }) {
  return (
    <span className={styles.badges}>
      {paper.readingStatus === "read" && (
        <span className={styles.read}>
          <Check size={12} aria-hidden /> 已读
        </span>
      )}
      {paper.readingStatus === "reading" && <span className={styles.read}>阅读中</span>}
      {!!paper.notes.length && (
        <span className={styles.noted}>
          <BookOpen size={12} aria-hidden /> 有笔记
        </span>
      )}
      {!!paper.reports.length && <span>周报收录</span>}
    </span>
  )
}

export default function PaperLibrary({
  papers,
  collections,
  initialReports,
  notes,
  noteLinks,
}: {
  papers: ZoteroPaper[]
  collections: ZoteroPaper["collections"]
  initialReports: PaperReport[]
  notes: PublicPaperNote[]
  noteLinks: Record<string, string[]>
}) {
  const [reports, setReports] = useState<PaperReport[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("正在加载最新周报…")
  const [tab, setTab] = useState("weekly")
  const [query, setQuery] = useState("")
  const [date, setDate] = useState("")
  const [limit, setLimit] = useState(30)
  // Freeze the preview and its report versions until it closes, even during a refresh.
  const [selected, setSelected] = useState<{
    paper: LibraryPaper
    reports: PaperReport[]
    date: string
  } | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const chosenDate = useRef(false)
  const library = useMemo(
    () => buildPaperLibrary(papers, reports, notes, noteLinks),
    [papers, reports, notes, noteLinks],
  )
  const readPapers = useMemo(
    () => library.filter((paper) => paper.readingStatus === "read"),
    [library],
  )
  const issue = reports.find((report) => report.date === date) ?? reports[0]
  const search = query.trim().toLocaleLowerCase()
  const filtered = library.filter(
    (paper) =>
      (tab !== "weekly" || paper.reports.some((report) => report.date === issue?.date)) &&
      (!search ||
        [
          paper.title,
          ...paper.authors,
          paper.year,
          paper.doi,
          paper.arxiv,
          ...paper.collections.map((item) => item.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(search)),
  )
  if (tab === "weekly")
    filtered.sort(
      (a, b) =>
        (a.reports.find((entry) => entry.date === issue?.date)?.index ?? 0) -
        (b.reports.find((entry) => entry.date === issue?.date)?.index ?? 0),
    )

  useEffect(() => {
    const controller = new AbortController()
    const load = async (url: string) => {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal })
      if (!response.ok) throw new Error("Reports unavailable")
      const data = (await response.json()) as { reports: PaperReport[] }
      controller.signal.throwIfAborted()
      if (!data.reports?.length) throw new Error("No reports")
      setReports(data.reports)
      setDate((current) =>
        chosenDate.current && data.reports.some((report) => report.date === current)
          ? current
          : data.reports[0].date,
      )
    }
    void (async () => {
      try {
        await load("/api/papers?latest=1")
        setLoading(false)
        setStatus("")
      } catch {
        if (!controller.signal.aborted) {
          setReports(initialReports)
          setDate(initialReports[0]?.date ?? "")
          setLoading(false)
          setStatus("周报更新暂不可用，正在展示已保存的内容。")
        }
        return
      }
      try {
        await load("/api/papers")
      } catch {
        if (!controller.signal.aborted) setStatus("往期周报暂不可用，正在展示最新一期。")
      }
    })()
    return () => controller.abort()
  }, [initialReports])

  useEffect(() => {
    if (!selected) return
    const element = dialog.current
    element?.showModal()
    element?.querySelectorAll<HTMLAnchorElement>('a[href]:not([href^="#"])').forEach((link) => {
      link.target = "_blank"
      link.rel = "noopener noreferrer"
    })
    const roots = [document.body, document.getElementById("app-scroll-root")].filter(
      (item): item is HTMLElement => !!item,
    )
    const overflow = roots.map((item) => item.style.overflowY)
    roots.forEach((item) => {
      item.style.overflowY = "hidden"
    })
    return () => {
      element?.close()
      roots.forEach((item, index) => {
        item.style.overflowY = overflow[index]
      })
      trigger.current?.focus({ preventScroll: true })
    }
  }, [selected])

  function changeTab(value: string) {
    setTab(value)
    setLimit(30)
  }
  const close = () => dialog.current?.close()
  function openPaper(paper: LibraryPaper, target: HTMLElement) {
    trigger.current = target
    if (tab === "weekly") chosenDate.current = true
    setSelected({
      paper,
      reports,
      date: (tab === "weekly" ? issue?.date : paper.reports[0]?.date) ?? "",
    })
  }

  return (
    <main className={`${reading.panel} ${styles.page}`}>
      <h1 className="sr-only">论文</h1>
      <section className={styles.catalogue} aria-label="论文目录" data-field-obstacle>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="group" aria-label="论文视图">
            {[
              ["weekly", "TDA 周报"],
              ["read", "读过的论文"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={tab === value}
                onClick={() => changeTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className={styles.search}>
            <Search size={16} aria-hidden />
            <input
              type="search"
              aria-label="搜索论文"
              placeholder="题目、作者、DOI 或 arXiv"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setLimit(30)
              }}
            />
          </label>
        </div>
        {status && (
          <p className={styles.status} role="status">
            {status}
          </p>
        )}
        {tab === "read" ? (
          <PaperFolderGraph
            papers={readPapers}
            collections={collections}
            query={query}
            onOpen={openPaper}
          />
        ) : (
          <div className={styles.weeklyWorkspace}>
            {tab === "weekly" && (
              <nav className={styles.issues} aria-label="周报期数">
                {reports.map((report) => (
                  <button
                    type="button"
                    key={report.date}
                    aria-pressed={issue?.date === report.date}
                    onClick={() => {
                      chosenDate.current = true
                      setDate(report.date)
                      setLimit(30)
                    }}
                  >
                    <time dateTime={report.date}>{report.date}</time>
                    <small>{report.papers.length} 篇</small>
                  </button>
                ))}
              </nav>
            )}
            <div className={styles.paperListScroll}>
              {tab === "weekly" && issue && (
                <section className={styles.issue} aria-label="本期周报">
                  <div className={styles.issueHeading}>
                    <h2>TDA 每周新论文报告</h2>
                    <span>
                      {issue.date} · {issue.papers.length} 篇选读
                    </span>
                  </div>
                  {(issue.introduction || issue.conclusion) && (
                    <details
                      className={`${reading.overview} ${styles.reportOverview}`}
                      key={issue.date}
                    >
                      <summary>本期导读与综合判断</summary>
                      <div className={reading.overviewBody}>
                        {issue.introduction && (
                          <div
                            className={reading.prose}
                            dangerouslySetInnerHTML={{ __html: issue.introduction }}
                          />
                        )}
                        {issue.conclusion && (
                          <div
                            className={reading.prose}
                            dangerouslySetInnerHTML={{ __html: issue.conclusion }}
                          />
                        )}
                      </div>
                    </details>
                  )}
                </section>
              )}
              <ol className={styles.list}>
                {filtered.slice(0, limit).map((paper, index) => (
                  <li key={paper.id}>
                    <button
                      type="button"
                      className={styles.entry}
                      aria-haspopup="dialog"
                      aria-controls="paper-library-preview"
                      onClick={(event) => openPaper(paper, event.currentTarget)}
                    >
                      <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                      <span className={styles.entryBody}>
                        <span className={styles.paperTitle}>{paper.title}</span>
                        {(paper.authors.length > 0 || paper.year) && (
                          <span className={styles.byline}>
                            {[paper.authors.join(" · "), paper.year].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        <Badges paper={paper} />
                      </span>
                      <ArrowUpRight size={17} aria-hidden className={styles.arrow} />
                    </button>
                  </li>
                ))}
              </ol>
              {!filtered.length && !loading && (
                <div className={styles.empty}>
                  <BookOpen size={25} aria-hidden />
                  <h2>没有找到论文</h2>
                  <p>试试其他搜索词。</p>
                </div>
              )}
              {filtered.length > limit && (
                <button
                  type="button"
                  className={styles.more}
                  onClick={() => setLimit((current) => current + 30)}
                >
                  再看 30 篇
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <dialog
        ref={dialog}
        id="paper-library-preview"
        className={`${reading.dialog} ${reading.paperDialog} ${styles.preview}`}
        aria-labelledby="library-paper-title"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
      >
        {selected && (
          <div className={reading.window}>
            <header className={reading.windowHeader}>
              <span>论文预览</span>
              <button
                type="button"
                className={reading.iconButton}
                aria-label="关闭论文预览"
                onClick={close}
                autoFocus
              >
                <X size={20} aria-hidden />
              </button>
            </header>
            <article className={reading.reading}>
              <div className={reading.articleContent}>
                <h2
                  id="library-paper-title"
                  className={`${reading.paperTitle} ${styles.previewTitle}`}
                >
                  {selected.paper.title}
                </h2>
                <p className={styles.byline}>
                  {[selected.paper.authors.join(" · "), selected.paper.year]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <Badges paper={selected.paper} />
                <dl className={styles.identifiers}>
                  {selected.paper.doi && (
                    <>
                      <dt>DOI</dt>
                      <dd>{selected.paper.doi}</dd>
                    </>
                  )}
                  {selected.paper.arxiv && (
                    <>
                      <dt>arXiv</dt>
                      <dd>{selected.paper.arxiv}</dd>
                    </>
                  )}
                  {!!selected.paper.collections.length && (
                    <>
                      <dt>分类</dt>
                      <dd>{selected.paper.collections.map((item) => item.name).join(" / ")}</dd>
                    </>
                  )}
                </dl>
                {selected.paper.url && (
                  <a
                    className={reading.source}
                    href={selected.paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    阅读原文 <ArrowUpRight size={14} aria-hidden />
                  </a>
                )}
                {selected.paper.abstract && (
                  <section className={styles.previewSection}>
                    <h3>摘要</h3>
                    {selected.paper.abstractHtml ? (
                      <div
                        className={reading.prose}
                        dangerouslySetInnerHTML={{ __html: selected.paper.abstractHtml }}
                      />
                    ) : (
                      <p className={reading.prose}>{selected.paper.abstract}</p>
                    )}
                  </section>
                )}
                {selected.paper.notes.length > 0 && (
                  <section className={styles.previewSection}>
                    <h3>个人阅读笔记</h3>
                    {selected.paper.notes.map((note) => (
                      <div key={note.route} className={styles.note}>
                        <Link
                          href={encodeURI(note.route)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {note.title}
                          <ArrowUpRight size={14} aria-hidden />
                        </Link>
                        {(note.dates.modified || note.dates.created) && (
                          <time dateTime={note.dates.modified ?? note.dates.created}>
                            {(note.dates.modified ?? note.dates.created)?.slice(0, 10)}
                          </time>
                        )}
                        {note.html ? (
                          <div
                            className={`${reading.prose} ${styles.noteBody}`}
                            dangerouslySetInnerHTML={{ __html: note.html }}
                          />
                        ) : note.description ? (
                          <p>{note.description}</p>
                        ) : null}
                      </div>
                    ))}
                  </section>
                )}
                {selected.paper.reports.length > 0 && (
                  <section className={styles.previewSection}>
                    <h3>周报收录</h3>
                    {selected.paper.reports.map((entry) => {
                      const paper = selected.reports.find((report) => report.date === entry.date)
                        ?.papers[entry.index]
                      return paper ? (
                        <details
                          className={reading.overview}
                          key={`${entry.date}-${entry.index}`}
                          open={entry.date === selected.date}
                        >
                          <summary>
                            {entry.date} {paper.priority && ` · 阅读优先级 ${paper.priority}`}
                          </summary>
                          <div className={reading.overviewBody}>
                            <div
                              className={reading.prose}
                              dangerouslySetInnerHTML={{ __html: paper.html }}
                            />
                          </div>
                        </details>
                      ) : null
                    })}
                  </section>
                )}
              </div>
            </article>
          </div>
        )}
      </dialog>
    </main>
  )
}
