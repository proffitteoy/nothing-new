# 个人站点仓库

这个仓库现在按“双入口”维护：

- `site/` 是新的 Next.js 个人主站，用来承载首页、项目、音乐、杂谈、友链和关于页面。
- `content/` 仍然是 Obsidian 同步后的笔记内容源。
- `quartz/` 继续保留给 Quartz 笔记系统使用，不删除、不替代。需要时仍可运行 legacy Quartz 命令。
- `my-portfolio/` 是旧版 Astro 作品集，保留为资料来源和回滚参考。
- `scripts/obsidian-sync.mjs` 继续负责 Obsidian 到 `content/` 的同步。

## 常用命令

开发 Next 主站：

```bash
npm run dev
```

构建 Next 主站：

```bash
npm run build
```

启动已构建的 Next 主站：

```bash
npm run start
```

这些根目录命令会转发到 `site/`。

## Quartz 笔记系统

Quartz 仍然保留在仓库中，用于笔记系统相关能力：

```bash
npm run legacy:quartz:dev
npm run legacy:quartz:build
```

`content/` 仍是 Obsidian/Quartz/Next 主站共享的内容层。Next 主站只负责更适合 Vercel 的个人站入口和动态页面，不等于移除 Quartz。

## Vercel 部署

Vercel 项目保持仓库根目录部署：

```txt
Root Directory: ./
Framework Preset: Next.js
Install Command: npm install && npm install --prefix site
Build Command: npm run build
Output Directory: site/.next
```

根目录 `package.json` 保留 `next`、`react`、`react-dom` 的 devDependencies，用来让 Vercel 在根目录识别 Next.js 项目。实际构建依赖仍安装在 `site/`。

`site/next.config.ts` 已将 file tracing 根目录设为仓库根目录，并把 `content/` 纳入追踪范围，所以不要把 Vercel Root Directory 改成 `site/`。

## 内容层说明

主站直接读取 `content/` 中的 Markdown，并支持常用 Obsidian 语法：

- `[[wikilink]]`
- `![[图片/媒体嵌入]]`
- Obsidian callout
- KaTeX 数学公式
- frontmatter / tags

当前主站导航为：首页、项目、音乐、杂谈、友链、关于。完整笔记内容仍可通过博客/文章路由访问，Quartz 也继续保留。
