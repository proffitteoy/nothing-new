import Link from "next/link"
import { profile } from "@/lib/profile"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[color:var(--surface)]/65">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Built for long-term writing</p>
          <h2 className="text-lg font-semibold text-white">{profile.name}</h2>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            主站使用 Next.js 重建，博客内容继续复用现有 Obsidian 笔记目录，避免内容层和站点层继续耦合。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <Link href="/blog" className="transition hover:text-white">
            博客
          </Link>
          <a href={profile.github} className="transition hover:text-white">
            GitHub
          </a>
          <a href={`mailto:${profile.email}`} className="transition hover:text-white">
            Email
          </a>
        </div>
      </div>
    </footer>
  )
}
