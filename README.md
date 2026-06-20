# 个人博客仓库

这个仓库现在同时保存写作内容、原版 Quartz 和 Next.js 主站。

## 目录职责

- `content/`：博客与笔记正文，继续作为日常写作目录。
- `quartz/`：原版 Quartz 引擎，负责把 `content/` 渲染成静态博客。
- `app/`、`components/`、`data/`：Next.js 主站，包含首页、项目、音乐、杂谈、博客、友链和关于页面。
- `public/blog/`：构建时生成的 Quartz 静态站，不需要手动维护。

## 常用命令

在仓库根目录执行：

```bash
npm run dev
npm run build
npm run start
```

`npm run dev` 和 `npm run build` 都会先执行：

```bash
npm run quartz:build:site
```

它会从 `content/` 生成原版 Quartz 页面到 `public/blog/`，然后 Next 主站通过“博客”内嵌访问 `/blog/`，并让“杂谈”直接展示 `misc` 下的第一篇顶层文章。

## Vercel 部署

在 Vercel 中导入这个仓库时，Root Directory 保持仓库根目录即可，不要设为 `site`。

- 根 `package.json` 同时包含 Quartz 和 Next.js 依赖。
- 构建前从根目录 `content/` 生成 Quartz 静态站。
- 然后构建并部署根目录里的 Next.js 主站。

日常写博客只需要维护 `content/`，不需要手动复制 Quartz 产物。
