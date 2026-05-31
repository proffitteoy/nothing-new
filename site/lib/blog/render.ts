import path from "node:path"
import { findAndReplace } from "mdast-util-find-and-replace"
import rehypeKatex from "rehype-katex"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import rehypeStringify from "rehype-stringify"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { visit } from "unist-util-visit"
import { loadBlogRuntime } from "./content"
import { splitAnchor } from "./slug"
import type { BlogPost, BlogRuntime } from "./types"

const externalLinkRegex = /^https?:\/\//iu
const wikilinkRegex = /!?\[\[([^\[\]\|#\\]+)?(#+[^\[\]\|#\\]+)?(\\?\|[^\[\]#]*)?\]\]/gu
const highlightRegex = /==([^=]+)==/gu
const calloutRegex = /^\[!([\w-]+)\|?(.+?)?\]([+-]?)/
const calloutLineRegex = /^> *\[!\w+\|?.*?\][+-]?.*$/gmu
const tableRegex = /^\|([^\n])+\|\n(\|)( ?:?-{3,}:? ?\|)+\n(\|([^\n])+\|\n?)+/gmu
const tableWikilinkRegex = /(!?\[\[[^\]]*?\]\]|\[\^[^\]]*?\])/gu
const blockReferenceRegex = /\^([-_A-Za-z0-9]+)$/u
const wikilinkImageEmbedRegex =
  /^(?<alt>(?!^\d*x?\d*$).*?)?(?:\|?\s*(?<width>\d+)(?:x(?<height>\d+))?)?$/u

const calloutMapping = {
  note: "note",
  abstract: "abstract",
  summary: "abstract",
  tldr: "abstract",
  info: "info",
  todo: "todo",
  tip: "tip",
  hint: "tip",
  important: "tip",
  success: "success",
  check: "success",
  done: "success",
  question: "question",
  help: "question",
  faq: "question",
  warning: "warning",
  attention: "warning",
  caution: "warning",
  failure: "failure",
  missing: "failure",
  fail: "failure",
  danger: "danger",
  error: "danger",
  bug: "bug",
  example: "example",
  quote: "quote",
  cite: "quote",
} as const

export async function renderPostHtml(post: BlogPost) {
  const runtime = await loadBlogRuntime()
  const source = preprocessMarkdown(post.content)

  const rendered = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkWikiLinks, { post, runtime })
    .use(remarkStandardLinks, { post, runtime })
    .use(remarkCallouts)
    .use(remarkBlockIds)
    .use(remarkHighlights)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypePrettyCode, {
      keepBackground: false,
      theme: {
        dark: "github-dark",
        light: "github-light",
      },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(source)

  return String(rendered)
}

function preprocessMarkdown(source: string) {
  return source
    .replace(/%%[\s\S]*?%%/gu, "")
    .replace(calloutLineRegex, (value) => `${value}\n> `)
    .replace(tableRegex, (value) =>
      value.replace(tableWikilinkRegex, (raw) => {
        let escaped = raw.replace("#", "\\#")
        escaped = escaped.replace(/((^|[^\\])(\\\\)*)\|/gu, "$1\\|")
        return escaped
      }),
    )
}

function remarkWikiLinks({ post, runtime }: { post: BlogPost; runtime: BlogRuntime }) {
  return (tree: any) => {
    ;(findAndReplace as any)(tree, [
      [
        wikilinkRegex,
        (value: string, rawPath?: string, rawHeader?: string, rawAlias?: string) => {
          const filePart = rawPath?.trim() ?? ""
          const headerPart = rawHeader?.trim() ?? ""
          const alias = rawAlias ? rawAlias.slice(1).trim() : undefined
          const [targetPath, anchor] = splitAnchor(`${filePart}${headerPart}`)

          if (filePart && externalLinkRegex.test(filePart)) {
            return {
              type: "link",
              url: filePart,
              children: [{ type: "text", value: alias || filePart }],
            }
          }

          if (value.startsWith("!")) {
            const embedNode = resolveEmbedNode({
              currentRelativePath: post.relativePath,
              runtime,
              targetPath,
              anchor,
              alias,
            })

            if (embedNode) {
              return embedNode
            }
          }

          if (!targetPath) {
            return {
              type: "link",
              url: `${post.url}${anchor}`,
              children: [{ type: "text", value: alias || "跳转到当前段落" }],
            }
          }

          const resolved = runtime.resolveNoteLink(post.relativePath, targetPath)
          if (!resolved) {
            return {
              type: "html",
              value: `<span class="broken-link">${alias || filePart}</span>`,
            }
          }

          return {
            type: "link",
            url: `${resolved.url}${anchor}`,
            children: [{ type: "text", value: alias || resolved.label }],
          }
        },
      ],
    ])
  }
}

function remarkStandardLinks({ post, runtime }: { post: BlogPost; runtime: BlogRuntime }) {
  return (tree: any) => {
    visit(tree, "link", (node: { url: string; children: Array<{ type: string; value?: string }> }) => {
      if (!node.url || externalLinkRegex.test(node.url) || node.url.startsWith("#")) {
        return
      }

      const [targetPath, anchor] = splitAnchor(node.url)
      const resolved = runtime.resolveNoteLink(post.relativePath, targetPath)
      if (resolved) {
        node.url = `${resolved.url}${anchor}`
        return
      }

      const assetUrl = runtime.resolveAssetLink(post.relativePath, targetPath)
      if (assetUrl) {
        node.url = `${assetUrl}${anchor}`
      }
    })

    visit(tree, "image", (node: any, index, parent: any) => {
      if (!node.url || externalLinkRegex.test(node.url)) {
        return
      }

      const assetUrl = runtime.resolveAssetLink(post.relativePath, node.url)
      if (!assetUrl) {
        return
      }

      const extension = path.extname(node.url).toLowerCase()
      if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp"].includes(extension)) {
        node.url = assetUrl
        return
      }

      if (!parent || index === undefined) {
        return
      }

      if ([".mp4", ".webm", ".ogv", ".mov", ".mkv"].includes(extension)) {
        parent.children.splice(index, 1, {
          type: "html",
          value: `<video controls src="${assetUrl}" class="article-media"></video>`,
        })
        return
      }

      if ([".mp3", ".wav", ".m4a", ".ogg", ".flac"].includes(extension)) {
        parent.children.splice(index, 1, {
          type: "html",
          value: `<audio controls src="${assetUrl}" class="article-media"></audio>`,
        })
        return
      }

      if (extension === ".pdf") {
        parent.children.splice(index, 1, {
          type: "html",
          value: `<iframe src="${assetUrl}" class="article-pdf"></iframe>`,
        })
      }
    })
  }
}

function remarkCallouts() {
  return (tree: any) => {
    visit(tree, "blockquote", (node: any) => {
      const firstChild = node.children?.[0]
      const firstTextChild = firstChild?.children?.[0]

      if (firstChild?.type !== "paragraph" || firstTextChild?.type !== "text") {
        return
      }

      const [firstLine, ...restLines] = String(firstTextChild.value).split("\n")
      const match = firstLine.match(calloutRegex)
      if (!match) {
        return
      }

      const rawType = match[1]?.toLowerCase() ?? "note"
      const type = calloutMapping[rawType as keyof typeof calloutMapping] ?? rawType
      const customTitle = firstLine.slice(match[0].length).trim()
      const title = customTitle || humanizeCalloutType(rawType)
      const extraInlineChildren = firstChild.children.slice(1)
      const restText = restLines.join("\n").trim()

      const titleNode = {
        type: "paragraph",
        data: {
          hName: "div",
          hProperties: {
            className: ["obsidian-callout-title"],
          },
        },
        children: [
          {
            type: "text",
            value: `${title}${extraInlineChildren.length > 0 ? " " : ""}`,
          },
          ...extraInlineChildren,
        ],
      }

      const nextChildren: any[] = [titleNode]
      if (restText) {
        nextChildren.push({
          type: "paragraph",
          children: [{ type: "text", value: restText }],
        })
      }

      if (node.children.length > 1) {
        nextChildren.push(...node.children.slice(1))
      }

      node.children = nextChildren
      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...((node.data?.hProperties ?? {}) as Record<string, unknown>),
          className: ["obsidian-callout", `obsidian-callout--${type}`],
          "data-callout": type,
        },
      }
    })
  }
}

function remarkBlockIds() {
  return (tree: any) => {
    visit(tree, "paragraph", (node: any) => {
      const lastChild = node.children?.[node.children.length - 1]
      if (lastChild?.type !== "text") {
        return
      }

      const match = String(lastChild.value).match(blockReferenceRegex)
      if (!match) {
        return
      }

      lastChild.value = String(lastChild.value).slice(0, -match[0].length).trimEnd()
      if (!lastChild.value) {
        node.children.pop()
      }

      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...((node.data?.hProperties ?? {}) as Record<string, unknown>),
          id: match[1],
        },
      }
    })
  }
}

function remarkHighlights() {
  return (tree: any) => {
    ;(findAndReplace as any)(tree, [
      [
        highlightRegex,
        (_value: string, inner: string) => ({
          type: "html",
          value: `<mark class="text-highlight">${inner}</mark>`,
        }),
      ],
    ])
  }
}

function resolveEmbedNode({
  currentRelativePath,
  runtime,
  targetPath,
  anchor,
  alias,
}: {
  currentRelativePath: string
  runtime: BlogRuntime
  targetPath: string
  anchor: string
  alias?: string
}) {
  const assetUrl = runtime.resolveAssetLink(currentRelativePath, targetPath)
  if (assetUrl) {
    const extension = path.extname(targetPath).toLowerCase()
    if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp"].includes(extension)) {
      const match = wikilinkImageEmbedRegex.exec(alias ?? "")
      return {
        type: "image",
        url: assetUrl,
        alt: match?.groups?.alt?.trim() || path.basename(targetPath),
        data: {
          hProperties: {
            width: match?.groups?.width || undefined,
            height: match?.groups?.height || undefined,
          },
        },
      }
    }

    if ([".mp4", ".webm", ".ogv", ".mov", ".mkv"].includes(extension)) {
      return {
        type: "html",
        value: `<video controls src="${assetUrl}" class="article-media"></video>`,
      }
    }

    if ([".mp3", ".wav", ".m4a", ".ogg", ".flac"].includes(extension)) {
      return {
        type: "html",
        value: `<audio controls src="${assetUrl}" class="article-media"></audio>`,
      }
    }

    if (extension === ".pdf") {
      return {
        type: "html",
        value: `<iframe src="${assetUrl}" class="article-pdf"></iframe>`,
      }
    }
  }

  const resolved = runtime.resolveNoteLink(currentRelativePath, targetPath)
  if (!resolved) {
    return null
  }

  return {
    type: "link",
    url: `${resolved.url}${anchor}`,
    children: [{ type: "text", value: alias || resolved.label }],
  }
}

function humanizeCalloutType(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}
