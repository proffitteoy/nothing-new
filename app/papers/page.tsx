import type { Metadata } from "next"
import PaperLibrary from "./PaperLibrary"
import snapshot from "@/data/paper-library.json"
import noteLinks from "@/data/paper-note-links.json"
import { renderPaperMarkdown } from "@/lib/papers"
import { getInitialPaperReports } from "@/lib/paper-reports-server"
import { publicPaperNote, type ZoteroPaper } from "@/lib/paper-library"
import { getSectionNotes } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `论文 | ${siteConfig.title}`,
  description: "论文收藏、阅读笔记与 TDA 论文周报。",
  alternates: { canonical: "/papers" },
}

export const revalidate = 60

export default async function PapersPage() {
  const [initial, blog, chatter, papers] = await Promise.all([
    getInitialPaperReports(),
    getSectionNotes("blog"),
    getSectionNotes("chatter"),
    Promise.all(
      snapshot.papers.map(async (paper) => ({
        ...paper,
        abstractHtml: paper.abstract ? await renderPaperMarkdown(paper.abstract) : "",
      })),
    ),
  ])
  const mappedPaths = new Set(Object.values(noteLinks as Record<string, string[]>).flat())
  const linkedNotes = [...blog, ...chatter]
    .map(publicPaperNote)
    .filter((note) => note.refs.length > 0 || mappedPaths.has(note.sourcePath))
  return (
    <PaperLibrary
      papers={papers as ZoteroPaper[]}
      collections={snapshot.collections}
      initialReports={initial.reports}
      initialReportsUpdatedAt={initial.updatedAt}
      notes={linkedNotes}
      noteLinks={noteLinks}
    />
  )
}
