import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { TagChip } from "@/components/tag-chip"
import { formatDate } from "@/lib/format"
import { getPostBySlug, getPublishedPosts } from "@/lib/blog/content"
import { renderPostHtml } from "@/lib/blog/render"

type PageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({
    slug: post.slug.split("/"),
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug.join("/"))

  if (!post || post.isDraft || post.slug === "index") {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const maybePost = await getPostBySlug(slug.join("/"))

  if (!maybePost || maybePost.isDraft || maybePost.slug === "index") {
    notFound()
  }

  const post = maybePost

  const [html, allPosts] = await Promise.all([renderPostHtml(post), getPublishedPosts()])
  const relatedPosts = allPosts
    .filter((candidate) => candidate.slug !== post.slug && candidate.section === post.section)
    .slice(0, 3)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <article className="glass-panel overflow-hidden">
        <div className="border-b border-white/8 px-8 py-8 md:px-12 md:py-10">
          <Link href="/blog" className="section-eyebrow transition hover:text-white">
            返回博客
          </Link>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-400">
            <span>{post.section}</span>
            <span>{formatDate(post.updatedAt)}</span>
            <span>{post.readingMinutes} 分钟阅读</span>
          </div>
          {post.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="px-8 py-8 md:px-12 md:py-12">
          <div className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </article>

      {relatedPosts.length > 0 ? (
        <section className="space-y-5">
          <div className="space-y-2">
            <p className="section-eyebrow">Related notes</p>
            <h2 className="text-2xl font-semibold text-white">同一主题下的继续阅读</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((item) => (
              <Link key={item.slug} href={item.url} className="glass-panel p-5 transition hover:border-cyan-300/20">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{item.section}</p>
                <h3 className="mt-3 text-lg font-medium text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
