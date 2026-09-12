import Navbar from "../../components/Navbar"
import PageTransition from "../../components/PageTransition"
import { siteConfig } from "../../siteConfig"
import AnimeShelf from "./AnimeShelf"

export const metadata = {
  title: `番剧 | ${siteConfig.title}`,
  description: "记录正在看的与已经看过的动画。",
}

export default function AnimePage() {
  return (
    <div className="relative min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        <AnimeShelf />
      </PageTransition>
    </div>
  )
}
