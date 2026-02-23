import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  const isHomePage = fileData.slug === "index"
  if (!title && !isHomePage) {
    return null
  }

  return (
    <div class={classNames(displayClass, "article-title-group")}>
      {title && <h1 class="article-title">{title}</h1>}
      {isHomePage && (
        <a class="scroll-down-entry" href="#main-content" aria-label="下拉查看正文">
          开始阅读
        </a>
      )}
    </div>
  )
}

ArticleTitle.css = `
.article-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.article-title-group > .article-title {
  margin: 2rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
