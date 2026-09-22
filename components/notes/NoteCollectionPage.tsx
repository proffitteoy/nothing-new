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
  description: string
  notes: NoteArtifact[]
  folderRoute?: string
}) {
  const sectionTitle = section === "blog" ? "笔记" : "杂谈"

  return (
    <div className="relative min-h-screen pb-20">
      <PageTransition>
        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-10">
          <header className="relative overflow-hidden rounded-[2rem] border border-white/55 bg-white/50 p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 md:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl"
            />
            <div className="relative">
              <p className="text-[10px] font-black tracking-[0.28em] text-sky-700 dark:text-sky-300">
                {section === "blog" ? "KNOWLEDGE NOTES" : "FIELD NOTES"}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white md:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                {description}
              </p>
              {folderRoute && (
                <Link
                  href={`/${section}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-xs font-black text-sky-700 hover:bg-sky-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-300"
                >
                  <FolderOpen className="h-4 w-4" aria-hidden="true" />
                  返回{sectionTitle}根目录
                </Link>
              )}
            </div>
          </header>

          <div className="mt-8 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-black tracking-[0.24em] text-slate-400">
                {notes.length.toString().padStart(2, "0")} NOTES
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
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
                      className="group flex h-full min-h-56 flex-col rounded-[1.75rem] border border-white/55 bg-white/50 p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transform-none dark:border-white/10 dark:bg-slate-900/50 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <BookOpenText
                          className="h-5 w-5 text-sky-600 dark:text-sky-300"
                          aria-hidden="true"
                        />
                        {displayDate && (
                          <time className="text-[10px] font-bold text-slate-400">
                            {displayDate}
                          </time>
                        )}
                      </div>
                      <h3 className="mt-6 break-words text-xl font-black leading-snug tracking-tight text-slate-950 dark:text-white">
                        {note.title}
                      </h3>
                      {note.description && (
                        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                          {note.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                        <ul className="flex flex-wrap gap-1.5" aria-label={`${note.title} 标签`}>
                          {note.tags.slice(0, 3).map((tag) => (
                            <li
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-950/5 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400"
                            >
                              <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                              {tag}
                            </li>
                          ))}
                        </ul>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sky-500"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300/80 bg-white/35 p-10 text-center text-sm font-medium text-slate-500 backdrop-blur dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-400">
              这个文件夹暂时没有公开笔记。
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  )
}
