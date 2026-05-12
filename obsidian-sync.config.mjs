export default {
  sourceRoot: "E:/math",
  targetRoot: "content",
  includeFile: ".sync/obsidian-sync.include.txt",
  excludeFile: ".sync/obsidian-sync.exclude.txt",
  stateFile: ".sync/obsidian-sync-state.json",
  reviewPatterns: ["**/*.md"],
  defaultIgnores: [
    ".obsidian/**",
    "**/.obsidian/**",
    "笔记共享vault/**",
    "**/笔记共享vault/**",
  ],
  extraIncludes: [
    // 默认按字面路径处理；只有带 glob: 前缀时才按通配符处理。
    // "math/新文章.md",
    // "glob: 图片/**/*",
  ],
  extraExcludes: [
    // "misc/private/草稿.md",
    // "glob: **/未命名*.md",
  ],
}
