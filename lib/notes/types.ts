export type NoteSection = "blog" | "chatter"

export type NoteTocEntry = {
  depth: number
  text: string
  slug: string
}

export type NoteReference = {
  slug: string
  route: string
  title: string
}

export type NoteFeatures = {
  mermaid: boolean
  popovers: boolean
}

export type ImageDimensions = {
  width: number
  height: number
}

export type NoteArtifact = {
  version: 1
  slug: string
  simpleSlug: string
  section: NoteSection
  route: string
  sourcePath: string
  title: string
  description: string
  cover?: string
  coverDimensions?: ImageDimensions
  dates: {
    created?: string
    modified?: string
    published?: string
  }
  tags: string[]
  toc: NoteTocEntry[]
  backlinks: NoteReference[]
  links: NoteReference[]
  html: string
  text: string
  assets: string[]
  features: NoteFeatures
}

export type NoteSearchRecord = {
  slug: string
  route: string
  section: NoteSection
  title: string
  text: string
  tags: string[]
}

export type NoteTreeNode = {
  name: string
  title: string
  path: string
  type: "folder" | "note"
  children?: NoteTreeNode[]
}

export type NoteManifest = {
  version: 1
  generatedAt: string
  artifacts: Record<string, string>
  slugs: Record<string, string>
  aliases: Record<string, string>
  folders: Record<NoteSection, string[]>
  trees: Record<NoteSection, NoteTreeNode[]>
  search: Record<NoteSection, string>
}
