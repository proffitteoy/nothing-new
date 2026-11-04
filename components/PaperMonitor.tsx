"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowUpRight, BookOpen, ChevronDown, X } from "lucide-react"
import type { PaperReport } from "../lib/papers"
import styles from "./PaperMonitor.module.css"

export default function PaperMonitor({ initialReports }: { initialReports: PaperReport[] }) {
  const [reports, setReports] = useState(initialReports)
  const [date, setDate] = useState(initialReports[0]?.date ?? "")
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState("")
  const report = reports.find((item) => item.date === date) ?? reports[0]
  const paper = selected === null ? null : report?.papers[selected]

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/papers", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Report fetch failed")
        const data = (await response.json()) as { reports: PaperReport[] }
        if (!data.reports?.length) throw new Error("Empty reports")
        setReports(data.reports)
        setDate(data.reports[0].date)
        setSelected(null)
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("暂时无法检查更新，正在展示已保存的周报。")
      })
    return () => controller.abort()
  }, [])

  return (
    <section
      className={`${styles.panel} lg:col-span-8`}
      aria-label="TDA 论文周报"
      data-field-obstacle
    >
      <div className={styles.cover}>
        <Image
          src="/profile-studio.png"
          alt="夕阳下的拓扑研究工作台"
          fill
          className="object-cover"
          sizes="(max-width: 1023px) calc(100vw - 2rem), 704px"
        />
        <div className={styles.shade} />
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Paper Notes · 拓扑文献雷达</p>
          <h2>TDA 论文周报</h2>
          <p className={styles.subtitle}>在新的论文里，寻找下一个问题。</p>
          <div className={styles.issue}>
            <span>
              <BookOpen size={14} aria-hidden /> {report?.papers.length ?? 0} 篇选读
            </span>
            <label>
              <span className="sr-only">选择周报日期</span>
              <select
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
        </div>
      </div>

      <div className={styles.reading}>
        <div className={styles.listLabel}>
          <span>本期论文</span>
          <span>点选一篇，展开阅读</span>
        </div>
        <div className={styles.papers}>
          {report?.papers.map((item, index) => (
            <button
              key={`${report.date}-${index}`}
              type="button"
              className={`${styles.paper} ${selected === index ? styles.active : ""}`}
              aria-expanded={selected === index}
              aria-controls="tda-paper-content"
              onClick={() => setSelected(selected === index ? null : index)}
            >
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.paperName}>{item.title}</span>
              <ChevronDown size={15} aria-hidden className={styles.chevron} />
            </button>
          ))}
        </div>
        {paper && (
          <article id="tda-paper-content" className={styles.article} aria-label={paper.title}>
            <div className={styles.articleBar}>
              <span>{paper.priority ? `阅读优先级 · ${paper.priority}` : "论文选读"}</span>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  document
                    .querySelector<HTMLButtonElement>(
                      `[aria-controls="tda-paper-content"][aria-expanded="true"]`,
                    )
                    ?.focus()
                }}
                aria-label="收起论文"
              >
                <X size={17} aria-hidden />
              </button>
            </div>
            <h3>{paper.title}</h3>
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: paper.html }} />
            {paper.url && (
              <a className={styles.source} href={paper.url} target="_blank" rel="noreferrer">
                阅读原文 <ArrowUpRight size={14} aria-hidden />
              </a>
            )}
          </article>
        )}
        {report && (
          <details className={styles.overview} key={report.date}>
            <summary>
              本期导读与综合判断 <ChevronDown size={14} aria-hidden />
            </summary>
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: report.introduction + report.conclusion }}
            />
          </details>
        )}
        <p className={styles.footer} role="status">
          {status || "每周追踪拓扑数据分析 · 中文摘要与独立学术评价"}
        </p>
      </div>
    </section>
  )
}
