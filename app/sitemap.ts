import type { MetadataRoute } from "next"

import { getNoteManifest } from "@/lib/notes/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const manifest = await getNoteManifest()
  // /blog redirects to an article; only include pages with their own canonical URL.
  const routes = new Set([
    "/",
    "/projects",
    "/music",
    "/anime",
    "/chatter",
    "/friends",
    "/about",
    ...manifest.folders.blog,
    ...manifest.folders.chatter,
    ...Object.keys(manifest.artifacts),
  ])

  return [...routes]
    .filter((route) => !Object.hasOwn(manifest.aliases, route))
    .map((route) => ({ url: new URL(route, "https://nothing-new.cn").href }))
}
