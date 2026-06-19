import type { Metadata } from "next"
import { ArrowUpRight } from "lucide-react"
import { featuredProjects } from "@/lib/profile"

export const metadata: Metadata = {
  title: "项目",
  description: "李炫良的精选项目索引。",
}

export default function PortfolioPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-6 md:py-16">
      <section className="glass-panel p-7 md:p-10">
        <p className="section-eyebrow">Projects</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">项目索引</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
          这里保留精选项目入口和简短说明。完整履历、教育背景和奖项不放在主站首页，避免把个人站点做成简历页面。
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {featuredProjects.map((project) => (
          <a
            key={project.title}
            href={project.href}
            className="glass-panel group block p-6 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs text-[color:var(--muted)]">
                  {project.tag}
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-[color:var(--foreground)] transition group-hover:text-[color:var(--accent)]">
                  {project.title}
                </h2>
              </div>
              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[color:var(--muted)] transition group-hover:text-[color:var(--accent)]" />
            </div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{project.description}</p>
          </a>
        ))}
      </section>
    </div>
  )
}
