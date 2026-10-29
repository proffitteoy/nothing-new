import type { Metadata } from "next"

import NoteRoutePage from "@/components/notes/NoteRoutePage"
import {
  decodeNotePath,
  getCanonicalRoute,
  getNoteByRoute,
  getStaticNoteParams,
  isFolderRoute,
} from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

type BlogNotePageProps = {
  params: Promise<{ path: string[] }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  return getStaticNoteParams("blog")
}

export async function generateMetadata({ params }: BlogNotePageProps): Promise<Metadata> {
  const { path } = await params
  const decodedPath = decodeNotePath(path)
  const route = `/blog/${decodedPath.join("/")}`
  const canonicalRoute = await getCanonicalRoute(route)
  const note = await getNoteByRoute(canonicalRoute)
  if (note) {
    return {
      title: `${note.title} | ${siteConfig.title}`,
      description: note.description,
      alternates: { canonical: note.route },
    }
  }
  if (await isFolderRoute("blog", route)) {
    const title = decodedPath.at(-1) ?? "笔记"
    return {
      title: `${title} | 笔记 | ${siteConfig.title}`,
      alternates: { canonical: canonicalRoute },
    }
  }
  return { title: `未找到笔记 | ${siteConfig.title}` }
}

export default async function BlogNotePage({ params }: BlogNotePageProps) {
  const { path } = await params
  return <NoteRoutePage section="blog" path={path} />
}
