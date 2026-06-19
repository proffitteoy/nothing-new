import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

const primaryLinks = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "博客" },
  { href: "/portfolio", label: "项目" },
  { href: "/#now", label: "现在" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)]/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="group inline-flex items-center gap-3 text-sm font-semibold text-[color:var(--foreground)]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--surface-soft)] text-[color:var(--accent)] ring-1 ring-inset ring-[color:var(--border)] transition group-hover:ring-[color:var(--accent)]">
            LX
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Personal Site
            </span>
            <span className="block text-sm text-[color:var(--foreground)]">李炫良</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <details className="md:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm text-[color:var(--foreground)]">
              菜单
            </summary>
            <div className="absolute right-6 top-16 w-44 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]/95 p-3 shadow-2xl backdrop-blur-xl">
              <nav className="flex flex-col gap-2">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm text-[color:var(--muted)] transition hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]"
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
