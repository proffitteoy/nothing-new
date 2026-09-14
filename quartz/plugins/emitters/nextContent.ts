import fs from "node:fs"
import path from "node:path"
import type { Element, Root } from "hast"
import { toHtml } from "hast-util-to-html"
import sharp from "sharp"
import { visit } from "unist-util-visit"

import type {
  NoteArtifact,
  ImageDimensions,
  NoteManifest,
  NoteReference,
  NoteSearchRecord,
  NoteSection,
  NoteTreeNode,
} from "../../../lib/notes/types"
import type { BuildCtx } from "../../util/ctx"
import { glob } from "../../util/glob"
import {
  type FilePath,
  type FullSlug,
  simplifySlug,
  slugifyFilePath,
  splitAnchor,
} from "../../util/path"
import type { ProcessedContent, QuartzPluginData } from "../vfile"
import type { QuartzEmitterPlugin } from "../types"

const artifactRoot = path.join(".quartz-cache", "next")
const publicAssetRoot = path.join("public", "quartz-assets", "content")
const assetExtension = /\.(?:avif|gif|ico|jpe?g|pdf|png|svg|webp|mp3|mp4|wav|woff2?|ttf)$/i
const optimizedImageWidths = [384, 640, 750, 828, 1080, 1200, 1440, 1920]
const noteImageSizes =
  "(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc(100vw - 6rem), 820px"

function isMiscContent(simpleSlug: string) {
  return simpleSlug === "misc" || simpleSlug.startsWith("misc/")
}

export function getNoteSection(slug: string): NoteSection {
  const simple = simplifySlug(slug as FullSlug).replace(/^\/+|\/+$/g, "")
  if (isMiscContent(simple)) return "chatter"
  if (simple === "math" || simple.startsWith("math/") || !simple) return "blog"
  return "chatter"
}

export function getNoteRoute(slug: string, fallbackSection?: NoteSection): string {
  const simple = simplifySlug(slug as FullSlug).replace(/^\/+|\/+$/g, "")
  const section = fallbackSection ?? getNoteSection(slug)
  const localSlug =
    section === "chatter" && isMiscContent(simple) ? simple.replace(/^misc\/?/, "") : simple
  return `/${section}${localSlug ? `/${localSlug}` : ""}`
}

export function getLegacyBlogAliases(slug: string) {
  const simple = simplifySlug(slug as FullSlug).replace(/^\/+|\/+$/g, "")
  if (getNoteSection(slug) !== "chatter" || isMiscContent(simple)) return []

  const targetSegments = getNoteRoute(slug).split("/").filter(Boolean)
  return Array.from({ length: targetSegments.length - 1 }, (_, index) => {
    const target = `/${targetSegments.slice(0, index + 2).join("/")}`
    return [target.replace(/^\/chatter/, "/blog"), target] as const
  })
}

function artifactPathFor(route: string): string {
  const segments = route.split("/").filter(Boolean)
  const section = segments.shift() ?? "blog"
  const fileName = segments.pop() ?? "index"
  return path.join("artifacts", section, ...segments, `${fileName}.json`)
}

function toIsoString(value: unknown): string | undefined {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : undefined
}

function resolveContentPath(slug: string, relativeUrl: string): string {
  const [pathname, anchor] = splitAnchor(relativeUrl)
  const current = simplifySlug(slug as FullSlug).replace(/^\/+/, "")
  const resolved = new URL(pathname, `https://notes.invalid/${current}`).pathname
  return `${decodeURI(resolved).replace(/^\/+/, "")}${anchor}`
}

function isExternalUrl(value: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)
}

export function isOptimizableSiteImage(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !/\.(?:gif|svg)(?:[?#]|$)/i.test(value)
}

export function buildNextImageUrl(src: string, width: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
}

export function getResponsiveImageAttributes(src: string, dimensions?: ImageDimensions) {
  if (!dimensions || !isOptimizableSiteImage(src)) return { src }

  const widths = optimizedImageWidths.filter((width) => width < dimensions.width)
  const ceiling = optimizedImageWidths.find((width) => width >= dimensions.width)
  if (ceiling) widths.push(ceiling)
  if (widths.length === 0) widths.push(optimizedImageWidths[0])

  return {
    src: buildNextImageUrl(src, widths.at(-1)!),
    srcSet: widths.map((width) => `${buildNextImageUrl(src, width)} ${width}w`).join(", "),
    sizes: noteImageSizes,
  }
}

export function resolveNoteCover(slug: string, value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined

  const cover = value.trim()
  if (cover.startsWith("/") || isExternalUrl(cover)) return cover

  const assetPath = resolveContentPath(slug, cover).split("#", 1)[0]
  return "/quartz-assets/content/" + assetPath
}

function localImagePath(src: string) {
  const pathname = src.split(/[?#]/, 1)[0]
  const quartzPrefix = "/quartz-assets/content/"
  const root = path.resolve(pathname.startsWith(quartzPrefix) ? publicAssetRoot : "public")
  const relativeUrl = pathname.startsWith(quartzPrefix)
    ? pathname.slice(quartzPrefix.length)
    : pathname.replace(/^\/+/, "")

  let segments: string[]
  try {
    segments = relativeUrl.split("/").filter(Boolean).map(decodeURIComponent)
  } catch {
    return null
  }

  const candidate = path.resolve(root, ...segments)
  const relative = path.relative(root, candidate)
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null
  return candidate
}

async function readImageDimensions(
  src: string,
  cache: Map<string, Promise<ImageDimensions | undefined>>,
) {
  if (!src.startsWith("/") || src.startsWith("//")) return undefined
  const filePath = localImagePath(src)
  if (!filePath) return undefined

  let pending = cache.get(filePath)
  if (!pending) {
    pending = sharp(filePath, { animated: false, failOn: "none" })
      .metadata()
      .then(({ width, height }) =>
        width && height && Number.isFinite(width) && Number.isFinite(height)
          ? { width, height }
          : undefined,
      )
      .catch(() => undefined)
    cache.set(filePath, pending)
  }
  return pending
}

async function rewriteTree(
  tree: Root,
  fileData: QuartzPluginData,
  dimensionCache: Map<string, Promise<ImageDimensions | undefined>>,
) {
  const copy = structuredClone(tree)
  const assets = new Set<string>()
  const imageTasks: Promise<void>[] = []
  let mermaid = false
  let popovers = false

  visit(copy, "element", (node: Element) => {
    const classNames = Array.isArray(node.properties.className)
      ? node.properties.className.map(String)
      : []

    if (classNames.includes("mermaid")) mermaid = true

    if (node.tagName === "a" && typeof node.properties.href === "string") {
      const href = node.properties.href
      if (href.startsWith("#") || isExternalUrl(href)) return

      const [, anchor] = splitAnchor(href)
      if (assetExtension.test(href.split("#", 1)[0])) {
        const assetPath = resolveContentPath(fileData.slug!, href).split("#", 1)[0]
        node.properties.href = `/quartz-assets/content/${assetPath}${anchor}`
        assets.add(`/quartz-assets/content/${assetPath}`)
        return
      }

      const dataSlug = node.properties.dataSlug ?? node.properties["data-slug"]
      if (typeof dataSlug === "string") {
        if (dataSlug.startsWith("tags/")) {
          const section = getNoteSection(fileData.slug!)
          node.properties.href = `/${section}?tag=${encodeURIComponent(dataSlug.slice(5))}`
        } else {
          node.properties.href = `${getNoteRoute(dataSlug)}${anchor}`
          popovers = true
        }
      }
    }

    if (
      ["img", "video", "audio", "iframe", "source"].includes(node.tagName) &&
      typeof node.properties.src === "string"
    ) {
      let src = node.properties.src
      if (!src.startsWith("/") && !src.startsWith("#") && !isExternalUrl(src)) {
        const assetPath = resolveContentPath(fileData.slug!, src).split("#", 1)[0]
        src = `/quartz-assets/content/${assetPath}`
        node.properties.src = src
        assets.add(src)
      }

      if (["img", "video", "iframe"].includes(node.tagName)) {
        node.properties.loading ??= "lazy"
      }
      if (node.tagName === "img") {
        node.properties.decoding ??= "async"
        imageTasks.push(
          readImageDimensions(src, dimensionCache).then((dimensions) => {
            if (dimensions) {
              if (!(Number(node.properties.width) > 0)) {
                node.properties.width = dimensions.width
              }
              if (!(Number(node.properties.height) > 0)) {
                node.properties.height = dimensions.height
              }
            }
            const responsive = getResponsiveImageAttributes(src, dimensions)
            node.properties.src = responsive.src
            if (responsive.srcSet) node.properties.srcSet ??= responsive.srcSet
            if (responsive.sizes) node.properties.sizes ??= responsive.sizes
          }),
        )
      }
    }
  })

  await Promise.all(imageTasks)

  return { tree: copy, assets: [...assets], mermaid, popovers }
}

function createReference(fileData: QuartzPluginData): NoteReference {
  return {
    slug: simplifySlug(fileData.slug!),
    route: getNoteRoute(fileData.slug!),
    title: fileData.frontmatter?.title ?? simplifySlug(fileData.slug!),
  }
}

function referencesFor(
  fileData: QuartzPluginData,
  allFiles: QuartzPluginData[],
): { backlinks: NoteReference[]; links: NoteReference[] } {
  const simpleSlug = simplifySlug(fileData.slug!)
  const outgoing = new Set(fileData.links ?? [])
  const links = allFiles
    .filter((candidate) => outgoing.has(simplifySlug(candidate.slug!)))
    .map(createReference)
  const backlinks = allFiles
    .filter((candidate) => candidate.links?.includes(simpleSlug))
    .map(createReference)

  return { backlinks, links }
}

function insertTreeNode(tree: NoteTreeNode[], artifact: NoteArtifact) {
  const segments = artifact.route.split("/").filter(Boolean).slice(1)
  if (segments.length === 0) return

  let nodes = tree
  let currentPath = `/${artifact.section}`
  const folderSegments = artifact.slug.endsWith("/index") ? segments : segments.slice(0, -1)
  for (const segment of folderSegments) {
    currentPath += `/${segment}`
    let folder = nodes.find((node) => node.type === "folder" && node.name === segment)
    if (!folder) {
      folder = {
        name: segment,
        title: segment,
        path: currentPath,
        type: "folder",
        children: [],
      }
      nodes.push(folder)
    }
    nodes = folder.children!
  }

  if (artifact.slug.endsWith("/index")) {
    const folder = tree
      .flatMap(function flatten(node): NoteTreeNode[] {
        return [node, ...(node.children?.flatMap(flatten) ?? [])]
      })
      .find((node) => node.type === "folder" && node.path === artifact.route)
    if (folder) folder.title = artifact.title
    return
  }

  nodes.push({
    name: segments.at(-1)!,
    title: artifact.title,
    path: artifact.route,
    type: "note",
  })
}

function sortTree(nodes: NoteTreeNode[]) {
  nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === "folder" ? -1 : 1
    return left.title.localeCompare(right.title, "zh-CN")
  })
  for (const node of nodes) {
    if (node.children) sortTree(node.children)
  }
}

async function writeJson(filePath: string, value: unknown) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function copyContentAssets(ctx: BuildCtx) {
  const files = await glob("**", ctx.argv.directory, [
    "**/*.md",
    ...ctx.cfg.configuration.ignorePatterns,
  ])

  for (const file of files) {
    const source = path.join(ctx.argv.directory, file)
    const destination = path.join(publicAssetRoot, slugifyFilePath(file as FilePath))
    await fs.promises.mkdir(path.dirname(destination), { recursive: true })
    await fs.promises.copyFile(source, destination)
  }
}

export const NextContentArtifacts: QuartzEmitterPlugin = () => ({
  name: "NextContentArtifacts",
  async *emit(ctx, content) {
    const allFiles = content.map(([, file]) => file.data)
    const dimensionCache = new Map<string, Promise<ImageDimensions | undefined>>()
    const trees: Record<NoteSection, NoteTreeNode[]> = { blog: [], chatter: [] }
    const folderSets: Record<NoteSection, Set<string>> = {
      blog: new Set(),
      chatter: new Set(),
    }
    const manifest: NoteManifest = {
      version: 1,
      generatedAt: new Date().toISOString(),
      artifacts: {},
      slugs: {},
      aliases: {},
      folders: { blog: [], chatter: [] },
      trees,
      search: {
        blog: "search/blog.json",
        chatter: "search/chatter.json",
      },
    }

    await Promise.all([
      fs.promises.rm(artifactRoot, { recursive: true, force: true }),
      fs.promises.rm(publicAssetRoot, { recursive: true, force: true }),
    ])
    await Promise.all([
      copyContentAssets(ctx),
      fs.promises.mkdir(artifactRoot, { recursive: true }),
    ])
    const artifacts = (
      await Promise.all(content.map((entry) => buildArtifact(entry, allFiles, dimensionCache)))
    ).filter((artifact): artifact is NoteArtifact => artifact !== null)

    const searchRecords: Record<NoteSection, NoteSearchRecord[]> = {
      blog: [],
      chatter: [],
    }

    for (const artifact of artifacts) {
      const relativeArtifactPath = artifactPathFor(artifact.route).replaceAll("\\", "/")
      const destination = path.join(artifactRoot, relativeArtifactPath)
      await writeJson(destination, artifact)
      manifest.artifacts[artifact.route] = relativeArtifactPath
      manifest.slugs[artifact.slug] = artifact.route
      manifest.slugs[artifact.simpleSlug] = artifact.route
      collectFolders(artifact.route, folderSets[artifact.section])
      insertTreeNode(trees[artifact.section], artifact)
      searchRecords[artifact.section].push({
        slug: artifact.slug,
        route: artifact.route,
        section: artifact.section,
        title: artifact.title,
        text: artifact.text,
        tags: artifact.tags,
      })
      for (const [legacyRoute, targetRoute] of getLegacyBlogAliases(artifact.slug)) {
        manifest.aliases[legacyRoute] = targetRoute
      }

      const fileData = allFiles.find((file) => file.slug === artifact.slug)
      for (const alias of fileData?.aliases ?? []) {
        manifest.aliases[getNoteRoute(alias, artifact.section)] = artifact.route
      }

      yield destination as FilePath
    }

    for (const section of ["blog", "chatter"] as const) {
      sortTree(trees[section])
      manifest.folders[section] = [...folderSets[section]].sort((left, right) =>
        left.localeCompare(right, "zh-CN"),
      )
      const searchPath = path.join(artifactRoot, manifest.search[section])
      await writeJson(searchPath, searchRecords[section])
      await writeJson(
        path.join("public", "quartz-assets", "search", `${section}.json`),
        searchRecords[section],
      )
      yield searchPath as FilePath
    }

    const manifestPath = path.join(artifactRoot, "manifest.json")
    await writeJson(manifestPath, manifest)
    yield manifestPath as FilePath
  },
})

function collectFolders(route: string, folders: Set<string>) {
  const segments = route.split("/").filter(Boolean)
  for (let index = 1; index < segments.length - 1; index++) {
    folders.add(`/${segments.slice(0, index + 1).join("/")}`)
  }
}

async function buildArtifact(
  content: ProcessedContent,
  allFiles: QuartzPluginData[],
  dimensionCache: Map<string, Promise<ImageDimensions | undefined>>,
): Promise<NoteArtifact | null> {
  const [tree, file] = content
  const fileData = file.data
  const route = getNoteRoute(fileData.slug!)
  if (route === "/blog" || route === "/chatter") return null

  const cover = resolveNoteCover(fileData.slug!, fileData.frontmatter?.socialImage)
  const [rewritten, coverDimensions] = await Promise.all([
    rewriteTree(tree, fileData, dimensionCache),
    cover ? readImageDimensions(cover, dimensionCache) : undefined,
  ])
  const references = referencesFor(fileData, allFiles)
  return {
    version: 1,
    slug: fileData.slug!,
    simpleSlug: simplifySlug(fileData.slug!),
    section: getNoteSection(fileData.slug!),
    route,
    sourcePath: fileData.relativePath!,
    title: fileData.frontmatter?.title ?? simplifySlug(fileData.slug!),
    description: fileData.description ?? "",
    cover,
    coverDimensions,
    dates: {
      created: toIsoString(fileData.dates?.created),
      modified: toIsoString(fileData.dates?.modified),
      published: toIsoString(fileData.dates?.published),
    },
    tags: fileData.frontmatter?.tags ?? [],
    toc: fileData.toc ?? [],
    backlinks: references.backlinks,
    links: references.links,
    html: toHtml(rewritten.tree, { allowDangerousHtml: true }),
    text: fileData.text ?? "",
    assets: rewritten.assets,
    features: {
      mermaid: rewritten.mermaid,
      popovers: rewritten.popovers,
    },
  }
}
