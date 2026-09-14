import type { Metadata } from "next"

import ChatterBoard from "@/components/ChatterBoard"
import Navbar from "@/components/Navbar"
import PageTransition from "@/components/PageTransition"
import { buildChatterItems } from "@/lib/notes/chatter"
import { getNoteManifest, getSectionNotes } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `杂谈 | ${siteConfig.title}`,
  description: "按最后修改时间整理的杂谈与项目记录。",
}

export default async function ChatterPage() {
  const [chatterNotes, manifest] = await Promise.all([
    getSectionNotes("chatter"),
    getNoteManifest(),
  ])
  const items = buildChatterItems(chatterNotes, manifest.trees.chatter, siteConfig.defaultPostCover)

  return (
    <div className="relative min-h-screen pb-10">
      <Navbar />
      <PageTransition>
        <ChatterBoard items={items} />
      </PageTransition>
    </div>
  )
}
