import type { Metadata } from "next"
import PageTransition from "../components/PageTransition"
import ProfileCard from "../components/ProfileCard"
import SiteDashboard from "../components/SiteDashboard"
import HomeStoryBoard from "../components/HomeStoryBoard"
import { ToastProvider } from "../components/ToastProvider"
import { getNoteManifest } from "../lib/notes/server"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default async function Home() {
  const manifest = await getNoteManifest()
  const routes = Object.keys(manifest.artifacts)
  const blogCount = routes.filter((route) => route.startsWith("/blog/")).length
  const chatterCount = routes.filter((route) => route.startsWith("/chatter/")).length

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <PageTransition>
          {/* 🌟 调整整体容器的内边距，适应手机端更小的屏幕 */}
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <main className="flex flex-col gap-6 w-full mt-6">
              {/* Music mounts in #67's future host; keep the old card retired. */}
              <div className="flex flex-col w-full">
                <ProfileCard postCount={blogCount} chatterCount={chatterCount} />
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
