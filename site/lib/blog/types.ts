export interface BlogPost {
  slug: string
  url: string
  relativePath: string
  sourcePath: string
  title: string
  description: string
  excerpt: string
  section: string
  tags: string[]
  content: string
  createdAt: Date
  updatedAt: Date
  publishedAt: Date
  readingMinutes: number
  isDraft: boolean
}

export interface BlogTag {
  tag: string
  count: number
}

export interface ResolvedNoteLink {
  post: BlogPost
  url: string
  label: string
}

export interface BlogRuntime {
  posts: BlogPost[]
  landing: BlogPost | null
  tags: BlogTag[]
  resolveNoteLink: (currentRelativePath: string, rawTarget: string) => ResolvedNoteLink | null
  resolveAssetLink: (currentRelativePath: string, rawTarget: string) => string | null
}
