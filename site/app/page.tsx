import Link from "next/link"
import { PostCard } from "@/components/post-card"
import { getAllTags, getPublishedPosts } from "@/lib/blog/content"
import { highlightAreas, profile, selectedProjects } from "@/lib/profile"

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const tags = await getAllTags()
  const recentPosts = posts.slice(0, 6)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-12 md:py-20">
      <section className="glass-panel overflow-hidden px-8 py-12 md:px-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-7">
            <p className="section-eyebrow">Knowledge-first personal website</p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                把 <span className="text-gradient">Obsidian 笔记</span>、项目经历和长期研究写进同一个站点。
              </h1>
              <p className="max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
                {profile.intro}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                浏览博客
              </Link>
              <a
                href={profile.github}
                className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm text-zinc-100 transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="glass-panel p-6">
              <p className="section-eyebrow">Current focus</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{profile.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                个人主页不再和笔记引擎绑死，内容层保留，站点层单独演化。
              </p>
            </div>
            <div className="glass-panel grid gap-5 p-6 sm:grid-cols-3 lg:grid-cols-3">
              <div>
                <p className="text-3xl font-semibold text-white">{posts.length}</p>
                <p className="mt-1 text-sm text-zinc-500">公开文章</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">{tags.length}</p>
                <p className="mt-1 text-sm text-zinc-500">主题标签</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">{selectedProjects.length}</p>
                <p className="mt-1 text-sm text-zinc-500">精选项目</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="focus" className="space-y-6">
        <div className="space-y-3">
          <p className="section-eyebrow">Focus areas</p>
          <h2 className="text-3xl font-semibold text-white">当前重点方向</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {highlightAreas.map((area, index) => (
            <div key={area} className="glass-panel p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-lg font-medium text-white">{area}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="space-y-6">
        <div className="space-y-3">
          <p className="section-eyebrow">Selected work</p>
          <h2 className="text-3xl font-semibold text-white">主站首页展示的项目切片</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {selectedProjects.map((project) => (
            <a
              key={project.title}
              href={project.href}
              className="glass-panel group block p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/25"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-white transition group-hover:text-cyan-200">
                  {project.title}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-300">
                  {project.tag}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{project.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="section-eyebrow">Recent writing</p>
            <h2 className="text-3xl font-semibold text-white">最新公开笔记</h2>
          </div>
          <Link href="/blog" className="text-sm text-cyan-200 transition hover:text-cyan-100">
            查看全部文章
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {recentPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section id="contact" className="glass-panel grid gap-6 px-8 py-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="section-eyebrow">Contact</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">如果你想聊项目、研究或站点架构</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            这个站点接下来会逐步把博客、项目、研究主题和工具实验收束到同一套 Next.js 结构下。
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-zinc-300">
          <a href={`mailto:${profile.email}`} className="transition hover:text-white">
            {profile.email}
          </a>
          <a href={profile.github} className="transition hover:text-white">
            {profile.github}
          </a>
        </div>
      </section>
    </div>
  )
}
