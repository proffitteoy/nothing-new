import type { Metadata } from "next"
import PaperLibrary from "./PaperLibrary"
import snapshot from "@/data/paper-library.json"
import noteLinks from "@/data/paper-note-links.json"
import seedReports from "@/data/tda-reports.json"
import { compilePaperReports } from "@/lib/papers"
import { publicPaperNote, type ZoteroPaper } from "@/lib/paper-library"
import { getSectionNotes } from "@/lib/notes/server"
import { siteConfig } from "@/siteConfig"

export const metadata: Metadata = {
  title: `论文 | ${siteConfig.title}`,
  description: "论文收藏、阅读笔记与 TDA 论文周报。",
  alternates: { canonical: "/papers" },
}

export default async function PapersPage() {
  const [reports, blog, chatter] = await Promise.all([
    compilePaperReports(seedReports),
    getSectionNotes("blog"),
    getSectionNotes("chatter"),
  ])
  const mappedPaths = new Set(Object.values(noteLinks as Record<string, string[]>).flat())
  const linkedNotes = [...blog, ...chatter]
    .map(publicPaperNote)
    .filter((note) => note.refs.length > 0 || mappedPaths.has(note.sourcePath))
  return (
    <PaperLibrary
      papers={snapshot.papers as ZoteroPaper[]}
      collections={snapshot.collections}
      initialReports={reports}
      notes={linkedNotes}
      noteLinks={noteLinks}
    />
  )
}
