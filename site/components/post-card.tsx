import Link from "next/link"
import type { BlogPost } from "@/lib/blog/types"
import { formatDate } from "@/lib/format"
import { TagChip } from "./tag-chip"

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="glass-panel group relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
        <span>{post.section}</span>
        <span>{formatDate(post.updatedAt)}</span>
        <span>{post.readingMinutes} 分钟</span>
      </div>

      <Link href={post.url} className="block">
        <h3 className="text-xl font-semibold text-white transition group-hover:text-cyan-200">{post.title}</h3>
        <p className="mt-3 overflow-hidden text-sm leading-7 text-zinc-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {post.description}
        </p>
      </Link>

      {post.tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : null}
    </article>
  )
}
