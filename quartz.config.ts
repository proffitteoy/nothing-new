import { QuartzConfig } from "./quartz/cfg"
import { ComponentResources } from "./quartz/plugins/emitters/componentResources"
import { NextContentArtifacts } from "./quartz/plugins/emitters/nextContent"
import { RemoveDrafts } from "./quartz/plugins/filters/draft"
import { Description } from "./quartz/plugins/transformers/description"
import { FrontMatter } from "./quartz/plugins/transformers/frontmatter"
import { GitHubFlavoredMarkdown } from "./quartz/plugins/transformers/gfm"
import { CreatedModifiedDate } from "./quartz/plugins/transformers/lastmod"
import { Latex } from "./quartz/plugins/transformers/latex"
import { CrawlLinks } from "./quartz/plugins/transformers/links"
import { ObsidianFlavoredMarkdown } from "./quartz/plugins/transformers/ofm"
import { SyntaxHighlighting } from "./quartz/plugins/transformers/syntax"
import { TableOfContents } from "./quartz/plugins/transformers/toc"

const config: QuartzConfig = {
  configuration: {
    locale: "zh-CN",
    ignorePatterns: ["private", "templates", ".obsidian"],
    theme: {
      typography: {
        title: "Playfair Display",
        header: "Noto Serif SC",
        body: "Noto Serif SC",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#eef2f6",
          lightgray: "#ced7e0",
          gray: "#5c646d",
          darkgray: "#1e2226",
          dark: "#1e2226",
          secondary: "#1e5b73",
          tertiary: "#26714f",
          highlight: "rgba(30, 91, 115, 0.12)",
          textHighlight: "#deedf299",
        },
      },
    },
  },
  plugins: {
    transformers: [
      FrontMatter(),
      CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      SyntaxHighlighting({
        theme: "github-light",
        keepBackground: false,
      }),
      ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false, mermaid: false }),
      GitHubFlavoredMarkdown(),
      TableOfContents(),
      CrawlLinks({ markdownLinkResolution: "shortest" }),
      Description(),
      Latex({ renderEngine: "katex" }),
    ],
    filters: [RemoveDrafts()],
    emitters: [ComponentResources(), NextContentArtifacts()],
  },
}

export default config
