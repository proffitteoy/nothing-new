import type { Metadata } from "next"
import { notFound } from "next/navigation"
import MusicPreview from "./MusicPreview"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "音乐组件接口预览",
  robots: { index: false, follow: false },
}

export default function HomeMusicPreview() {
  if (process.env.HOME_MUSIC_PREVIEW !== "1") notFound()
  return <MusicPreview />
}
