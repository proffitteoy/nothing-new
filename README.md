# 个人站点仓库

这个仓库正在从 `Quartz + 单独 Astro 作品集` 迁移到新的 `Next.js` 主站架构。

当前目录职责：

- `site/`
  新的主站应用。首页、博客列表、文章页、主题切换和内容路由都在这里。
- `content/`
  继续作为 Obsidian 同步后的内容源，供 `site/` 直接读取。
- `quartz/`
  旧的 Quartz 代码，暂时保留为历史兼容和回滚参考。
- `my-portfolio/`
  旧的 Astro 作品集实现，后续会被 `site/` 逐步吸收。
- `scripts/obsidian-sync.mjs`
  Obsidian 到 `content/` 的同步脚本，继续沿用。

## 常用命令

先安装新主站依赖：

```bash
cd site
npm install
```

然后在仓库根目录运行：

```bash
npm run dev
npm run build
npm run start
```

这些命令现在都会转发到 `site/`。

如果还需要运行旧版 Quartz：

```bash
npm run legacy:quartz:dev
npm run legacy:quartz:build
```

## 内容层说明

- 博客内容直接来自 `content/`。
- 新主站内置了最小必需的 Obsidian 语法支持：
  - `[[wikilink]]`
  - `![[图片/媒体嵌入]]`
  - Obsidian callout
  - KaTeX 数学公式
  - frontmatter / tags
- 旧 Quartz 的搜索、图谱、发射器和布局系统不再作为主站架构基础。

## 迁移状态

- 已建立新的 `site/` Next.js 主站骨架。
- 已接入首页、博客列表、文章详情、标签页和 `content/` 资源路由。
- 依赖安装与构建验证仍需要对 `site/` 执行 `npm install`。
