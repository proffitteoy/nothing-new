import Link from "next/link"

export function TagChip({ tag }: { tag: string }) {
  const href = `/blog/tag/${tag
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
    >
      #{tag}
    </Link>
  )
}
