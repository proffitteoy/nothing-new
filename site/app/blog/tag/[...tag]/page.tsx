import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PostCard } from "@/components/post-card"
import { getAllTags, getPostsByTag } from "@/lib/blog/content"
import { titleFromTag } from "@/lib/format"

type PageProps = {
  params: Promise<{
    tag: string[]
  }>
}

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((item) => ({
    tag: item.tag.split("/"),
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const tagPath = tag.join("/")

  return {
    title: `标签：${titleFromTag(tagPath)}`,
    description: `浏览标签 ${titleFromTag(tagPath)} 下的文章。`,
  }
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params
  const tagPath = tag.join("/")
  const posts = await getPostsByTag(tagPath)

  if (posts.length === 0) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="glass-panel p-8">
        <p className="section-eyebrow">Tag archive</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">#{titleFromTag(tagPath)}</h1>
        <p className="mt-4 text-sm leading-8 text-[color:var(--muted)]">共 {posts.length} 篇公开文章。</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </div>
  )
}
