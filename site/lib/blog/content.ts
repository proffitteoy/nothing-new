import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import readingTime from "reading-time"
import type { BlogPost, BlogRuntime, BlogTag, ResolvedNoteLink } from "./types"
import {
  buildNoteUrl,
  normalizeLookupKey,
  slugifyPath,
  slugifyTag,
  stripExtension,
  toPosix,
} from "./slug"

const CONTENT_ROOT = path.resolve(process.cwd(), "..", "content")

type RuntimeCache = {
  posts: BlogPost[]
  landing: BlogPost | null
  tags: BlogTag[]
  postsBySlug: Map<string, BlogPost>
  postsByRelativePath: Map<string, BlogPost>
  postsByStem: Map<string, BlogPost[]>
  assetsByPath: Set<string>
  assetsByStem: Map<string, string[]>
}

let runtimePromise: Promise<BlogRuntime> | null = null

export async function loadBlogRuntime() {
  if (!runtimePromise) {
    runtimePromise = buildRuntime()
  }

  return runtimePromise
}

export async function getPublishedPosts() {
  const runtime = await loadBlogRuntime()
  return runtime.posts.filter((post) => !post.isDraft && post.slug !== "index")
}

export async function getLandingPost() {
  const runtime = await loadBlogRuntime()
  return runtime.landing
}

export async function getPostBySlug(slug: string) {
  const runtime = await loadBlogRuntime()
  return runtime.posts.find((post) => post.slug === slug) ?? null
}

export async function getPostsByTag(tag: string) {
  const runtime = await loadBlogRuntime()
  const normalized = slugifyTag(tag)
  return runtime.posts.filter(
    (post) => !post.isDraft && post.slug !== "index" && post.tags.includes(normalized),
  )
}

export async function getAllTags() {
  const runtime = await loadBlogRuntime()
  return runtime.tags
}

export function buildContentAssetUrl(relativePath: string) {
  return encodeURI(`/content/${toPosix(relativePath)}`)
}

async function buildRuntime(): Promise<BlogRuntime> {
  const cache = await buildCache()

  return {
    posts: cache.posts,
    landing: cache.landing,
    tags: cache.tags,
    resolveNoteLink: (currentRelativePath, rawTarget) =>
      resolveNoteLink(cache, currentRelativePath, rawTarget),
    resolveAssetLink: (currentRelativePath, rawTarget) =>
      resolveAssetLink(cache, currentRelativePath, rawTarget),
  }
}

async function buildCache(): Promise<RuntimeCache> {
  const files = await collectFiles(CONTENT_ROOT)
  const posts: BlogPost[] = []
  const postsBySlug = new Map<string, BlogPost>()
  const postsByRelativePath = new Map<string, BlogPost>()
  const postsByStem = new Map<string, BlogPost[]>()
  const assetsByPath = new Set<string>()
  const assetsByStem = new Map<string, string[]>()

  for (const relativePath of files) {
    const sourcePath = path.join(CONTENT_ROOT, relativePath)
    const extension = path.extname(relativePath).toLowerCase()

    if (extension === ".md") {
      const post = await readPost(sourcePath, relativePath)
      posts.push(post)
      postsBySlug.set(post.slug, post)
      postsByRelativePath.set(post.relativePath, post)

      const stemKey = normalizeLookupKey(path.posix.basename(stripExtension(relativePath)))
      const existing = postsByStem.get(stemKey) ?? []
      existing.push(post)
      postsByStem.set(stemKey, existing)
      continue
    }

    const stemKey = normalizeLookupKey(path.posix.basename(relativePath))
    assetsByPath.add(relativePath)
    const existing = assetsByStem.get(stemKey) ?? []
    existing.push(relativePath)
    assetsByStem.set(stemKey, existing)
  }

  posts.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())

  const tagsMap = new Map<string, number>()
  for (const post of posts) {
    if (post.isDraft || post.slug === "index") {
      continue
    }

    for (const tag of post.tags) {
      tagsMap.set(tag, (tagsMap.get(tag) ?? 0) + 1)
    }
  }

  const tags = Array.from(tagsMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, "zh-CN"))

  return {
    posts,
    landing: postsBySlug.get("index") ?? null,
    tags,
    postsBySlug,
    postsByRelativePath,
    postsByStem,
    assetsByPath,
    assetsByStem,
  }
}

async function collectFiles(rootPath: string, currentPath = ""): Promise<string[]> {
  const directoryPath = path.join(rootPath, currentPath)
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"))) {
    if (entry.name.startsWith(".")) {
      continue
    }

    const relativePath = toPosix(path.posix.join(currentPath, entry.name))
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(rootPath, relativePath)))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

async function readPost(sourcePath: string, relativePath: string): Promise<BlogPost> {
  const rawSource = await fs.readFile(sourcePath, "utf8")
  const stats = await fs.stat(sourcePath)
  const { data, content } = matter(rawSource)
  const slug = slugifyPath(relativePath)
  const plainText = stripMarkdown(content)
  const title = getTitle(data.title, content, relativePath)
  const description = getDescription(data.description, plainText)
  const tags = getTags(data.tags ?? data.tag)
  const createdAt =
    parseDate(data.created ?? data.date) ?? normalizeDate(stats.birthtime) ?? normalizeDate(stats.mtime)!
  const updatedAt =
    parseDate(data.modified ?? data.updated ?? data.lastmod ?? data.date) ??
    normalizeDate(stats.mtime) ??
    createdAt
  const publishedAt = parseDate(data.published ?? data.publishDate ?? data.date) ?? createdAt
  const section = slug.split("/")[0] ?? "blog"
  const draft = isDraft(data.draft) || isExplicitlyUnpublished(data.publish ?? data.published)
  const readingMinutes = Math.max(1, Math.round(readingTime(plainText).minutes))

  return {
    slug,
    url: buildNoteUrl(slug),
    relativePath: toPosix(relativePath),
    sourcePath,
    title,
    description,
    excerpt: plainText.slice(0, 180),
    section,
    tags,
    content,
    createdAt,
    updatedAt,
    publishedAt,
    readingMinutes,
    isDraft: draft,
  }
}

function resolveNoteLink(
  cache: RuntimeCache,
  currentRelativePath: string,
  rawTarget: string,
): ResolvedNoteLink | null {
  const normalizedTarget = toPosix(rawTarget).trim()
  if (!normalizedTarget) {
    return null
  }

  const directMatch = resolveByPathCandidates(
    cache.postsByRelativePath,
    cache.postsBySlug,
    currentRelativePath,
    normalizedTarget,
    ".md",
  )
  if (directMatch) {
    return {
      post: directMatch,
      url: directMatch.url,
      label: directMatch.title,
    }
  }

  const stemKey = normalizeLookupKey(path.posix.basename(stripExtension(normalizedTarget)))
  const matches = cache.postsByStem.get(stemKey) ?? []
  const selected = chooseClosestMatch(matches, currentRelativePath)
  if (!selected) {
    return null
  }

  return {
    post: selected,
    url: selected.url,
    label: selected.title,
  }
}

function resolveAssetLink(cache: RuntimeCache, currentRelativePath: string, rawTarget: string) {
  const normalizedTarget = toPosix(rawTarget).trim()
  if (!normalizedTarget) {
    return null
  }

  const directMatch = resolveAssetByPath(cache.assetsByPath, currentRelativePath, normalizedTarget)
  if (directMatch) {
    return buildContentAssetUrl(directMatch)
  }

  const stemKey = normalizeLookupKey(path.posix.basename(normalizedTarget))
  const matches = cache.assetsByStem.get(stemKey) ?? []
  const selected = chooseClosestAsset(matches, currentRelativePath)
  return selected ? buildContentAssetUrl(selected) : null
}

function resolveAssetByPath(
  assetsByPath: Set<string>,
  currentRelativePath: string,
  rawTarget: string,
) {
  const currentDir = path.posix.dirname(currentRelativePath)
  const candidates = new Set<string>()
  const addCandidate = (candidate: string) => {
    const normalized = toPosix(path.posix.normalize(candidate)).replace(/^\.\/+/, "")
    if (!normalized || normalized.startsWith("../")) {
      return
    }
    candidates.add(normalized)
  }

  if (rawTarget.startsWith("/")) {
    addCandidate(rawTarget.slice(1))
  } else {
    addCandidate(path.posix.join(currentDir, rawTarget))
    addCandidate(rawTarget)
  }

  for (const candidate of candidates) {
    if (assetsByPath.has(candidate)) {
      return candidate
    }
  }

  return null
}

function resolveByPathCandidates(
  byRelativePath: Map<string, BlogPost>,
  bySlug: Map<string, BlogPost>,
  currentRelativePath: string,
  rawTarget: string,
  defaultExtension: ".md" | "",
) {
  const currentDir = path.posix.dirname(currentRelativePath)
  const candidates = new Set<string>()
  const addCandidate = (candidate: string) => {
    const normalized = toPosix(path.posix.normalize(candidate)).replace(/^\.\/+/, "")
    if (!normalized || normalized.startsWith("../")) {
      return
    }
    candidates.add(normalized)
  }

  if (rawTarget.startsWith("/")) {
    addCandidate(rawTarget.slice(1))
  } else {
    addCandidate(path.posix.join(currentDir, rawTarget))
    addCandidate(rawTarget)
  }

  const expanded = new Set<string>()
  for (const candidate of candidates) {
    if (path.posix.extname(candidate)) {
      expanded.add(candidate)
      continue
    }

    if (defaultExtension) {
      expanded.add(`${candidate}${defaultExtension}`)
      expanded.add(path.posix.join(candidate, "index.md"))
    }

    expanded.add(candidate)
  }

  for (const candidate of expanded) {
    const direct = byRelativePath.get(candidate)
    if (direct) {
      return direct
    }

    const slugMatch = bySlug.get(slugifyPath(candidate))
    if (slugMatch) {
      return slugMatch
    }
  }

  return null
}

function chooseClosestMatch(matches: BlogPost[], currentRelativePath: string) {
  if (matches.length === 0) {
    return null
  }

  if (matches.length === 1) {
    return matches[0]
  }

  const currentDir = path.posix.dirname(currentRelativePath)
  return (
    matches.find((post) => path.posix.dirname(post.relativePath) === currentDir) ??
    matches.find((post) => post.relativePath.startsWith(`${currentDir}/`)) ??
    matches[0]
  )
}

function chooseClosestAsset(matches: string[], currentRelativePath: string) {
  if (matches.length === 0) {
    return null
  }

  if (matches.length === 1) {
    return matches[0]
  }

  const currentDir = path.posix.dirname(currentRelativePath)
  return matches.find((asset) => path.posix.dirname(asset) === currentDir) ?? matches[0]
}

function getTitle(frontmatterTitle: unknown, content: string, relativePath: string) {
  if (typeof frontmatterTitle === "string" && frontmatterTitle.trim()) {
    return frontmatterTitle.trim()
  }

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim()
    if (trimmed.startsWith("#")) {
      return trimmed.replace(/^#+\s*/u, "").trim()
    }
  }

  return stripExtension(path.posix.basename(relativePath))
}

function getDescription(frontmatterDescription: unknown, plainText: string) {
  if (typeof frontmatterDescription === "string" && frontmatterDescription.trim()) {
    return frontmatterDescription.trim()
  }

  return plainText.slice(0, 160)
}

function getTags(rawTags: unknown) {
  if (!rawTags) {
    return []
  }

  const values = Array.isArray(rawTags) ? rawTags : String(rawTags).split(",")
  return values
    .map((value) => slugifyTag(String(value).trim()))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
}

function parseDate(value: unknown) {
  if (!value) {
    return null
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value
  }

  const parsed = new Date(String(value))
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function normalizeDate(value: Date | null) {
  if (!value || !Number.isFinite(value.getTime())) {
    return null
  }

  return value
}

function isDraft(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    return ["true", "yes", "1"].includes(value.trim().toLowerCase())
  }

  return false
}

function isExplicitlyUnpublished(value: unknown) {
  if (typeof value === "boolean") {
    return value === false
  }

  if (typeof value === "string") {
    return ["false", "no", "0"].includes(value.trim().toLowerCase())
  }

  return false
}

function stripMarkdown(content: string) {
  return content
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/\$\$[\s\S]*?\$\$/gu, " ")
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/!\[\[[^\]]+\]\]/gu, " ")
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/gu, "$2$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/gu, " ")
    .replace(/\[[^\]]*\]\(([^)]+)\)/gu, " ")
    .replace(/^>\s?/gmu, "")
    .replace(/[#*_~>-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}
