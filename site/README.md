# Next 主站

这个目录是 `F:\my blog` 仓库里的 Next.js 主站壳子，负责首页、项目、音乐、杂谈、博客、友链和关于页面。

博客正文仍然来自仓库根目录的 `content/`，并由原版 Quartz 渲染。根目录执行 `npm run build` 时会先运行：

```bash
npm run quartz:build:site
```

它会把 Quartz 静态站生成到 `site/public/blog/`，主站里的“博客”和“杂谈”页面再以内嵌页面方式加载 `/blog/` 与 `/blog/misc/`。

## 常用命令

在仓库根目录执行：

```bash
npm run dev
npm run build
npm run start
```

如果只想重新生成 Quartz 子站：

```bash
npm run quartz:build:site
```
