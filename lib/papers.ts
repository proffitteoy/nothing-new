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
import { renderToString } from "katex"

export type PaperReport = {
  date: string
  introduction: string
  conclusion: string
  papers: {
    title: string
    priority: string
    url: string | null
    html: string
    authors?: string[]
    year?: string
  }[]
}

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)

// Imported abstracts and reports also contain TeX prose and formulas without dollar delimiters.
// Work on source ranges so code, existing math and explicit link destinations stay byte-for-byte intact.
export function normalizePaperMarkdown(markdown: string): string {
  const protectedRanges: [number, number][] = []
  visit(parser.parse(markdown), (node) => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    if (start === undefined || end === undefined) return
    if (
      ["code", "inlineCode", "math", "inlineMath", "html", "definition"].includes(node.type) ||
      (["link", "image", "linkReference", "imageReference"].includes(node.type) &&
        /^[!\[<]/.test(markdown.slice(start, end)))
    ) {
      protectedRanges.push([start, end])
    }
  })

  function formula(value: string, explicit = false, parenthesized = false): string | null {
    const math = value
      .trim()
      .replace(/^øverline(?=[A-Z])/, "\\overline ")
      .replace(
        /(?<![\\A-Za-z])(mathbb|mathcal|mathbf|mathrm|alpha|beta|gamma|delta|epsilon|theta|lambda|sigma|omega|xi|ln)\b/g,
        "\\$1",
      )
      .replace(/\^\(([^()\n]+)\)/g, "^{$1}")
      .replace(/_([A-Z]{2,3})\b/g, "_{$1}")
    if (!math || /[$\n]/.test(math)) return null
    if (/[=<>≤≥≠∈∉⊂⊆→←↦≈≃±×+*/^_]$/.test(math)) return null
    if (!explicit) {
      if (
        !/[\\_^=<>≤≥≠∈∉⊂⊆→←↦≈≃±×]/.test(math) &&
        !(parenthesized && /^(?:[A-Za-z](?:,\s*[A-Za-z])*|[[(][A-Za-z0-9,. /+-]+[)\]])$/.test(math))
      )
        return null
      const words = math.replace(/\\[A-Za-z]+|(?<=[_^])[A-Za-z]/g, "").match(/[A-Za-z]{2,}/g) ?? []
      if (words.some((word) => !/^(?:[A-Z]{2,3}|Re|dim|rank|vol|log|sin|cos|exp)$/.test(word)))
        return null
    }
    try {
      renderToString(math, { throwOnError: true, strict: "ignore", trust: false })
      return `$${math}$`
    } catch {
      // An unknown command or incomplete formula stays readable; never guess missing mathematics.
      return null
    }
  }

  function clean(text: string): string {
    text = text
      .replace(/\\(emph|textit|textbf)\{([^{}\n]+)\}/g, (_, command, value) =>
        command === "textbf" ? `**${value}**` : `*${value}*`,
      )
      .replace(/\{([^\x00-\x7f])\}/g, "$1")
      .replace(/([\p{Script=Han}])\r?\n(?=[\p{Script=Han}])/gu, "$1")
    let output = ""
    for (let index = 0; index < text.length; ) {
      const rest = text.slice(index)
      const url = /^https?:\/\/[^\s<>"，。；：、！？（）【】「」*]+/.exec(rest)?.[0]
      if (url) {
        let end = url.length
        while (/[.,;:!?]$/.test(url.slice(0, end))) end--
        while (
          /[)\]]$/.test(url.slice(0, end)) &&
          (url.slice(0, end).match(/[)\]]/g)?.length ?? 0) >
            (url.slice(0, end).match(/[(\[]/g)?.length ?? 0)
        )
          end--
        output += `<${url.slice(0, end)}>`
        index += end
        continue
      }
      const legacy = /^\\\(([\s\S]{1,2000}?)\\\)|^\\\[([\s\S]{1,2000}?)\\\]/.exec(rest)
      if (legacy) {
        const rendered = formula((legacy[1] ?? legacy[2]).replace(/\r?\n/g, " "), true)
        output += rendered
          ? legacy[2] === undefined
            ? rendered
            : `\n\n$$\n${rendered.slice(1, -1)}\n$$\n\n`
          : legacy[0]
        index += legacy[0].length
        continue
      }
      if (/^\\[([]/.test(rest)) {
        const end = rest.indexOf("\n") < 0 ? rest.length : rest.indexOf("\n")
        output += rest.slice(0, end)
        index += end
        continue
      }
      // Some imported TeX uses a lone backslash on each side of a symbol or expression.
      const wrapped = /^\\((?:[A-Za-z](?![A-Za-z])|øverline)[^\n]{0,300}?)\\(?=[\s,.;:]|$)/.exec(
        rest,
      )
      if (wrapped) {
        const rendered = formula(wrapped[1], true)
        if (rendered) {
          output += rendered
          index += wrapped[0].length
          continue
        }
      }
      if (text[index] === "(") {
        const enumeration = /^\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\)(?=\s+[A-Za-z])/i.exec(rest)
        if (enumeration) {
          output += enumeration[0]
          index += enumeration[0].length
          continue
        }
        let depth = 1
        let end = index + 1
        for (; end < text.length && end - index < 400 && depth <= 16; end++) {
          if (text[end] === "\n") break
          if (/[({\[]/.test(text[end])) depth++
          if (/[)}\]]/.test(text[end]) && --depth === 0) break
        }
        if (depth === 0) {
          const rendered = formula(text.slice(index + 1, end), false, true)
          if (rendered) {
            output += rendered
            index = end + 1
            continue
          }
        }
      }
      if (rest.startsWith("\\ ")) {
        output += " "
        index += 2
        continue
      }
      const token =
        /^[\\A-Za-z0-9\p{Script=Greek}][\\A-Za-z0-9\p{Script=Greek}_^{}()[\]=<>≤≥≠∈∉⊂⊆→←↦≈≃±×+*/.,:;-]*/u.exec(
          rest,
        )?.[0]
      if (token) {
        let end = token.length
        if (token.endsWith("\\") && text[index + end] === " ") end--
        while (/[.,;:]$/.test(token.slice(0, end))) end--
        while (
          /[)\]]$/.test(token.slice(0, end)) &&
          (token.slice(0, end).match(/[)\]]/g)?.length ?? 0) >
            (token.slice(0, end).match(/[(\[]/g)?.length ?? 0)
        )
          end--
        const value = token.slice(0, end)
        // Flattened publisher MathML (e.g. ∑n=0∞) cannot be reconstructed from plain text.
        const adjacentMath =
          /[∑∏∞]/.test(text[index - 1] ?? "") || /[∑∏∞]/.test(text[index + end] ?? "")
        output += adjacentMath ? value : (formula(value) ?? value)
        index += end || 1
        continue
      }
      output += text[index++]
    }
    return output
  }

  let end = 0
  let output = ""
  for (const [start, next] of protectedRanges.sort((a, b) => a[0] - b[0] || b[1] - a[1])) {
    if (start < end) continue
    output += clean(markdown.slice(end, start)) + markdown.slice(start, next)
    end = next
  }
  return output + clean(markdown.slice(end))
}
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
      const href = node.properties.href
      if (node.tagName === "a" && typeof href === "string" && !href.startsWith("#")) {
        node.properties.target = "_blank"
        node.properties.rel = ["noopener", "noreferrer"]
      }
    })
  })
  .use(rehypeKatex)
  .use(rehypeStringify)

async function render(children: RootContent[]) {
  const html = await renderer.run({ type: "root", children } as Root)
  return renderer.stringify(html)
}

export async function renderPaperMarkdown(markdown: string): Promise<string> {
  return render(parser.parse(normalizePaperMarkdown(markdown)).children)
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

      const tree = parser.parse(normalizePaperMarkdown(entry.markdown))
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
            if (!url) {
              visit({ type: "root", children: paper.children } as Root, "link", (node) => {
                if (!url && /^https:\/\/(?:dx\.)?doi\.org\//.test(node.url)) url = node.url
              })
            }
            return {
              title: paper.title,
              priority: /阅读优先级[：:\s]*([^。；;\n]+)/.exec(text)?.[1]?.trim() ?? "",
              url,
              html: await render(paper.children),
              authors:
                /作者[：:]\s*([^。\n]+)/
                  .exec(text)?.[1]
                  ?.trim()
                  .split(/[、；;]/)
                  .map((author) => author.trim())
                  .filter(Boolean) ?? [],
              year: /首次提交[：:\s]*(\d{4})/.exec(text)?.[1] ?? "",
            }
          }),
        ),
      }
    }),
  ).then((reports) => reports.sort((a, b) => b.date.localeCompare(a.date)))
}
