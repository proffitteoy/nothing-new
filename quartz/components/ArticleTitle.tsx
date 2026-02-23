import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
// @ts-ignore
import landingScript from "./scripts/landing.inline"

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
        <a
          class="scroll-down-entry"
          href="#main-content"
          aria-label="\u4e0b\u62c9\u67e5\u770b\u6b63\u6587"
        >
          {"\u5f00\u59cb\u9605\u8bfb"}
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

ArticleTitle.afterDOMLoaded = landingScript

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
