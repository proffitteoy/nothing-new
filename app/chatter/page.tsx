import type { Metadata } from "next"

import ChatterBoard from "@/components/ChatterBoard"
import Navbar from "@/components/Navbar"
import PageTransition from "@/components/PageTransition"
import { buildChatterItems } from "@/lib/notes/chatter"
import { getNoteManifest, getSectionNotes } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `杂谈 | ${siteConfig.title}`,
  description: "零散想法、开发记录与日常观察。",
}

export default async function ChatterPage() {
  const [chatterNotes, blogNotes, manifest] = await Promise.all([
    getSectionNotes("chatter"),
    getSectionNotes("blog"),
    getNoteManifest(),
  ])
  const items = buildChatterItems(
    chatterNotes,
    blogNotes,
    manifest.trees.blog,
    siteConfig.defaultPostCover,
  )

  return (
    <div className="relative min-h-screen pb-10">
      <Navbar />
      <PageTransition>
        <ChatterBoard items={items} />
      </PageTransition>
    </div>
  )
}
