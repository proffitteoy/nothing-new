import type { NoteArtifact } from "./notes/types"
import type { PaperReport } from "./papers"

export type ZoteroPaper = {
  id: string
  aliases: string[]
  title: string
  authors: string[]
  year: string
  doi: string | null
  arxiv: string | null
  url: string | null
  abstract: string
  collections: { id: string; name: string; parentId?: string | null }[]
  readingStatus: "read" | "reading" | null
  updatedAt: string
}

export type PublicPaperNote = Pick<
  NoteArtifact,
  "route" | "sourcePath" | "title" | "description" | "dates" | "html"
> & { refs: string[] }
export type LibraryPaper = ZoteroPaper & {
  refs: string[]
  notes: PublicPaperNote[]
  reports: { date: string; index: number }[]
}

export function normalizePaperRef(input: string): string | null {
  let value = input.trim().replace(/&amp;/g, "&")
  try {
    value = decodeURIComponent(value)
  } catch {
    return null
  }
  const zotero = /^zotero:(personal|(?:users|groups):\d+):([A-Z0-9]{8})$/i.exec(value)
  if (zotero) return `zotero:${zotero[1].toLowerCase()}:${zotero[2].toUpperCase()}`
  const select =
    /^zotero:\/\/select\/(library|groups\/\d+)\/items\/([A-Z0-9]{8})(?:[?#].*)?$/i.exec(value)
  if (select)
    return `zotero:${select[1].toLowerCase() === "library" ? "personal" : select[1].toLowerCase().replace("/", ":")}:${select[2].toUpperCase()}`
  const web =
    /^https?:\/\/(?:www\.)?zotero\.org\/(users|groups)\/(\d+)\/items\/([A-Z0-9]{8})(?:[/?#].*)?$/i.exec(
      value,
    )
  if (web) return `zotero:${web[1].toLowerCase()}:${web[2]}:${web[3].toUpperCase()}`
  value = value.replace(/[。；，]+$/, "")
  const arxiv =
    /^(?:arxiv:|https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf|html)\/)(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z-]+)?\/\d{7})(?:v\d+)?(?:\.pdf)?(?:[?#].*)?$/i.exec(
      value,
    )
  if (arxiv) return `arxiv:${arxiv[1].toLowerCase()}`
  const doi = /^(?:doi:\s*|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/[^\s<>"#?]+)$/i.exec(value)
  if (doi) {
    const identifier = doi[1].replace(/[.,;]+$/, "").toLowerCase()
    // arXiv's DOI names the same preprint, even when Zotero has no arXiv URL.
    if (identifier.startsWith("10.48550/arxiv.")) {
      return normalizePaperRef(`arxiv:${identifier.slice("10.48550/arxiv.".length)}`)
    }
    return `doi:${identifier}`
  }
  return null
}

export function extractPaperRefs(text: string): string[] {
  const candidates =
    text.match(
      /zotero:(?:personal|(?:users|groups):\d+):[A-Z0-9]{8}|zotero:\/\/select\/(?:library|groups\/\d+)\/items\/[A-Z0-9]{8}|https?:\/\/(?:www\.)?zotero\.org\/(?:users|groups)\/\d+\/items\/[A-Z0-9]{8}|(?:https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf|html)\/|arxiv:\s*)(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z-]+)?\/\d{7})(?:v\d+)?|(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)10\.\d{4,9}\/[^\s<>"\]；。]+/gi,
    ) ?? []
  return [
    ...new Set(
      candidates
        .map((candidate) => normalizePaperRef(candidate.replace(/^arxiv:\s*/i, "arxiv:")))
        .filter((ref): ref is string => !!ref),
    ),
  ]
}

// Only notes emitted by Quartz enter this function; the private Obsidian vault is never scanned.
export function publicPaperNote(note: NoteArtifact): PublicPaperNote {
  return {
    route: note.route,
    sourcePath: note.sourcePath,
    title: note.title,
    description: note.description,
    dates: note.dates,
    html: note.html,
    refs: [
      ...new Set(
        [...(note.paperRefs ?? []), ...extractPaperRefs(note.html)]
          .map(normalizePaperRef)
          .filter((ref): ref is string => !!ref),
      ),
    ],
  }
}

export function buildPaperLibrary(
  zotero: ZoteroPaper[],
  reports: PaperReport[],
  notes: PublicPaperNote[] = [],
  links: Record<string, string[]> = {},
): LibraryPaper[] {
  const papers = new Set<LibraryPaper>()
  const byRef = new Map<string, LibraryPaper>()
  function insert(source: ZoteroPaper, refs: string[], report?: { date: string; index: number }) {
    refs = [...new Set(refs.map(normalizePaperRef).filter((ref): ref is string => !!ref))]
    const matches = [
      ...new Set(
        refs.map((ref) => byRef.get(ref)).filter((paper): paper is LibraryPaper => !!paper),
      ),
    ]
    const target: LibraryPaper = matches[0] ?? {
      ...source,
      collections: [...source.collections],
      refs: [],
      notes: [],
      reports: [],
    }
    if (!matches.length) papers.add(target)
    for (const entry of matches.slice(1)) {
      target.refs.push(...entry.refs)
      target.collections.push(...entry.collections)
      target.reports.push(...entry.reports)
      if (entry.readingStatus === "read" || !target.readingStatus)
        target.readingStatus = entry.readingStatus
      papers.delete(entry)
    }
    // Zotero entries are inserted first and own bibliographic metadata and reading state.
    if (source.readingStatus === "read" || !target.readingStatus)
      target.readingStatus = source.readingStatus
    target.doi ||= source.doi
    target.arxiv ||= source.arxiv
    target.collections = [
      ...new Map(
        [...target.collections, ...source.collections].map((item) => [item.id, item]),
      ).values(),
    ]
    target.refs = [...new Set([...target.refs, ...refs])]
    if (report) target.reports.push(report)
    target.refs.forEach((ref) => byRef.set(ref, target))
  }
  for (const paper of zotero) {
    insert(paper, [
      paper.id,
      ...paper.aliases,
      ...(paper.doi ? [`doi:${paper.doi}`] : []),
      ...(paper.arxiv ? [`arxiv:${paper.arxiv}`] : []),
    ])
  }
  reports.forEach((report) =>
    report.papers.forEach((paper, index) => {
      const primary = paper.url ? normalizePaperRef(paper.url) : null
      const id = primary ?? `report:${report.date}:${index}`
      insert(
        {
          id,
          aliases: [],
          title: paper.title,
          authors: paper.authors ?? [],
          year: paper.year ?? "",
          doi: primary?.startsWith("doi:") ? primary.slice(4) : null,
          arxiv: primary?.startsWith("arxiv:") ? primary.slice(6) : null,
          url: paper.url,
          abstract: "",
          collections: [],
          readingStatus: null,
          updatedAt: report.date,
        },
        primary ? [primary] : [],
        { date: report.date, index },
      )
    }),
  )
  const explicitLinks = Object.entries(links).map(
    ([ref, paths]) => [normalizePaperRef(ref), paths] as const,
  )
  for (const note of notes) {
    const refs = new Set(note.refs)
    for (const [ref, paths] of explicitLinks) {
      if (ref && paths.includes(note.sourcePath)) refs.add(ref)
    }
    for (const ref of refs) {
      const paper = byRef.get(ref)
      if (paper && !paper.notes.some((existing) => existing.route === note.route))
        paper.notes.push(note)
    }
  }
  return [...papers].sort(
    (a, b) =>
      b.year.localeCompare(a.year) ||
      b.updatedAt.localeCompare(a.updatedAt) ||
      a.title.localeCompare(b.title),
  )
}
