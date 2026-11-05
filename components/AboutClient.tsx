"use client"

import { useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { siteConfig } from "../siteConfig"
import styles from "./AboutClient.module.css"

export type GitHubContributions = {
  total: number
  days: {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
  }[]
}

export default function AboutClient({
  contentHtml,
  coverImage,
  githubContributions,
}: {
  contentHtml: string
  coverImage: string
  githubContributions: GitHubContributions | null
}) {
  const heatmapScrollRef = useRef<HTMLDivElement>(null)
  const weeks = useMemo(() => {
    if (!githubContributions) return []

    const result: GitHubContributions["days"][] = []
    githubContributions.days.forEach((day, index) => {
      if (index % 7 === 0) result.push([])
      result.at(-1)?.push(day)
    })
    return result
  }, [githubContributions])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = heatmapScrollRef.current
      if (element) element.scrollLeft = element.scrollWidth
    })
    return () => cancelAnimationFrame(frame)
  }, [githubContributions])

  return (
    <article data-field-obstacle className={styles.profile} aria-labelledby="about-title">
      <header className={styles.header}>
        <div className={styles.cover}>
          <Image
            src={coverImage}
            alt="关于页封面"
            fill
            preload
            sizes="(max-width: 767px) 100vw, (max-width: 1248px) 60vw, 725px"
            quality={75}
            className={styles.coverImage}
          />
        </div>
        <div className={styles.heading}>
          <h1 id="about-title">关于我</h1>
          <p className={styles.greeting}>你好，我是 {siteConfig.authorName}</p>
        </div>
      </header>

      <div className={styles.entry}>
        <aside className={styles.identity} aria-label="个人档案">
          <div className={styles.avatar}>
            <Image src={siteConfig.avatarUrl} alt="头像" fill sizes="64px" quality={85} />
          </div>
          <span>{siteConfig.authorName}</span>
          <span className={styles.sectionLabel}>自我介绍</span>
        </aside>
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
      <div className={styles.entry}>
        <div className={styles.sectionLabel} aria-hidden="true">
          GitHub
        </div>
        <section className={styles.activity} aria-labelledby="activity-heatmap-title">
          <div className={styles.activityHeading}>
            <h2 id="activity-heatmap-title" className={styles.activityTitle}>
              {githubContributions
                ? `过去一年 ${githubContributions.total.toLocaleString("zh-CN")} 次 GitHub 贡献`
                : "GitHub 贡献数据暂时不可用"}
            </h2>
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              GitHub 主页 ↗
            </a>
          </div>

          {githubContributions ? (
            <div className="flex min-w-0 gap-2">
              <div className="flex shrink-0 flex-col" aria-hidden="true">
                <div className="mb-1 h-4" />
                <div className="flex flex-col gap-1 text-[10px] text-[var(--about-ink)]">
                  <div className="h-[11px] md:h-[13px]" />
                  <div className="flex h-[11px] items-center leading-none md:h-[13px]">Mon</div>
                  <div className="h-[11px] md:h-[13px]" />
                  <div className="flex h-[11px] items-center leading-none md:h-[13px]">Wed</div>
                  <div className="h-[11px] md:h-[13px]" />
                  <div className="flex h-[11px] items-center leading-none md:h-[13px]">Fri</div>
                  <div className="h-[11px] md:h-[13px]" />
                </div>
              </div>

              <div
                ref={heatmapScrollRef}
                tabIndex={0}
                role="region"
                aria-label="可横向滚动的 GitHub 贡献日历"
                className={styles.heatmapScroll}
              >
                <div className="w-max">
                  <div
                    className="mb-1 flex h-4 gap-1 text-[10px] text-[var(--about-ink)]"
                    aria-hidden="true"
                  >
                    {weeks.map((week, index) => {
                      const firstDay = new Date(`${week[0].date}T00:00:00Z`)
                      return (
                        <div key={index} className="relative w-[11px] shrink-0 md:w-[13px]">
                          {firstDay.getUTCDate() <= 7 && (
                            <span className="absolute left-0 whitespace-nowrap">
                              {firstDay.toLocaleString("en-US", {
                                month: "short",
                                timeZone: "UTC",
                              })}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-1" aria-label="过去一年的 GitHub 贡献日历">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day) => {
                          const label = `${day.date}: ${day.count.toLocaleString("zh-CN")} 次 GitHub 贡献`
                          return (
                            <span
                              key={day.date}
                              role="img"
                              title={label}
                              aria-label={label}
                              className={
                                "h-[11px] w-[11px] rounded-[3px] transition hover:ring-2 hover:ring-indigo-500/50 md:h-[13px] md:w-[13px] " +
                                getContributionColor(day.level)
                              }
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300/70 px-4 py-8 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-[var(--about-ink)]">
              暂时无法从 GitHub 获取公开贡献记录，请稍后再试。
            </p>
          )}

          {githubContributions && (
            <div className={styles.legend} aria-hidden="true">
              Less
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={
                    "h-[11px] w-[11px] rounded-[3px] " +
                    getContributionColor(level as 0 | 1 | 2 | 3 | 4)
                  }
                />
              ))}
              More
            </div>
          )}
        </section>
      </div>
    </article>
  )
}

function getContributionColor(level: 0 | 1 | 2 | 3 | 4) {
  if (level === 0) return "bg-[#ebedf0] dark:bg-[#161b22]"
  if (level === 1) return "bg-[#9be9a8] dark:bg-[#0e4429]"
  if (level === 2) return "bg-[#40c463] dark:bg-[#006d32]"
  if (level === 3) return "bg-[#30a14e] dark:bg-[#26a641]"
  return "bg-[#216e39] dark:bg-[#39d353]"
}
