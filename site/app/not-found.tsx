import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-6 py-20">
      <div className="glass-panel w-full p-10 text-center">
        <p className="section-eyebrow">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-[color:var(--foreground)]">这个页面现在不在这里</h1>
        <p className="mt-4 text-sm leading-8 text-[color:var(--muted)]">
          站点正在从 Quartz 迁到新的 Next.js 主应用，部分旧路径可能已经失效或正在迁移。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[#15130f]">
            返回首页
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-3 text-sm text-[color:var(--foreground)]"
          >
            去博客
          </Link>
        </div>
      </div>
    </div>
  )
}
