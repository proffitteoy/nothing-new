import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
}

export default nextConfig
