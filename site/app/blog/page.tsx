import type { Metadata } from "next"
import { PostCard } from "@/components/post-card"
import { getLandingPost, getPublishedPosts } from "@/lib/blog/content"
import { renderPostHtml } from "@/lib/blog/render"

export const metadata: Metadata = {
  title: "博客",
  description: "按文章列表浏览公开的数学笔记、建模记录与工程反思。",
}

export default async function BlogIndexPage() {
  const [landing, posts] = await Promise.all([getLandingPost(), getPublishedPosts()])
  const landingHtml = landing ? await renderPostHtml(landing) : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="glass-panel p-8 md:p-10">
        <p className="section-eyebrow">Blog index</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">博客</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-zinc-400">
          这里只保留内容阅读、分类和长期归档所必需的部分。搜索、图谱、双链统计这些 Quartz 特性不再主导站点架构。
        </p>
        {landingHtml ? (
          <div
            className="article-content mt-8 border-t border-white/8 pt-8"
            dangerouslySetInnerHTML={{ __html: landingHtml }}
          />
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </div>
  )
}
