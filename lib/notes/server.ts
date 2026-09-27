import "server-only"

import fs from "node:fs/promises"
import path from "node:path"
import { cache } from "react"

import type { NoteArtifact, NoteManifest, NoteSection } from "./types"

const noteCacheRoot = path.join(process.cwd(), ".quartz-cache", "next")

export function decodeNotePath(pathSegments: string[]) {
  return pathSegments.map((segment) => {
    try {
      return decodeURIComponent(segment)
    } catch {
      return segment
    }
  })
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T
}

export const getNoteManifest = cache(async () =>
  readJson<NoteManifest>(path.join(noteCacheRoot, "manifest.json")),
)

const readArtifact = cache(async (relativePath: string) =>
  readJson<NoteArtifact>(path.join(noteCacheRoot, relativePath)),
)

export async function getNoteByRoute(route: string): Promise<NoteArtifact | null> {
  const manifest = await getNoteManifest()
  const canonicalRoute = manifest.aliases[route] ?? route
  const artifactPath = manifest.artifacts[canonicalRoute]
  return artifactPath ? readArtifact(artifactPath) : null
}

export async function getSectionNotes(section: NoteSection): Promise<NoteArtifact[]> {
  const manifest = await getNoteManifest()
  const entries = Object.entries(manifest.artifacts).filter(([route]) =>
    route.startsWith(`/${section}/`),
  )
  const notes = await Promise.all(entries.map(([, artifactPath]) => readArtifact(artifactPath)))
  return notes.sort((left, right) => {
    const leftDate = left.dates.modified ?? left.dates.created ?? ""
    const rightDate = right.dates.modified ?? right.dates.created ?? ""
    return rightDate.localeCompare(leftDate) || left.title.localeCompare(right.title, "zh-CN")
  })
}

export async function getFolderNotes(section: NoteSection, route: string): Promise<NoteArtifact[]> {
  const notes = await getSectionNotes(section)
  const prefix = `${route.replace(/\/$/, "")}/`
  return notes.filter((note) => note.route.startsWith(prefix) && note.route !== route)
}

export async function getStaticNoteParams(section: NoteSection) {
  const manifest = await getNoteManifest()
  const routes = new Set([
    ...Object.keys(manifest.artifacts),
    ...manifest.folders[section],
    ...Object.keys(manifest.aliases),
  ])
  return [...routes]
    .filter((route) => route.startsWith(`/${section}/`))
    .map((route) => ({ path: route.split("/").filter(Boolean).slice(1) }))
}

export async function isFolderRoute(section: NoteSection, route: string) {
  const manifest = await getNoteManifest()
  return manifest.folders[section].includes(route)
}

export async function getCanonicalRoute(route: string) {
  const manifest = await getNoteManifest()
  return manifest.aliases[route] ?? route
}

export const getBlogEntryRoute = cache(async () => {
  const notes = await getSectionNotes("blog")
  const first =
    notes.find((note) => note.route === "/blog/math/Fubini-Tonelli定理") ??
    notes.find((note) => note.text.trim().length >= 300)
  return first ? encodeURI(first.route) : "/blog"
})
