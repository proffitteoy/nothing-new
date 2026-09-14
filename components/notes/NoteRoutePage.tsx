import { notFound, permanentRedirect } from "next/navigation"

import {
  decodeNotePath,
  getCanonicalRoute,
  getFolderNotes,
  getNoteByRoute,
  isFolderRoute,
} from "@/lib/notes/server"
import type { NoteSection } from "@/lib/notes/types"
import NoteCollectionPage from "./NoteCollectionPage"
import NoteShell from "./NoteShell"

export default async function NoteRoutePage({
  section,
  path,
}: {
  section: NoteSection
  path: string[]
}) {
  const decodedPath = decodeNotePath(path)
  const route = `/${section}/${decodedPath.join("/")}`
  const canonicalRoute = await getCanonicalRoute(route)
  if (canonicalRoute !== route) permanentRedirect(encodeURI(canonicalRoute))

  const note = await getNoteByRoute(route)
  if (note) return <NoteShell note={note} />

  if (await isFolderRoute(section, route)) {
    const notes = await getFolderNotes(section, route)
    const title = decodedPath.at(-1) ?? (section === "blog" ? "笔记" : "杂谈")
    return (
      <NoteCollectionPage
        section={section}
        title={title}
        description={`浏览“${title}”文件夹中的公开笔记。`}
        notes={notes}
        folderRoute={route}
      />
    )
  }

  notFound()
}
