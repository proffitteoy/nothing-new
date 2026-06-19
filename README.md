# 个人博客仓库

这个仓库现在同时保存写作内容、原版 Quartz 和 Next.js 主站。

## 目录职责

- `content/`：博客与笔记正文，继续作为日常写作目录。
- `quartz/`：原版 Quartz 引擎，负责把 `content/` 渲染成静态博客。
- `site/`：Next.js 主站，包含首页、项目、音乐、杂谈、博客、友链和关于页面。
- `site/public/blog/`：构建时生成的 Quartz 静态站，不需要手动维护。

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

它会从 `content/` 生成原版 Quartz 页面到 `site/public/blog/`，然后 Next 主站通过“博客”和“杂谈”标签页内嵌访问 `/blog/` 与 `/blog/misc/`。

## Vercel 部署

在 Vercel 中导入这个仓库时，建议将 Root Directory 设为 `site`。`site/vercel.json` 已经配置了安装和构建命令：

- 安装根 Quartz 依赖和 `site` 主站依赖。
- 构建前从根目录 `content/` 生成 Quartz 静态站。
- 构建并部署 `site` 里的 Next.js 主站。

日常写博客只需要维护 `content/`，不需要手动复制 Quartz 产物。
