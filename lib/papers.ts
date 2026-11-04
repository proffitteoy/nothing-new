import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"
import { toString } from "mdast-util-to-string"
import { visit } from "unist-util-visit"
import type { Root, RootContent } from "mdast"
import type { Root as HtmlRoot } from "hast"

export type PaperReport = {
  date: string
  introduction: string
  conclusion: string
  papers: { title: string; priority: string; url: string | null; html: string }[]
}

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
// Raw HTML is omitted. Explicitly filter URLs before rendering published Markdown.
const renderer = unified()
  .use(remarkRehype)
  .use(() => (tree: HtmlRoot) => {
    visit(tree, "element", (node) => {
      for (const key of ["href", "src"]) {
        const value = node.properties[key]
        if (typeof value !== "string") continue
        try {
          const protocol = new URL(value, "https://nothing-new.cn").protocol
          if (!["https:", "http:", "mailto:"].includes(protocol)) delete node.properties[key]
        } catch {
          delete node.properties[key]
        }
      }
    })
  })
  .use(rehypeKatex)
  .use(rehypeStringify)

async function render(children: RootContent[]) {
  const html = await renderer.run({ type: "root", children } as Root)
  return renderer.stringify(html)
}

export async function compilePaperReports(payload: unknown): Promise<PaperReport[]> {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > 52) {
    throw new Error("Expected 1–52 reports")
  }
  const dates = new Set<string>()
  return Promise.all(
    payload.map(async (entry) => {
      if (!entry || typeof entry.path !== "string" || typeof entry.markdown !== "string") {
        throw new Error("Each report needs a path and Markdown")
      }
      const date = /^reports\/(\d{4}-\d{2}-\d{2})\.md$/.exec(entry.path)?.[1]
      if (
        !date ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        dates.has(date)
      ) {
        throw new Error("Invalid or duplicate report date")
      }
      dates.add(date)
      if (
        entry.markdown.length > 200_000 ||
        !entry.markdown.startsWith(`# TDA 每周新论文报告｜${date}`)
      ) {
        throw new Error("Invalid report heading or report too large")
      }

      const tree = parser.parse(entry.markdown)
      const introduction: RootContent[] = []
      const conclusion: RootContent[] = []
      const papers: { title: string; children: RootContent[] }[] = []
      let active: (typeof papers)[number] | null = null
      for (const node of tree.children) {
        if (node.type === "heading" && node.depth === 1) continue
        if (node.type === "heading" && node.depth === 3 && /^\d+[.、]\s*/.test(toString(node))) {
          active = { title: toString(node).replace(/^\d+[.、]\s*/, ""), children: [] }
          papers.push(active)
        } else if (node.type === "heading" && node.depth === 2) {
          active = null
          // Group headings separate papers; preserve the actual concluding section.
          if (/综合|总结|结语/.test(toString(node))) conclusion.push(node)
        } else if (active) {
          active.children.push(node)
        } else {
          ;(papers.length ? conclusion : introduction).push(node)
        }
      }
      if (
        papers.length === 0 ||
        papers.some((paper) => !paper.title || paper.children.length === 0)
      ) {
        throw new Error("Report contains no readable numbered paper sections")
      }
      return {
        date,
        introduction: await render(introduction),
        conclusion: await render(conclusion),
        papers: await Promise.all(
          papers.map(async (paper) => {
            const text = paper.children.map((node) => toString(node)).join("\n")
            let url: string | null = null
            visit({ type: "root", children: paper.children } as Root, "link", (node) => {
              if (!url && /^https:\/\/arxiv\.org\/abs\//.test(node.url)) url = node.url
            })
            return {
              title: paper.title,
              priority: /阅读优先级[：:\s]*([^。；;\n]+)/.exec(text)?.[1]?.trim() ?? "",
              url,
              html: await render(paper.children),
            }
          }),
        ),
      }
    }),
  ).then((reports) => reports.sort((a, b) => b.date.localeCompare(a.date)))
}
