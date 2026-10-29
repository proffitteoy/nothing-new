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

type ChatterNotePageProps = {
  params: Promise<{ path: string[] }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  return getStaticNoteParams("chatter")
}

export async function generateMetadata({ params }: ChatterNotePageProps): Promise<Metadata> {
  const { path } = await params
  const decodedPath = decodeNotePath(path)
  const route = `/chatter/${decodedPath.join("/")}`
  const canonicalRoute = await getCanonicalRoute(route)
  const note = await getNoteByRoute(canonicalRoute)
  if (note) {
    return {
      title: `${note.title} | ${siteConfig.title}`,
      description: note.description,
      alternates: { canonical: note.route },
    }
  }
  if (await isFolderRoute("chatter", route)) {
    const title = decodedPath.at(-1) ?? "杂谈"
    return {
      title: `${title} | 杂谈 | ${siteConfig.title}`,
      alternates: { canonical: canonicalRoute },
    }
  }
  return { title: `未找到笔记 | ${siteConfig.title}` }
}

export default async function ChatterNotePage({ params }: ChatterNotePageProps) {
  const { path } = await params
  return <NoteRoutePage section="chatter" path={path} />
}
