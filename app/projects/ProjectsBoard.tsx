import fs from "fs"
import path from "path"
import { unified } from "unified"
import type { Element, Properties, Root } from "hast"
import { visit } from "unist-util-visit"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import BackButton from "../../components/BackButton"

const PROFILE_REPO_URL = "https://github.com/proffitteoy/proffitteoy"
const PROFILE_README_RAW_BASE = "https://raw.githubusercontent.com/proffitteoy/proffitteoy/main/"
const PROFILE_README_BLOB_BASE = "https://github.com/proffitteoy/proffitteoy/blob/main/"

type ReadmeSource = "local"

function readLocalReadme() {
  const readmePath = path.join(process.cwd(), "data", "proffitteoy-readme.md")
  try {
    return fs.readFileSync(readmePath, "utf8")
  } catch {
    return "# 项目矩阵\n\n项目说明暂未找到。"
  }
}

async function loadProjectsReadme(): Promise<{ markdown: string; source: ReadmeSource }> {
  return { markdown: readLocalReadme(), source: "local" }
}

function getStringProperty(value: Properties[keyof Properties]) {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) return value.join(" ")
  return ""
}

function mergeClassName(value: Properties[keyof Properties], className: string) {
  const classNames = Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(/\s+/)
      : []

  return Array.from(new Set([...classNames.filter(Boolean), className]))
}

function githubBlobImageToRaw(src: string) {
  try {
    const url = new URL(src)
    const parts = url.pathname.split("/").filter(Boolean)
    const isProfileBlob =
      url.hostname === "github.com" &&
      parts[0] === "proffitteoy" &&
      parts[1] === "proffitteoy" &&
      parts[2] === "blob" &&
      parts.length > 4

    if (!isProfileBlob) return src

    const branch = parts[3]
    const filePath = parts.slice(4).join("/")
    return `https://raw.githubusercontent.com/proffitteoy/proffitteoy/${branch}/${filePath}${url.search}`
  } catch {
    return src
  }
}

function resolveReadmeUrl(value: Properties[keyof Properties], baseUrl: string, isImage = false) {
  const source = getStringProperty(value).trim()
  if (!source || source.startsWith("#") || source.startsWith("data:")) return source
  if (/^(mailto|tel):/i.test(source)) return source
  if (source.startsWith("//")) return `https:${source}`
  if (/^https?:\/\//i.test(source)) {
    return isImage ? githubBlobImageToRaw(source) : source
  }

  try {
    return new URL(source, baseUrl).toString()
  } catch {
    return source
  }
}

function isExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function enhanceReadmeElements() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      node.properties ||= {}

      if (["script", "iframe", "object", "embed"].includes(node.tagName)) {
        node.tagName = "template"
        node.children = []
        return
      }

      if (node.tagName === "img") {
        node.properties.src = resolveReadmeUrl(node.properties.src, PROFILE_README_RAW_BASE, true)
        node.properties.loading = "lazy"
        node.properties.decoding = "async"
        node.properties.referrerPolicy = "no-referrer"
        node.properties.alt = getStringProperty(node.properties.alt)
        node.properties.className = mergeClassName(node.properties.className, "github-readme-image")
      }

      if (node.tagName === "a") {
        const href = resolveReadmeUrl(node.properties.href, PROFILE_README_BLOB_BASE)
        node.properties.href = href

        if (isExternalUrl(href)) {
          node.properties.target = "_blank"
          node.properties.rel = "noopener noreferrer"
        }
      }
    })
  }
}

async function renderProjectsReadme(markdown: string) {
  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(enhanceReadmeElements)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return processed.toString()
}

export default async function ProjectsBoard() {
  const readme = await loadProjectsReadme()
  const contentHtml = await renderProjectsReadme(readme.markdown)

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-10 relative z-10">
      <div className="w-full flex justify-start mb-6">
        <BackButton />
      </div>

      <section className="mb-6 rounded-[1.75rem] bg-slate-950/90 border border-indigo-400/20 shadow-2xl overflow-hidden">
        <div className="p-5 md:p-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.32em] text-cyan-300 mb-4 uppercase">
              个人项目自述
            </p>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              项目矩阵
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-8 text-slate-300">
              这里整理常回看的项目、研究工具与个人知识库建设记录。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit items-center justify-center rounded-full border border-slate-400/30 bg-white/5 px-4 py-2 text-xs font-black text-slate-200">
              中文本地版
            </span>
            <a
              href={PROFILE_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-5 py-2 text-sm font-black text-cyan-100 transition-colors duration-300 hover:bg-cyan-300/20"
            >
              打开 GitHub
            </a>
          </div>
        </div>
      </section>

      <article className="rounded-[1.75rem] bg-slate-950/90 border border-indigo-400/20 shadow-2xl overflow-hidden p-4 md:p-8">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .github-readme { color: #e2e8f0; font-size: 0.98rem; overflow-wrap: anywhere; }
          .github-readme h1, .github-readme h2, .github-readme h3 { color: #f8fafc !important; margin-top: 2rem; margin-bottom: 1rem; letter-spacing: 0; }
          .github-readme h1 { font-size: clamp(2rem, 5vw, 3.35rem); line-height: 1.08; margin-top: 0; text-align: center; }
          .github-readme h2 { font-size: clamp(1.35rem, 3vw, 1.85rem); border-bottom: 1px solid rgba(148, 163, 184, 0.25); padding-bottom: 0.75rem; }
          .github-readme h3 { font-size: 1.2rem; }
          .github-readme p { margin: 1rem 0; line-height: 1.8; }
          .github-readme p[align="center"], .github-readme div[align="center"] { text-align: center; }
          .github-readme ul, .github-readme ol { margin: 1rem 0 1.5rem 1.25rem; line-height: 1.8; }
          .github-readme li { padding-left: 0.25rem; }
          .github-readme blockquote { margin: 1.5rem 0; border-left: 4px solid rgba(125, 211, 252, 0.7); padding: 0.5rem 0 0.5rem 1rem; color: #cbd5e1; background: rgba(14, 165, 233, 0.08); border-radius: 0.75rem; }
          .github-readme a { color: #7dd3fc; text-decoration: none; }
          .github-readme a:hover { color: #bae6fd; }
          .github-readme table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.5rem 0; overflow: hidden; border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.18); }
          .github-readme td, .github-readme th { border: 1px solid rgba(148, 163, 184, 0.14); padding: 1rem; vertical-align: top; }
          .github-readme th { color: #f8fafc; background: rgba(14, 165, 233, 0.1); }
          .github-readme tr { background: rgba(15, 23, 42, 0.18); }
          .github-readme code { color: #bae6fd; background: rgba(14, 165, 233, 0.12); border-radius: 0.35rem; padding: 0.1rem 0.35rem; }
          .github-readme pre { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(125, 211, 252, 0.18); border-radius: 1rem; padding: 1.25rem; overflow-x: auto; }
          .github-readme pre code { background: transparent; padding: 0; color: #c4b5fd; }
          .github-readme .github-readme-image { display: inline-block; max-width: min(100%, 760px); height: auto; vertical-align: middle; border-radius: 0.75rem; }
          .github-readme p > .github-readme-image:only-child { display: block; margin: 1rem auto; }
          .github-readme table .github-readme-image { max-width: 100%; border-radius: 0.6rem; }
          @media (max-width: 768px) {
            .github-readme h2 { font-size: 1.35rem; }
            .github-readme table, .github-readme tbody, .github-readme tr, .github-readme td { display: block; width: 100%; }
            .github-readme thead { display: none; }
            .github-readme td { padding: 0.85rem; }
          }
        `,
          }}
        />
        <div className="github-readme" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>
    </div>
  )
}
