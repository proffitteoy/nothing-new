import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { Features, transform } from "lightningcss"
import { parse } from "postcss"

import { joinStyles } from "../../util/theme"
import type { FilePath } from "../../util/path"
import type { QuartzEmitterPlugin } from "../types"
import styles from "../../styles/custom.scss"

const require = createRequire(import.meta.url)
const katexCssPath = require.resolve("katex/dist/katex.min.css")
const katexFontDir = path.join(path.dirname(katexCssPath), "fonts")
const publicQuartzRoot = path.join(process.cwd(), "public", "quartz-assets")

function scopeSelector(selector: string): string {
  const trimmed = selector.trim()
  const themeRoot = trimmed.match(/^(?::root|html)\b/)

  if (themeRoot) {
    const remainder = trimmed
      .slice(themeRoot[0].length)
      .trim()
      .replace(/^body\b/, "")
      .trim()
    const scope = ".quartz-note"
    return remainder ? `${scope} ${remainder}` : scope
  }

  if (trimmed === "html" || trimmed === "body") return ".quartz-note"
  if (trimmed.startsWith("html ") || trimmed.startsWith("body ")) {
    return trimmed.replace(/^(?:html|body)\b/, ".quartz-note")
  }
  if (trimmed.startsWith(".page")) return `.quartz-note${trimmed}`
  return `.quartz-note ${trimmed}`
}

function scopeQuartzStyles(stylesheet: string): string {
  const root = parse(stylesheet)
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return
    rule.selectors = rule.selectors.map(scopeSelector)
  })
  return root.toString()
}

function compileStyles(source: string) {
  return transform({
    filename: "note.css",
    code: Buffer.from(source),
    minify: true,
    targets: {
      safari: (15 << 16) | (6 << 8),
      ios_saf: (15 << 16) | (6 << 8),
      edge: 115 << 16,
      firefox: 102 << 16,
      chrome: 109 << 16,
    },
    include: Features.MediaQueries,
  }).code.toString()
}

export const ComponentResources: QuartzEmitterPlugin = () => ({
  name: "ComponentResources",
  async *emit(ctx) {
    const katexStylesheet = await fs.promises.readFile(katexCssPath, "utf8")
    const stylesheet = joinStyles(ctx.cfg.configuration.theme, "", katexStylesheet, styles)

    await fs.promises.mkdir(publicQuartzRoot, { recursive: true })
    const noteCssPath = path.join(publicQuartzRoot, "note.css")
    await fs.promises.writeFile(noteCssPath, compileStyles(scopeQuartzStyles(stylesheet)))
    yield noteCssPath as FilePath

    for (const fontFile of await fs.promises.readdir(katexFontDir)) {
      const source = path.join(katexFontDir, fontFile)
      const destination = path.join(publicQuartzRoot, "fonts", fontFile)
      await fs.promises.mkdir(path.dirname(destination), { recursive: true })
      await fs.promises.copyFile(source, destination)
      yield destination as FilePath
    }
  },
})
