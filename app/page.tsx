import type { Metadata } from "next"
import PageTransition from "../components/PageTransition"
import CloudPlayer from "../components/CloudPlayer"
import SiteDashboard from "../components/SiteDashboard"
import LyricBar from "../components/LyricBar"
import HomeStoryBoard from "../components/HomeStoryBoard"
import { ToastProvider } from "../components/ToastProvider"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function Home() {
  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <PageTransition>
          {/* 🌟 调整整体容器的内边距，适应手机端更小的屏幕 */}
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <main className="flex flex-col gap-6 w-full mt-6">
              {/* #47 removes the personal block; #51 / #67 own the remaining stage layout. */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <div className="col-span-1 lg:col-start-8 lg:col-span-5 flex flex-col">
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
