import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getSectionNotes } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `笔记 | ${siteConfig.title}`,
  description: "数学、拓扑数据分析、编程与长期研究笔记。",
}

export default async function BlogPage() {
  const notes = await getSectionNotes("blog")
  const firstNote =
    notes.find((note) => note.route === "/blog/math/Fubini-Tonelli定理") ??
    notes.find((note) => note.text.trim().length >= 300)
  if (!firstNote) notFound()
  redirect(encodeURI(firstNote.route))
}
