import { connection } from "next/server"
import Navbar from "../../components/Navbar"
import PageTransition from "../../components/PageTransition"
import { siteConfig } from "../../siteConfig"
import AnimeShelf from "./AnimeShelf"
import { getAnimeShelf } from "./bangumi"

export const metadata = {
  title: `番剧 | ${siteConfig.title}`,
  description: "记录正在看的与已经看过的动画。",
}

export default async function AnimePage() {
  await connection()
  const shelf = await getAnimeShelf()

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        {shelf.status === "ready" ? (
          <AnimeShelf
            username={shelf.username}
            watching={shelf.watching}
            watched={shelf.watched}
          />
        ) : (
          <main className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-3xl items-center px-4 pt-24 sm:px-6">
            <section className="w-full rounded-[2rem] border border-white/50 bg-white/50 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 sm:p-12">
              <ClapperboardIcon />
              <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">
                放映清单暂时离线
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                {shelf.reason === "missing-token"
                  ? "请在服务端配置 BANGUMI_ACCESS_TOKEN，刷新后即可同步 Bangumi 收藏。"
                  : "Bangumi 暂时没有返回收藏记录，请稍后再来看看。"}
              </p>
            </section>
          </main>
        )}
      </PageTransition>
    </div>
  )
}

function ClapperboardIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl text-white shadow-lg shadow-indigo-500/25" aria-hidden="true">
      ◫
    </div>
  )
}
