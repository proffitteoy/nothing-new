import Navbar from "../../components/Navbar"
import PageTransition from "../../components/PageTransition"
import {
  NATIVE_IMAGE_LAB_CONFIG,
  resolveImageLabConfig,
  type ImageLabSearchParams,
} from "../../lib/image-loading-lab"
import { siteConfig } from "../../siteConfig"
import AnimeShelf from "./AnimeShelf"

export const metadata = {
  title: `番剧 | ${siteConfig.title}`,
  description: "记录正在看的与已经看过的动画。",
}

export default async function AnimePage({
  searchParams,
}: {
  searchParams: Promise<ImageLabSearchParams>
}) {
  const imageLab =
    process.env.IMAGE_LOADING_LAB === "1"
      ? resolveImageLabConfig(await searchParams, true)
      : NATIVE_IMAGE_LAB_CONFIG

  return (
    <div className="relative min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        <AnimeShelf imageLab={imageLab} />
      </PageTransition>
    </div>
  )
}
