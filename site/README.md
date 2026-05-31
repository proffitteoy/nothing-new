# site

`site/` 是新的 Next.js 主站应用。

## 目标

- 用更成熟的应用架构承接个人主页与博客。
- 保留 `content/` 作为独立内容层，而不是继续把站点结构绑定在 Quartz 上。
- 只实现真实需要的 Obsidian 语法兼容，而不是整体复用 Quartz 的页面系统。

## 当前实现

- `app/page.tsx`
  主站首页。
- `app/blog/page.tsx`
  博客列表页。
- `app/[...slug]/page.tsx`
  文章详情页，保留按内容 slug 访问。
- `app/blog/tag/[...tag]/page.tsx`
  标签归档页。
- `app/content/[...asset]/route.ts`
  直接从仓库根目录 `content/` 提供图片、音频、视频和 PDF。
- `lib/blog/`
  内容索引、slug 规则和 Markdown 渲染。

## 安装与运行

```bash
npm install
npm run dev
```

## 已知限制

- 这套主站还没有做完整构建验证，因为当前线程里 `npm install` 需要额外放行。
- `content/` 资源目前通过 Next route handler 提供，部署时要确保运行环境能访问仓库内的内容文件。
