import type { LibraryPaper, ZoteroPaper } from "@/lib/paper-library"
import type { KGData, KGNode, KGLink } from "./types"

export function folderDescendants(
  collections: ZoteroPaper["collections"],
  id: string,
): Set<string> {
  const keys = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    for (const collection of collections) {
      if (collection.parentId && keys.has(collection.parentId) && !keys.has(collection.id)) {
        keys.add(collection.id)
        changed = true
      }
    }
  }
  return keys
}

// The graph contains actual folder hierarchy and membership, never inferred citations.
export function buildPaperFolderData(
  papers: LibraryPaper[],
  collections: ZoteroPaper["collections"],
): KGData {
  const byId = new Map(collections.map((collection) => [collection.id, collection]))
  const roots = collections.filter(
    (collection) => !collection.parentId || !byId.has(collection.parentId),
  )
  const rootOf = (id: string) => {
    let current = byId.get(id)
    const visited = new Set<string>()
    while (current?.parentId && byId.has(current.parentId) && !visited.has(current.id)) {
      visited.add(current.id)
      current = byId.get(current.parentId)
    }
    return current?.id ?? id
  }
  const count = (id: string) => {
    const keys = folderDescendants(collections, id)
    return papers.filter((paper) => paper.collections.some((collection) => keys.has(collection.id)))
      .length
  }
  const colors = new Map(roots.map((collection, index) => [collection.id, index % 8]))
  const nodes: KGNode[] = collections.map((collection) => ({
    id: `c:${collection.id}`,
    tier: collection.parentId && byId.has(collection.parentId) ? "tag" : "category",
    name: collection.name,
    url: "",
    colorIndex: colors.get(rootOf(collection.id)) ?? 0,
    categoryId: `c:${rootOf(collection.id)}`,
    value: count(collection.id),
    publishedAt: 0,
  }))
  const links: KGLink[] = []
  for (const collection of collections) {
    if (collection.parentId && byId.has(collection.parentId)) {
      links.push({
        source: `c:${collection.parentId}`,
        target: `c:${collection.id}`,
        kind: byId.get(collection.parentId)?.parentId ? "tag-tag" : "category-tag",
        value: 1,
      })
    }
  }
  for (const paper of papers) {
    const memberships = paper.collections.filter((collection) => byId.has(collection.id))
    const root = rootOf(memberships[0]?.id ?? "unfiled")
    nodes.push({
      id: `p:${paper.id}`,
      tier: "post",
      name: paper.title,
      url: paper.id,
      colorIndex: colors.get(root) ?? 0,
      categoryId: `c:${root}`,
      value: 0,
      publishedAt: Date.parse(`${paper.year || "2000"}-01-01`) || 0,
      postId: paper.id,
      searchText: [paper.title, ...paper.authors, paper.year, paper.doi, paper.arxiv]
        .filter(Boolean)
        .join(" "),
    })
    for (const collection of memberships) {
      links.push({
        source: `c:${collection.id}`,
        target: `p:${paper.id}`,
        kind: byId.get(collection.id)?.parentId ? "tag-post" : "category-post",
        value: 1,
      })
    }
  }
  return {
    nodes,
    links,
    meta: {
      version: 1,
      categories: roots.map((collection) => ({
        id: `c:${collection.id}`,
        name: collection.name,
        url: "",
        colorIndex: colors.get(collection.id) ?? 0,
        postCount: count(collection.id),
        tagCount: folderDescendants(collections, collection.id).size - 1,
      })),
      counts: {
        category: roots.length,
        tag: collections.length - roots.length,
        post: papers.length,
        heading: 0,
      },
      timeRange: { from: 0, to: Date.now() },
      headingDepth: 0,
    },
  }
}
