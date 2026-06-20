# 个人博客仓库

这个仓库把 Next.js 主站、Quartz 博客渲染和 Obsidian 写作同步放在同一个根目录。日常优先维护 `content/`、`app/`、`components/`、`data/` 和项目文档，不要手动改构建产物。

## 目录职责

- `app/`：Next.js 16 App Router 页面，包含首页、博客入口、杂谈、项目、音乐、友链和关于页。
- `components/`、`data/`、`public/`：主站组件、静态数据和公开资源；`public/blog/` 是构建产物。
- `content/`：Quartz 博客正文和同步后的公开笔记；如果使用 Obsidian 同步，不要把它当主编辑目录。
- `quartz/`、`quartz.config.ts`、`quartz.layout.ts`：原版 Quartz 引擎和博客渲染配置。
- `docs/`：上游 Quartz 文档为主；本仓库专属说明集中放在 `docs/project/`。
- `scripts/`：自动化脚本；根目录 `.bat` 是 Windows 双击入口。
- `my-portfolio/`：独立/旧 Astro 作品集项目，根站构建不会自动使用它。

## 常用命令

首次安装依赖：

```bash
npm install
```

本地开发、构建和启动：

```bash
npm run dev
npm run build
npm run start
```

质量检查：

```bash
npm run lint
npm run typecheck
```

`npm run dev` 和 `npm run build` 都会先执行 `npm run quartz:build:site`，从 `content/` 生成 Quartz 静态站到 `public/blog/`，再启动或构建 Next.js 主站。

## 博客与同步

- 日常写博客优先维护 Obsidian 源目录，然后运行 `npm run sync:obsidian` 同步到 `content/`。
- 只想预览同步影响时运行 `npm run sync:obsidian:dry`。
- 只想检查是否有差异时运行 `npm run sync:obsidian:check`。
- 同步规则和工作流见 `docs/project/obsidian-sync.md`。
- 脚本入口和 Windows 批处理说明见 `scripts/README.md`。

## Vercel 部署

在 Vercel 中导入这个仓库时，Root Directory 保持仓库根目录即可，不要设为 `site`。

- 根目录 `package.json` 同时包含 Quartz 和 Next.js 依赖。
- 构建时先从根目录 `content/` 生成 Quartz 静态站。
- 然后构建并部署根目录里的 Next.js 主站。

日常写博客只需要维护写作源和同步规则，不需要手动复制 Quartz 产物。
