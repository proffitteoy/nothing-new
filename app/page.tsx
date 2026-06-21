import fs from "fs"
import path from "path"
import Link from "next/link"
import { BookOpen, FolderGit2, MessageCircle, Music2, UserRound, UsersRound } from "lucide-react"

import Navbar from "../components/Navbar"
import PageTransition from "../components/PageTransition"
import { siteConfig } from "../siteConfig"
import CloudPlayer from "../components/CloudPlayer"
import ProfileCard from "../components/ProfileCard"
import SiteDashboard from "../components/SiteDashboard"
import LyricBar from "../components/LyricBar"
import ThemeToggleBlock from "../components/ThemeToggleBlock"
import { ToastProvider } from "../components/ToastProvider"

function countQuartzPages(directory: string) {
  if (!fs.existsSync(directory)) return 0

  let total = 0
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      total += countQuartzPages(fullPath)
    } else if (
      entry.name.endsWith(".html") &&
      entry.name !== "index.html" &&
      entry.name !== "404.html"
    ) {
      total += 1
    }
  }

  return total
}

export default function Home() {
  const quartzBlogDir = path.join(process.cwd(), "public", "blog")
  const quartzMiscDir = path.join(quartzBlogDir, "misc")
  const blogCount = countQuartzPages(quartzBlogDir)
  const chatterCount = countQuartzPages(quartzMiscDir)
  const legacyEntrances = [
    {
      title: "项目",
      description: "整理展示我的项目与仓库自述。",
      href: "/projects",
      icon: FolderGit2,
      tone: "from-sky-500/20 to-indigo-500/20",
    },
    {
      title: "音乐",
      description: "收藏一些循环播放的网易云歌单。",
      href: "/music",
      icon: Music2,
      tone: "from-rose-500/20 to-orange-400/20",
    },
    {
      title: "杂谈",
      description: "收起零散想法，打开第一篇随笔。",
      href: "/chatter",
      icon: MessageCircle,
      tone: "from-emerald-500/20 to-teal-400/20",
    },
    {
      title: "博客",
      description: "接入原有知识库与长期笔记。",
      href: "/legacy",
      icon: BookOpen,
      tone: "from-cyan-500/20 to-blue-400/20",
    },
    {
      title: "友链",
      description: "展示友站；交换友链请提交申请。",
      href: "/friends",
      icon: UsersRound,
      tone: "from-fuchsia-500/20 to-pink-400/20",
    },
    {
      title: "关于",
      description: "放一些项目页之外的个人介绍。",
      href: "/about",
      icon: UserRound,
      tone: "from-amber-500/20 to-lime-400/20",
    },
  ]

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          {/* 🌟 调整整体容器的内边距，适应手机端更小的屏幕 */}
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <main className="flex flex-col gap-6 w-full mt-6">
              {/* 第一行：个人信息 + 播放器 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                {/* 手机上占满1列，电脑上占7列 */}
                <div className="col-span-1 lg:col-span-7 flex flex-col">
                  <ProfileCard
                    postCount={blogCount}
                    chatterCount={chatterCount}
                    photoCount={siteConfig.cloudMusicIds.length}
                  />
                </div>
                {/* 手机上占满1列，电脑上占5列 */}
                <div className="col-span-1 lg:col-span-5 flex flex-col">
                  <CloudPlayer />
                </div>
              </div>

              {/* 歌词栏 */}
              <div className="w-full mt-[-10px]">
                <LyricBar />
              </div>

              {/* 核心入口：只保留指定栏目 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                <div className="min-h-[170px]">
                  <ThemeToggleBlock />
                </div>
                {legacyEntrances.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative overflow-hidden rounded-3xl bg-white/45 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl p-6 min-h-[170px] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.tone} opacity-70 group-hover:opacity-100 transition-opacity duration-500`}
                      />
                      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-white/50 dark:border-white/10 flex items-center justify-center shadow-sm">
                            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                            进入
                          </span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {item.title}
                          </h2>
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* 底部数据面板 */}
              <div className="w-full mt-4">
                <SiteDashboard />
              </div>
            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  )
}
