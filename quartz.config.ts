import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "\u4e3a\u5b66\u65e5\u76ca\uff0c\u4e3a\u9053\u65e5\u635f",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-CN",
    baseUrl: "math-vault",
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
          light: "#f3f0ea",
          lightgray: "#ddd5c9",
          gray: "#8f8578",
          darkgray: "#463f35",
          dark: "#2b251d",
          secondary: "#3d5a80",
          tertiary: "#5d7c9a",
          highlight: "rgba(61, 90, 128, 0.14)",
          textHighlight: "#ffe08a88",
        },
        darkMode: {
          light: "#1a1c20",
          lightgray: "#343a44",
          gray: "#7f8998",
          darkgray: "#d3d8e0",
          dark: "#f2f4f7",
          secondary: "#9ab5d8",
          tertiary: "#7ea4c4",
          highlight: "rgba(154, 181, 216, 0.16)",
          textHighlight: "#e5cb4a88",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
