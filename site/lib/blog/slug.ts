import { slug as slugAnchor } from "github-slugger"

function sluggifySegment(segment: string) {
  return segment
    .replace(/\s/g, "-")
    .replace(/&/g, "-and-")
    .replace(/%/g, "-percent")
    .replace(/\?/g, "")
    .replace(/#/g, "")
}

export function toPosix(value: string) {
  return value.replaceAll("\\", "/")
}

export function stripExtension(value: string) {
  return value.replace(/\.[A-Za-z0-9]+$/, "")
}

export function slugifyPath(relativePath: string) {
  const normalized = toPosix(relativePath).replace(/^\/+/, "").replace(/\/+$/, "")
  const withoutExt = stripExtension(normalized)
  return withoutExt
    .split("/")
    .filter(Boolean)
    .map(sluggifySegment)
    .join("/")
}

export function slugifyTag(tag: string) {
  return toPosix(tag)
    .split("/")
    .filter(Boolean)
    .map(sluggifySegment)
    .join("/")
}

export function normalizeLookupKey(value: string) {
  return slugifyPath(value).toLowerCase()
}

export function buildNoteUrl(slug: string) {
  if (slug === "index") {
    return "/blog"
  }

  if (slug.endsWith("/index")) {
    return `/${slug.slice(0, -"/index".length)}`
  }

  return `/${slug}`
}

export function splitAnchor(target: string): [string, string] {
  const [filePart, rawAnchor] = target.split("#", 2)
  if (!rawAnchor) {
    return [filePart, ""]
  }

  if (filePart.endsWith(".pdf")) {
    return [filePart, `#${rawAnchor}`]
  }

  if (rawAnchor.startsWith("^")) {
    return [filePart, `#${rawAnchor.slice(1)}`]
  }

  return [filePart, `#${slugAnchor(rawAnchor)}`]
}
