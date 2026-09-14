"use client"

import { useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { Activity } from "lucide-react"
import Image from "next/image"
import { siteConfig } from "../siteConfig"

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
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700 relative">
      <div className="w-full h-40 sm:h-48 md:h-64 relative bg-slate-200 dark:bg-slate-700 overflow-hidden group">
        <Image
          src={coverImage}
          alt="关于页封面"
          fill
          preload
          sizes="(max-width: 767px) 95vw, 896px"
          quality={75}
          className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      <div className="px-5 sm:px-8 md:px-16 pb-10 md:pb-16 relative">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden -mt-12 md:-mt-16 relative z-20 bg-white">
          <Image
            src={siteConfig.avatarUrl}
            alt="头像"
            fill
            sizes="128px"
            quality={85}
            className="object-cover"
          />
        </div>

        {/* 🌟 核心修复区：手机端排版优雅适配 */}
        <div className="mt-4 md:mt-6 mb-6 md:mb-8 relative flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1 md:mb-3 transition-colors duration-700">
              关于我
            </h1>
            <p className="text-sm md:text-lg text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase transition-colors duration-700">
              你好，我是 {siteConfig.authorName}
            </p>
          </div>

          <div className="px-4 md:px-5 py-2 rounded-xl md:rounded-2xl text-xs md:text-sm font-black bg-indigo-500 text-white shadow-md">
            自我介绍
          </div>
        </div>

        <div className="w-full h-px bg-slate-300/50 dark:bg-slate-700 mb-6 md:mb-8"></div>

        <motion.div
          key="intro"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <style>{`
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  .prose ul, .prose ol { padding-left: 1.2rem !important; font-size: 0.95rem !important; }

                  .prose pre {
                    background-color: #282c34 !important; color: #abb2bf !important;
                    padding: 1rem !important; border-radius: 0.75rem !important;
                    overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1rem !important; margin-bottom: 1rem !important;
                  }
                  
                  .prose pre code, .prose p code, .prose li code { 
                    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, ui-monospace, monospace !important; 
                    font-variant-ligatures: contextual !important; 
                  }
                  .prose pre code { 
                    background-color: transparent !important; 
                    padding: 0 !important; 
                    color: inherit !important; 
                    font-size: 0.85em !important; 
                  }
                  
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.1rem 0.3rem !important; border-radius: 0.25rem !important; font-weight: 600 !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

                  .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #5c6370 !important; font-style: italic !important; }
                  .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #c678dd !important; }
                  .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #e06c75 !important; }
                  .prose pre code .hljs-literal { color: #56b6c2 !important; }
                  .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #98c379 !important; }
                  .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title { color: #e6c07b !important; }
                  .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-type, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #d19a66 !important; }
                  .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title { color: #61aeee !important; }

                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose p { font-size: 1.15rem !important; }
                    .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .prose pre code { font-size: 0.9em !important; }
                  }
                `}</style>
            <div
              className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <section
            className="mt-12 min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-50/55 p-5 shadow-inner dark:border-white/5 dark:bg-slate-950/30 md:mt-16 md:p-8"
            aria-labelledby="activity-heatmap-title"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2
                id="activity-heatmap-title"
                className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-white"
              >
                <Activity className="h-5 w-5 text-green-500" aria-hidden="true" />
                {githubContributions
                  ? `过去一年 ${githubContributions.total.toLocaleString("zh-CN")} 次 GitHub 贡献`
                  : "GitHub 贡献数据暂时不可用"}
              </h2>
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
              >
                GitHub 主页 ↗
              </a>
            </div>

            {githubContributions ? (
              <div className="flex min-w-0 gap-2">
                <div className="flex shrink-0 flex-col" aria-hidden="true">
                  <div className="mb-1 h-4" />
                  <div className="flex flex-col gap-1 text-[10px] text-slate-400">
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
                  className="min-w-0 flex-1 overflow-x-auto pb-4 scroll-smooth"
                >
                  <div className="w-max">
                    <div
                      className="mb-1 flex h-4 gap-1 text-[10px] text-slate-400"
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
              <p className="rounded-2xl border border-dashed border-slate-300/70 px-4 py-8 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                暂时无法从 GitHub 获取公开贡献记录，请稍后再试。
              </p>
            )}

            {githubContributions && (
              <div
                className="mt-2 flex items-center justify-end gap-2 text-[10px] font-bold text-slate-500 md:text-xs"
                aria-hidden="true"
              >
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
        </motion.div>
      </div>
    </div>
  )
}

function getContributionColor(level: 0 | 1 | 2 | 3 | 4) {
  if (level === 0) return "bg-[#ebedf0] dark:bg-[#161b22]"
  if (level === 1) return "bg-[#9be9a8] dark:bg-[#0e4429]"
  if (level === 2) return "bg-[#40c463] dark:bg-[#006d32]"
  if (level === 3) return "bg-[#30a14e] dark:bg-[#26a641]"
  return "bg-[#216e39] dark:bg-[#39d353]"
}
