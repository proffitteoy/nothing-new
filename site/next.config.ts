import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

const siteRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(siteRoot, "..")

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    "/*": ["../content/**/*"],
    "/content/[...asset]": ["../content/**/*"],
  },
}

export default nextConfig
