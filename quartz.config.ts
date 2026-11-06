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
    pageTitle: "\u4e3a\u5b66\u65e5\u76ca\uff0c\u4e3a\u9053\u65e5\u635f",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-CN",
    baseUrl: "nothing-new.cn",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        title: "Playfair Display",
        header: "Noto Serif SC",
        body: "Noto Serif SC",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#f4f8ff",
          lightgray: "#bdd0e7",
          gray: "#526b88",
          darkgray: "#17324f",
          dark: "#17324f",
          secondary: "#245fc5",
          tertiary: "#167ca6",
          highlight: "rgba(36, 95, 197, 0.14)",
          textHighlight: "#8dbbff66",
        },
        darkMode: {
          light: "#12243b",
          lightgray: "#314e70",
          gray: "#a6bedb",
          darkgray: "#e5f0ff",
          dark: "#e5f0ff",
          secondary: "#8dbbff",
          tertiary: "#79cbe8",
          highlight: "rgba(141, 187, 255, 0.16)",
          textHighlight: "#245fc566",
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
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
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
