import Link from "next/link"
import type { ReactNode } from "react"
import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  FolderOpen,
  Github,
  Mail,
  MessageCircle,
  Tag,
} from "lucide-react"
import { TagChip } from "@/components/tag-chip"
import { buildContentAssetUrl, getAllTags, getPublishedPosts } from "@/lib/blog/content"
import type { BlogPost } from "@/lib/blog/types"
import { formatDate } from "@/lib/format"
import { profile } from "@/lib/profile"

const postCovers = [
  "图片/1.1.png",
  "图片/2.1.png",
  "图片/3.1.png",
  "图片/4.1.png",
  "图片/5.1.png",
  "图片/6.1.png",
]

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const tags = await getAllTags()
  const recentPosts = posts.slice(0, 6)
  const sectionCounts = getSectionCounts(posts)

  return (
    <>
      <section
        className="home-hero"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.34)), url('/home-banner.png')",
        }}
      >
        <div className="home-hero__info">
          <h1>{profile.name} 的宝藏之地</h1>
          <p>{profile.headline}</p>
        </div>
        <Link href="#content-inner" className="home-hero__down" aria-label="滚动到内容">
          <ChevronDown className="h-7 w-7" />
        </Link>
      </section>

      <div id="content-inner" className="home-layout">
        <main className="home-recent-posts">
          {recentPosts.map((post, index) => (
            <HomePostCard key={post.slug} post={post} index={index} />
          ))}
        </main>

        <aside className="home-aside">
          <AuthorCard postCount={posts.length} tagCount={tags.length} sectionCount={sectionCounts.length} />

          <AsideCard icon={<MessageCircle className="h-4 w-4" />} title="公告">
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              Quartz 和 Obsidian 笔记系统继续保留；这个首页只负责做个人站点入口和栏目导航。
            </p>
          </AsideCard>

          <div className="home-aside__sticky">
            <AsideCard icon={<BookOpenText className="h-4 w-4" />} title="最新文章">
              <div className="space-y-3">
                {recentPosts.slice(0, 5).map((post, index) => (
                  <Link key={post.slug} href={post.url} className="home-aside-post">
                    <img src={coverFor(index)} alt="" />
                    <span>
                      <span className="home-aside-post__title">{post.title}</span>
                      <time>{formatDate(post.updatedAt)}</time>
                    </span>
                  </Link>
                ))}
              </div>
            </AsideCard>

            <AsideCard icon={<FolderOpen className="h-4 w-4" />} title="分类">
              <div className="space-y-1">
                {sectionCounts.slice(0, 6).map((section) => (
                  <Link key={section.name} href={`/blog`} className="home-list-row">
                    <span>{section.name}</span>
                    <span>{section.count}</span>
                  </Link>
                ))}
              </div>
            </AsideCard>

            <AsideCard icon={<Tag className="h-4 w-4" />} title="标签">
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 12).map((item) => (
                  <TagChip key={item.tag} tag={item.tag} />
                ))}
              </div>
            </AsideCard>
          </div>
        </aside>
      </div>
    </>
  )
}

function HomePostCard({ post, index }: { post: BlogPost; index: number }) {
  const reversed = index % 2 === 1

  return (
    <article className="home-post-card">
      <Link href={post.url} className={`home-post-card__cover ${reversed ? "home-post-card__cover--right" : ""}`}>
        <img src={coverFor(index)} alt="" />
      </Link>
      <div className="home-post-card__info">
        <Link href={post.url} className="home-post-card__title">
          {post.title}
        </Link>
        <div className="home-post-card__meta">
          <span>
            <CalendarDays className="h-4 w-4" />
            {formatDate(post.updatedAt)}
          </span>
          <span>
            <FolderOpen className="h-4 w-4" />
            {post.section}
          </span>
          <span>{post.readingMinutes} 分钟</span>
        </div>
        <p>{post.description}</p>
      </div>
    </article>
  )
}

function AuthorCard({
  postCount,
  tagCount,
  sectionCount,
}: {
  postCount: number
  tagCount: number
  sectionCount: number
}) {
  return (
    <section className="home-card home-author-card">
      <img className="home-author-card__avatar" src={profile.avatar} alt={`${profile.name} 的头像`} />
      <h2>{profile.name}</h2>
      <p>{profile.intro}</p>
      <div className="home-site-data">
        <Link href="/blog">
          <span>文章</span>
          <strong>{postCount}</strong>
        </Link>
        <Link href="/blog">
          <span>标签</span>
          <strong>{tagCount}</strong>
        </Link>
        <Link href="/blog">
          <span>分类</span>
          <strong>{sectionCount}</strong>
        </Link>
      </div>
      <a href={profile.github} className="home-follow-button">
        <Github className="h-4 w-4" />
        Follow Me
      </a>
      <div className="home-socials">
        <a href={`mailto:${profile.email}`} aria-label="Email">
          <Mail className="h-5 w-5" />
        </a>
        <a href={profile.github} aria-label="GitHub">
          <Github className="h-5 w-5" />
        </a>
        <Link href="/projects">项目</Link>
        <Link href="/music">音乐</Link>
      </div>
    </section>
  )
}

function AsideCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="home-card">
      <h2 className="home-card__headline">
        {icon}
        <span>{title}</span>
      </h2>
      {children}
    </section>
  )
}

function getSectionCounts(posts: BlogPost[]) {
  const counts = new Map<string, number>()

  for (const post of posts) {
    counts.set(post.section, (counts.get(post.section) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"))
}

function coverFor(index: number) {
  return buildContentAssetUrl(postCovers[index % postCovers.length])
}
