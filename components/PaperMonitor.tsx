"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowUpRight, ChevronDown, X } from "lucide-react"
import type { PaperReport } from "../lib/papers"
import styles from "./PaperMonitor.module.css"

export default function PaperMonitor({
  initialReports,
  compact = false,
  active = true,
}: {
  initialReports: PaperReport[]
  compact?: boolean
  active?: boolean
}) {
  const [reports, setReports] = useState(initialReports)
  const [date, setDate] = useState(initialReports[0]?.date ?? "")
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState("")
  const [issueOpen, setIssueOpen] = useState(false)
  const issueDialog = useRef<HTMLDialogElement>(null)
  const paperDialog = useRef<HTMLDialogElement>(null)
  const pendingReports = useRef<PaperReport[] | null>(null)
  const latestReport = reports[0]
  const report = reports.find((item) => item.date === date) ?? reports[0]
  const paper = selected === null ? null : report?.papers[selected]

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/papers", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Report fetch failed")
        const data = (await response.json()) as { reports: PaperReport[] }
        if (!data.reports?.length) throw new Error("Empty reports")
        if (issueDialog.current?.open) {
          pendingReports.current = data.reports
        } else {
          setReports(data.reports)
          setDate(data.reports[0].date)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("暂时无法检查更新，正在展示已保存的周报。")
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const dialog = issueDialog.current
    if (!issueOpen) {
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
  }, [issueOpen])

  useEffect(() => {
    if (selected !== null && !paperDialog.current?.open) paperDialog.current?.showModal()
    if (selected === null) paperDialog.current?.close()
  }, [selected])

  function closeIssue() {
    setIssueOpen(false)
    setSelected(null)
    if (pendingReports.current) {
      setReports(pendingReports.current)
      setDate(pendingReports.current[0].date)
      pendingReports.current = null
    }
  }

  return (
    <section
      className={`${styles.panel} ${compact ? styles.compact : "lg:col-span-8"}`}
      aria-label="TDA 论文周报"
      data-field-obstacle
    >
      <button
        type="button"
        className={compact ? styles.summary : styles.cover}
        data-paper-summary={compact ? "" : undefined}
        inert={compact && !active}
        tabIndex={compact && !active ? -1 : undefined}
        aria-label="打开 TDA 论文周报"
        aria-haspopup="dialog"
        aria-controls="tda-issue-dialog"
        onClick={() => setIssueOpen(true)}
      >
        {compact ? (
          <span className={styles.summaryArt}>
            <Image
              src="/profile-studio.png"
              alt="TDA 论文周报封面"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 220px, 264px"
            />
          </span>
        ) : (
          <>
            <Image
              src="/profile-studio.png"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1023px) calc(100vw - 2rem), 704px"
            />
            <span className={styles.shade} />
          </>
        )}
        <span className={styles.heading}>
          <span className={styles.eyebrow}>PAPER NOTES / WEEKLY</span>
          <strong className={styles.title}>TDA 论文周报</strong>
          {!compact && <span className={styles.subtitle}>在新的论文里，寻找下一个问题。</span>}
          <span className={styles.coverMeta}>
            <span>
              {latestReport ? (
                <>
                  <time dateTime={latestReport.date}>{latestReport.date.replaceAll("-", ".")}</time>
                  {" / "}
                  <span aria-label={`${latestReport.papers.length} 篇选读`}>
                    {String(latestReport.papers.length).padStart(2, "0")} PAPERS
                  </span>
                </>
              ) : (
                "周报待发布"
              )}
            </span>
            <span className={styles.openHint}>
              阅读本期 <ArrowUpRight size={16} aria-hidden />
            </span>
          </span>
        </span>
      </button>

      <dialog
        ref={issueDialog}
        id="tda-issue-dialog"
        className={styles.dialog}
        aria-labelledby="tda-issue-title"
        onClose={closeIssue}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeIssue()
        }}
      >
        <div className={styles.window}>
          <header className={styles.windowHeader}>
            <div>
              <p className={styles.windowEyebrow}>PAPER NOTES / WEEKLY</p>
              <h2 id="tda-issue-title">TDA 论文周报</h2>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="关闭周报"
              onClick={closeIssue}
              autoFocus
            >
              <X size={20} aria-hidden />
            </button>
          </header>
          <div className={styles.reading}>
            <div className={styles.issue}>
              <div className={styles.issueSummary}>
                {report && (
                  <time dateTime={report.date} className={styles.issueDate}>
                    {report.date.replaceAll("-", ".")}
                  </time>
                )}
                <span>本期 {report?.papers.length ?? 0} 篇选读</span>
              </div>
              <label>
                <span>选择期数</span>
                <select
                  aria-label="选择周报日期"
                  value={report?.date ?? ""}
                  onChange={(event) => {
                    setDate(event.target.value)
                    setSelected(null)
                  }}
                >
                  {reports.map((item) => (
                    <option value={item.date} key={item.date}>
                      {item.date} 周报
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={styles.listLabel}>
              <span>CONTENTS / 本期论文</span>
              <span>点选一篇，展开阅读</span>
            </div>
            <ol className={styles.papers}>
              {report?.papers.map((item, index) => (
                <li key={`${report.date}-${index}`}>
                  <button
                    type="button"
                    className={styles.paper}
                    aria-haspopup="dialog"
                    aria-controls="tda-paper-dialog"
                    onClick={() => setSelected(index)}
                  >
                    <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.paperInfo}>
                      <span className={styles.paperName}>{item.title}</span>
                      {item.priority && (
                        <span className={styles.priority}>阅读优先级 · {item.priority}</span>
                      )}
                    </span>
                    <ArrowUpRight size={18} aria-hidden className={styles.chevron} />
                  </button>
                </li>
              ))}
            </ol>
            {report && (report.introduction || report.conclusion) && (
              <details className={styles.overview} key={report.date}>
                <summary>
                  本期导读与综合判断 <ChevronDown size={14} aria-hidden />
                </summary>
                <div className={styles.overviewBody}>
                  {report.introduction && (
                    <div
                      className={styles.prose}
                      dangerouslySetInnerHTML={{ __html: report.introduction }}
                    />
                  )}
                  {report.conclusion && (
                    <div
                      className={styles.prose}
                      dangerouslySetInnerHTML={{ __html: report.conclusion }}
                    />
                  )}
                </div>
              </details>
            )}
            <p className={styles.footer} role="status">
              {status || "每周追踪拓扑数据分析 · 中文摘要与独立学术评价"}
            </p>
          </div>
        </div>
      </dialog>

      <dialog
        ref={paperDialog}
        id="tda-paper-dialog"
        className={`${styles.dialog} ${styles.paperDialog}`}
        aria-labelledby="tda-paper-title"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null)
        }}
      >
        {paper && (
          <div className={styles.window}>
            <header className={styles.windowHeader}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => setSelected(null)}
                autoFocus
              >
                <ArrowLeft size={16} aria-hidden /> 返回本期论文
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="关闭论文"
                onClick={() => setSelected(null)}
              >
                <X size={20} aria-hidden />
              </button>
            </header>
            <article className={styles.reading} aria-label={paper.title}>
              <div className={styles.articleContent}>
                <p className={styles.articleBar}>
                  <span>{report?.date.replaceAll("-", ".")}</span>
                  <span>{paper.priority ? `阅读优先级 · ${paper.priority}` : "论文选读"}</span>
                </p>
                <h2 id="tda-paper-title" className={styles.paperTitle}>
                  {paper.title}
                </h2>
                <div className={styles.prose} dangerouslySetInnerHTML={{ __html: paper.html }} />
                {paper.url && (
                  <a className={styles.source} href={paper.url} target="_blank" rel="noreferrer">
                    阅读原文 <ArrowUpRight size={14} aria-hidden />
                  </a>
                )}
              </div>
            </article>
          </div>
        )}
      </dialog>
    </section>
  )
}
