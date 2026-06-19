import Link from "next/link"
import { navLinks, profile } from "@/lib/profile"

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)]/65">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Personal Site</p>
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">{profile.name}</h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            主站负责入口、项目、音乐、杂谈、友链和关于；Quartz 与 Obsidian 内容层继续保留给笔记系统。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[color:var(--foreground)]">
              {link.label}
            </Link>
          ))}
          <a href={profile.github} className="transition hover:text-[color:var(--foreground)]">
            GitHub
          </a>
          <a href={`mailto:${profile.email}`} className="transition hover:text-[color:var(--foreground)]">
            Email
          </a>
        </div>
      </div>
    </footer>
  )
}
