import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"

import "highlight.js/styles/atom-one-dark.css"
import "katex/dist/katex.min.css"

import PageTransition from "../../components/PageTransition"
import AboutClient from "../../components/AboutClient"
import styles from "../../components/AboutClient.module.css"

export const metadata = {
  title: "关于 | 阿的宝藏之地",
  alternates: { canonical: "/about" },
}

async function readAboutSection(filename: string) {
  const source = await fs.readFile(path.join(process.cwd(), "app", "about", filename), "utf8")
  const { content, data } = matter(source)
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHighlight, {
        detect: true,
        ignoreMissing: true,
        subset: [
          "cpp", "c", "python", "java", "javascript", "typescript",
          "go", "rust", "bash", "json", "html", "css", "sql", "xml",
        ],
      })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content),
  )
  return { html, cover: typeof data.cover === "string" ? data.cover : undefined }
}

export default async function AboutPage() {
  const [website, engineering, research] = await Promise.all([
    readAboutSection("about.md"),
    readAboutSection("engineering.md"),
    readAboutSection("research.md"),
  ])

  return (
    <div className={styles.page}>
      <PageTransition>
        <main className={styles.main}>
          <AboutClient
            websiteHtml={website.html}
            engineeringHtml={engineering.html}
            researchHtml={research.html}
            coverImage={website.cover ?? "/about-cover.png"}
          />
        </main>
      </PageTransition>
    </div>
  )
}
