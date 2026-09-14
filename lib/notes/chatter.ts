import type { ImageDimensions, NoteArtifact, NoteTreeNode } from "./types"

export type ChatterItem =
  | {
      kind: "note"
      route: string
      title: string
      modified?: string
      cover: string
      coverDimensions?: ImageDimensions
    }
  | {
      kind: "folder"
      route: string
      title: string
      modified?: string
      noteCount: number
    }

function noteDate(note: NoteArtifact) {
  return note.dates.modified ?? note.dates.created ?? ""
}

export function buildChatterItems(
  chatterNotes: readonly NoteArtifact[],
  blogNotes: readonly NoteArtifact[],
  blogTree: readonly NoteTreeNode[],
  defaultCover: string,
): ChatterItem[] {
  const noteItems: ChatterItem[] = chatterNotes.map((note) => ({
    kind: "note",
    route: note.route,
    title: note.title,
    modified: noteDate(note) || undefined,
    cover:
      note.cover ??
      note.assets.find((asset) => /\.(avif|gif|jpe?g|png|webp)$/i.test(asset)) ??
      defaultCover,
    coverDimensions: note.coverDimensions,
  }))
  const folderItems: ChatterItem[] = blogTree
    .filter((node) => node.type === "folder" && node.path !== "/blog/math")
    .map((node) => {
      const folderNotes = blogNotes
        .filter((note) => note.route.startsWith(`${node.path}/`))
        .sort((left, right) => noteDate(right).localeCompare(noteDate(left)))
      return {
        kind: "folder",
        route: node.path,
        title: node.title,
        modified: folderNotes[0] ? noteDate(folderNotes[0]) : undefined,
        noteCount: folderNotes.length,
      }
    })

  return [...noteItems, ...folderItems].sort(
    (left, right) =>
      (right.modified ?? "").localeCompare(left.modified ?? "") ||
      left.title.localeCompare(right.title, "zh-CN"),
  )
}
