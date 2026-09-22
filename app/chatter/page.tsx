import type { Metadata } from "next"

import ChatterBoard from "@/components/ChatterBoard"
import PageTransition from "@/components/PageTransition"
import { buildChatterItems } from "@/lib/notes/chatter"
import {
  NATIVE_IMAGE_LAB_CONFIG,
  resolveImageLabConfig,
  type ImageLabSearchParams,
} from "@/lib/image-loading-lab"
import { getNoteManifest, getSectionNotes } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `杂谈 | ${siteConfig.title}`,
  description: "按最后修改时间整理的杂谈与项目记录。",
}

export default async function ChatterPage({
  searchParams,
}: {
  searchParams: Promise<ImageLabSearchParams>
}) {
  const imageLab =
    process.env.IMAGE_LOADING_LAB === "1"
      ? resolveImageLabConfig(await searchParams, true)
      : NATIVE_IMAGE_LAB_CONFIG
  const [chatterNotes, manifest] = await Promise.all([
    getSectionNotes("chatter"),
    getNoteManifest(),
  ])
  const items = buildChatterItems(chatterNotes, manifest.trees.chatter, siteConfig.defaultPostCover)

  return (
    <div className="relative min-h-screen pb-10">
      <PageTransition>
        <ChatterBoard items={items} imageLab={imageLab} />
      </PageTransition>
    </div>
  )
}
