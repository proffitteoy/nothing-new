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
      cover: string
    }

function noteDate(note: NoteArtifact) {
  return note.dates.modified ?? note.dates.created ?? ""
}

export function buildChatterItems(
  chatterNotes: readonly NoteArtifact[],
  chatterTree: readonly NoteTreeNode[],
  defaultCover: string,
): ChatterItem[] {
  const miscNotes = chatterNotes.filter((note) => note.sourcePath.startsWith("misc/"))
  const projectNotes = chatterNotes.filter((note) => !note.sourcePath.startsWith("misc/"))
  const projectRoutes = new Set(
    projectNotes.map((note) => `/chatter/${note.route.split("/").filter(Boolean)[1]}`),
  )
  const noteItems: ChatterItem[] = miscNotes.map((note) => ({
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
  const folderItems: ChatterItem[] = chatterTree
    .filter((node) => node.type === "folder" && projectRoutes.has(node.path))
    .map((node) => {
      const folderNotes = projectNotes
        .filter((note) => note.route.startsWith(`${node.path}/`))
        .sort((left, right) => noteDate(right).localeCompare(noteDate(left)))
      const cover =
        folderNotes
          .flatMap((note) => [
            note.cover,
            note.assets.find((asset) => /\.(avif|gif|jpe?g|png|webp)$/i.test(asset)),
          ])
          .find((asset): asset is string => Boolean(asset)) ?? defaultCover
      return {
        kind: "folder",
        route: node.path,
        title: node.title,
        modified: folderNotes[0] ? noteDate(folderNotes[0]) : undefined,
        noteCount: folderNotes.length,
        cover,
      }
    })

  return [...noteItems, ...folderItems].sort(
    (left, right) =>
      (right.modified ?? "").localeCompare(left.modified ?? "") ||
      left.title.localeCompare(right.title, "zh-CN"),
  )
}
