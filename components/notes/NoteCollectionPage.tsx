import Link from "next/link"
import { ArrowRight, BookOpenText, FolderOpen, Hash } from "lucide-react"

import type { NoteArtifact, NoteSection } from "@/lib/notes/types"
import PageTransition from "../PageTransition"

function formatDate(value?: string) {
  if (!value) return null
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export default function NoteCollectionPage({
  section,
  title,
  description,
  notes,
  folderRoute,
}: {
  section: NoteSection
  title: string
  description?: string
  notes: NoteArtifact[]
  folderRoute?: string
}) {
  const sectionTitle = section === "blog" ? "笔记" : "杂谈"

  return (
    <div data-page-palette={section} className="relative min-h-screen pb-20">
      {/* React 19 deduplicates the generated Quartz stylesheet across readers and collections. */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/quartz-assets/note.css" precedence="default" />
      <PageTransition>
        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-10">
          <header className="relative overflow-hidden rounded-[2rem] border border-[var(--site-line)] bg-[var(--page-surface)] p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.55)] backdrop-blur-xl md:bg-[var(--site-surface)] md:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[var(--page-deco)]/20 blur-3xl"
            />
            <div className="relative">
              <h1 className="text-4xl font-black tracking-[-0.05em] text-[var(--page-heading)] md:text-5xl">
                {title}
              </h1>
              {description && (
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[var(--site-muted)] sm:text-base">
                  {description}
                </p>
              )}
              {folderRoute && (
                <Link
                  href={`/${section}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--site-accent)]/10 px-4 py-2 text-xs font-bold text-[var(--site-accent)] hover:bg-[var(--site-accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-accent)] md:text-sm"
                >
                  <FolderOpen className="h-4 w-4" aria-hidden="true" />
                  返回{sectionTitle}根目录
                </Link>
              )}
            </div>
          </header>

          <div className="mt-8 flex items-end justify-between gap-4 px-1 md:w-fit md:rounded-lg md:bg-[var(--site-surface)] md:px-4 md:py-3">
            <div>
              <p className="text-[10px] font-bold text-[var(--site-muted)] md:text-[13px]">
                {notes.length} 篇
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--page-heading)]">
                {folderRoute ? "文件夹内容" : "全部笔记"}
              </h2>
            </div>
          </div>

          {notes.length > 0 ? (
            <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {notes.map((note) => {
                const displayDate = formatDate(note.dates.modified ?? note.dates.created)
                return (
                  <li key={note.route}>
                    <Link
                      href={note.route}
                      className="group flex h-full min-h-56 flex-col rounded-[1.75rem] border border-[var(--site-line)] bg-[var(--page-surface)] p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--site-accent)] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-accent)] motion-reduce:transform-none sm:p-6 md:bg-[var(--site-surface)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <BookOpenText
                          className="h-5 w-5 text-[var(--site-accent)]"
                          aria-hidden="true"
                        />
                        {displayDate && (
                          <time className="text-[10px] font-medium text-[var(--site-muted)] md:text-xs">
                            {displayDate}
                          </time>
                        )}
                      </div>
                      <h3 className="mt-6 break-words text-xl font-black leading-snug tracking-tight text-[var(--page-heading)]">
                        {note.title}
                      </h3>
                      {note.descriptionHtml ? (
                        <div
                          className="note-card-excerpt mt-3 text-sm font-medium leading-6 text-[var(--site-muted)]"
                          dangerouslySetInnerHTML={{ __html: note.descriptionHtml }}
                        />
                      ) : note.description ? (
                        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-[var(--site-muted)]">
                          {note.description}
                        </p>
                      ) : null}
                      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                        <ul className="flex flex-wrap gap-1.5" aria-label={`${note.title} 标签`}>
                          {note.tags.slice(0, 3).map((tag) => (
                            <li
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded-full bg-[var(--page-soft)] px-2.5 py-1 text-[10px] font-medium text-[var(--page-heading)] md:text-xs"
                            >
                              <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                              {tag}
                            </li>
                          ))}
                        </ul>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-[var(--site-muted)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--site-accent)]"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-[var(--page-line)] bg-[var(--page-surface)] p-10 text-center text-sm font-medium text-[var(--page-muted)] backdrop-blur">
              这个文件夹暂时没有公开笔记。
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  )
}
