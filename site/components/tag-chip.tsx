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
      className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-300 transition hover:border-cyan-300/40 hover:text-white"
    >
      #{tag}
    </Link>
  )
}
