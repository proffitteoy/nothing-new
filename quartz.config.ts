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
          light: "#ffffff",
          lightgray: "#d8dfeb",
          gray: "#627087",
          darkgray: "#29354b",
          dark: "#29354b",
          secondary: "#4266cf",
          tertiary: "#146d64",
          highlight: "rgba(66, 102, 207, 0.12)",
          textHighlight: "#e9def999",
        },
        darkMode: {
          light: "#1a2233",
          lightgray: "#354056",
          gray: "#abb6cb",
          darkgray: "#e6eaf3",
          dark: "#e6eaf3",
          secondary: "#a4b8ff",
          tertiary: "#70ccb6",
          highlight: "rgba(164, 184, 255, 0.14)",
          textHighlight: "#805ac855",
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
