import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getBlogEntryRoute } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `笔记 | ${siteConfig.title}`,
  description: "数学、拓扑数据分析、编程与长期研究笔记。",
}

export default async function BlogPage() {
  const route = await getBlogEntryRoute()
  if (route === "/blog") notFound()
  redirect(route)
}
