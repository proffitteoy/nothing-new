import type { Metadata } from "next"
import { PostCard } from "@/components/post-card"
import { getPublishedPosts } from "@/lib/blog/content"

export const metadata: Metadata = {
  title: "杂谈",
  description: "来自 Obsidian 笔记中 misc 目录的杂谈文章。",
}

export default async function MiscPage() {
  const posts = (await getPublishedPosts()).filter((post) => post.section === "misc")

  return (
    <div className="butterfly-page">
      <section className="glass-panel p-7 md:p-10">
        <p className="section-eyebrow">Misc Notes</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">杂谈</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
          这里单独放笔记中的杂谈目录；完整笔记系统和 Quartz 源码继续保留。
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </div>
  )
}
