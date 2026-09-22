import { connection } from "next/server"

import { getAnimeShelf } from "./anime/bangumi"
import PageTransition from "../components/PageTransition"
import { siteConfig } from "../siteConfig"
import CloudPlayer from "../components/CloudPlayer"
import ProfileCard from "../components/ProfileCard"
import SiteDashboard from "../components/SiteDashboard"
import LyricBar from "../components/LyricBar"
import HomeStoryBoard from "../components/HomeStoryBoard"
import { ToastProvider } from "../components/ToastProvider"
import { getNoteManifest } from "../lib/notes/server"

export default async function Home() {
  await connection()
  const [manifest, animeShelf] = await Promise.all([getNoteManifest(), getAnimeShelf()])
  const routes = Object.keys(manifest.artifacts)
  const blogCount = routes.filter((route) => route.startsWith("/blog/")).length
  const chatterCount = routes.filter((route) => route.startsWith("/chatter/")).length
  const animeCount =
    animeShelf.status === "ready" ? animeShelf.watching.total + animeShelf.watched.total : null

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
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
                    musicCount={siteConfig.cloudMusicIds.length}
                    animeCount={animeCount}
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

              <HomeStoryBoard />
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
