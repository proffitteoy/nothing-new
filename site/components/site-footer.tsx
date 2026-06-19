import Link from "next/link"
import { profile } from "@/lib/profile"

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)]/65">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Personal Site</p>
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">{profile.name}</h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            一个长期写作、项目记录和知识整理入口。博客内容继续来自 Obsidian，主页负责个人站点表达。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
          <Link href="/blog" className="transition hover:text-[color:var(--foreground)]">
            博客
          </Link>
          <Link href="/portfolio" className="transition hover:text-[color:var(--foreground)]">
            项目
          </Link>
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
