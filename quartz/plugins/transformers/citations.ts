import type { Root } from "hast"
import { PluggableList } from "unified"
import { visit } from "unist-util-visit"
import type { VFile } from "vfile"
import { QuartzTransformerPlugin } from "../types"

export interface Options {
  bibliographyFile: string
  suppressBibliography: boolean
  linkCitations: boolean
  csl: string
}

const defaultOptions: Options = {
  bibliographyFile: "./bibliography.bib",
  suppressBibliography: false,
  linkCitations: false,
  csl: "apa",
}

export const Citations: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "Citations",
    htmlPlugins(ctx) {
      const plugins: PluggableList = []

      // rehype-citation imports deprecated Node.js modules at startup. Load it only when this
      // optional Quartz plugin is enabled so unused citation support stays out of normal builds.
      plugins.push(() => {
        return async (tree: Root, file: VFile) => {
          const { default: rehypeCitation } = await import("rehype-citation")
          const transform = rehypeCitation({
            bibliography: opts.bibliographyFile,
            suppressBibliography: opts.suppressBibliography,
            linkCitations: opts.linkCitations,
            csl: opts.csl,
            lang: ctx.cfg.configuration.locale ?? "en-US",
          })

          await transform(tree, file)
        }
      })

      // Transform the HTML of the citattions; add data-no-popover property to the citation links
      // using https://github.com/syntax-tree/unist-util-visit as they're just anochor links
      plugins.push(() => {
        return (tree, _file) => {
          visit(tree, "element", (node, _index, _parent) => {
            if (node.tagName === "a" && node.properties?.href?.startsWith("#bib")) {
              node.properties["data-no-popover"] = true
            }
          })
        }
      })

      return plugins
    },
  }
}
