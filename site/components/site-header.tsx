import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

const primaryLinks = [
  { href: "/blog", label: "博客" },
  { href: "/#projects", label: "项目" },
  { href: "/#focus", label: "方向" },
  { href: "/#contact", label: "联系" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--surface-strong)]/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="group inline-flex items-center gap-3 text-sm font-semibold text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-inset ring-cyan-300/20 transition group-hover:bg-cyan-300/20">
            LX
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-zinc-400">
              Personal Site
            </span>
            <span className="block text-sm text-white">李炫良</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <details className="md:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-zinc-100">
              菜单
            </summary>
            <div className="absolute right-6 top-16 w-44 rounded-2xl border border-white/10 bg-[color:var(--surface)]/95 p-3 shadow-2xl backdrop-blur-xl">
              <nav className="flex flex-col gap-2">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/8 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
