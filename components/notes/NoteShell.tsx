import Link from "next/link"
import { CalendarDays, CornerUpLeft, Hash, Link2 } from "lucide-react"

import { getNoteManifest } from "@/lib/notes/server"
import type { NoteArtifact } from "@/lib/notes/types"
import PageTransition from "../PageTransition"
import NoteExplorer from "./NoteExplorer"

function formatDate(value?: string) {
  if (!value) return null
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export default async function NoteShell({ note }: { note: NoteArtifact }) {
  const sectionTitle = note.section === "blog" ? "笔记" : "杂谈"
  const sectionRoute = `/${note.section}`
  const displayDate = formatDate(note.dates.modified ?? note.dates.created)
  const manifest = await getNoteManifest()

  return (
    <div className="note-native-shell relative isolate min-h-screen overflow-x-clip bg-transparent pb-20 text-[var(--site-ink)] dark:text-[var(--site-ink)]">
      <link rel="stylesheet" href="/quartz-assets/note.css" precedence="default" />
      <PageTransition>
        <main className="mx-auto grid w-full max-w-[94rem] grid-cols-1 gap-5 px-4 pt-24 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)_12rem] lg:px-8 xl:grid-cols-[17rem_minmax(0,1fr)_15rem] xl:gap-6">
          <NoteExplorer
            section={note.section}
            tree={manifest.trees[note.section]}
            currentPath={note.route}
          />

          <section className="min-w-0 max-w-full overflow-hidden">
            <header
              data-field-obstacle
              className="mb-5 rounded-2xl border border-[var(--site-line)] bg-[var(--site-surface)] p-6 shadow-[0_20px_55px_-42px_rgba(23,50,79,0.65)] dark:border-[var(--site-line)] dark:bg-[var(--site-surface)] sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[var(--site-muted)] dark:text-[var(--site-muted)]">
                <Link
                  href={sectionRoute}
                  className="rounded-full bg-[var(--site-accent)]/10 px-3 py-1.5 text-[var(--site-accent)] hover:bg-[var(--site-accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-accent)] dark:bg-[var(--site-accent)]/10 dark:text-[var(--site-accent)] dark:hover:bg-[var(--site-accent)]/15 dark:focus-visible:ring-[var(--site-accent)]"
                >
                  {sectionTitle}
                </Link>
                {displayDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {displayDate}
                  </span>
                )}
              </div>
              <h1 className="mt-5 break-words font-serif text-3xl font-black leading-tight tracking-[-0.035em] text-[var(--site-ink)] dark:text-[var(--site-ink)] sm:text-4xl">
                {note.title}
              </h1>
              {note.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="笔记标签">
                  {note.tags.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-200/70 bg-violet-50/80 px-3 py-1.5 text-[11px] font-bold text-violet-800 dark:border-violet-300/20 dark:bg-violet-400/10 dark:text-violet-200"
                    >
                      <Hash className="h-3 w-3" aria-hidden="true" />
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </header>

            {note.toc.length > 0 && (
              <details
                data-field-obstacle
                className="mb-5 rounded-xl border border-[var(--site-line)] bg-[var(--site-surface)] p-4 text-sm shadow-sm lg:hidden dark:border-[var(--site-line)] dark:bg-[var(--site-surface)]"
              >
                <summary className="cursor-pointer font-black text-[var(--site-ink)] dark:text-[var(--site-ink)]">
                  本页目录
                </summary>
                <ol className="mt-3 space-y-2 pl-4">
                  {note.toc.map((entry) => (
                    <li
                      key={`${entry.slug}-${entry.depth}`}
                      style={{ paddingLeft: entry.depth * 12 }}
                    >
                      <a
                        className="text-[var(--site-muted)] hover:text-[var(--site-accent)] dark:text-[var(--site-muted)] dark:hover:text-[var(--site-accent)]"
                        href={`#${entry.slug}`}
                      >
                        {entry.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <div
              data-field-obstacle
              className="quartz-note page min-h-0 min-w-0 !max-w-full overflow-hidden rounded-2xl border border-[var(--site-line)] !bg-[var(--site-surface)] p-5 shadow-[0_24px_62px_-44px_rgba(23,50,79,0.68)] dark:border-[var(--site-line)] dark:!bg-[var(--site-surface)] sm:p-8 md:p-10"
            >
              <article
                id="main-content"
                className="popover-hint min-w-0 max-w-full overflow-x-hidden [overflow-wrap:anywhere] [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.table-container]:max-w-full [&_.table-container]:overflow-x-auto [&_pre]:max-w-full [&_pre]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: note.html }}
              />
            </div>

            {note.backlinks.length > 0 && (
              <section
                data-field-obstacle
                className="mt-5 rounded-2xl border border-[var(--site-line)] bg-[var(--site-surface)] p-5 lg:hidden dark:border-[var(--site-line)] dark:bg-[var(--site-surface)]"
              >
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--site-ink)] dark:text-[var(--site-ink)]">
                  <CornerUpLeft
                    className="h-4 w-4 text-[var(--site-accent)] dark:text-[var(--site-accent)]"
                    aria-hidden="true"
                  />
                  反向链接
                </h2>
                <ul className="mt-3 space-y-2">
                  {note.backlinks.map((backlink) => (
                    <li key={backlink.route}>
                      <Link
                        className="text-sm text-[var(--site-muted)] hover:text-[var(--site-accent)] dark:text-[var(--site-muted)] dark:hover:text-[var(--site-accent)]"
                        href={backlink.route}
                      >
                        {backlink.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>

          <aside className="hidden lg:block" aria-label="笔记辅助信息">
            <div className="sticky top-24 space-y-4">
              {note.toc.length > 0 && (
                <nav
                  data-field-obstacle
                  className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-surface)] p-5 shadow-[0_14px_38px_-28px_rgba(23,50,79,0.55)] dark:border-[var(--site-line)] dark:bg-[var(--site-surface)]"
                >
                  <h2 className="flex items-center gap-2 text-sm font-black text-[var(--site-ink)] dark:text-[var(--site-ink)]">
                    <Link2
                      className="h-4 w-4 text-[var(--site-accent)] dark:text-[var(--site-accent)]"
                      aria-hidden="true"
                    />
                    本页目录
                  </h2>
                  <ol className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                    {note.toc.map((entry) => (
                      <li
                        key={`${entry.slug}-${entry.depth}`}
                        style={{ paddingLeft: entry.depth * 10 }}
                      >
                        <a
                          className="text-xs leading-5 text-[var(--site-muted)] hover:text-[var(--site-accent)] dark:text-[var(--site-muted)] dark:hover:text-[var(--site-accent)]"
                          href={`#${entry.slug}`}
                        >
                          {entry.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <section
                data-field-obstacle
                className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-surface)] p-5 shadow-[0_14px_38px_-28px_rgba(23,50,79,0.55)] dark:border-[var(--site-line)] dark:bg-[var(--site-surface)]"
              >
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--site-ink)] dark:text-[var(--site-ink)]">
                  <CornerUpLeft
                    className="h-4 w-4 text-[var(--site-accent)] dark:text-[var(--site-accent)]"
                    aria-hidden="true"
                  />
                  反向链接
                </h2>
                {note.backlinks.length > 0 ? (
                  <ul className="mt-4 space-y-2.5">
                    {note.backlinks.map((backlink) => (
                      <li key={backlink.route}>
                        <Link
                          className="text-xs leading-5 text-[var(--site-muted)] hover:text-[var(--site-accent)] dark:text-[var(--site-muted)] dark:hover:text-[var(--site-accent)]"
                          href={backlink.route}
                        >
                          {backlink.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-[var(--site-muted)] dark:text-[var(--site-muted)]">
                    暂无其他笔记链接到这里。
                  </p>
                )}
              </section>
            </div>
          </aside>
        </main>
      </PageTransition>
    </div>
  )
}
