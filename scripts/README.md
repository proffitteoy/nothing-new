# Scripts

本目录存放仓库自动化脚本。除特别说明外，脚本都假设从仓库根目录运行。

## 目录说明

- assign-chatter-covers.mjs：为 content/misc/ 杂谈分配并固定封面；正文有图片时使用第一张，否则从 public/chatter-covers/ 补充分配。
- `sync-image-assets.mjs`：把站点头像、背景、杂谈封面与构建后的 Quartz 文章图片增量同步到私有 Vercel Blob。
- `obsidian-sync.mjs`：把 Obsidian 源目录中的已批准内容同步到 `content/`。
- `../同步博客.bat`：Windows 双击入口，等价于在根目录运行 `npm.cmd run sync:obsidian`。
- `../审阅未决笔记.bat`：Windows 双击入口，等价于在根目录运行 `npm.cmd run sync:obsidian:review`。
- `../上传.bat`：旧的一键提交/推送入口，会执行 `git add .`、`git commit`、`git push origin main`，使用前先检查变更。

## npm 入口

```bash
npm run sync:obsidian
npm run sync:obsidian:dry
npm run sync:obsidian:check
npm run sync:obsidian:review
npm run sync:obsidian:review:all
npm run covers:assign
npm run covers:dry
npm run covers:check
npm run images:sync
npm run images:dry
npm run images:check
```

运行 npm run sync:obsidian 时，会在同步成功后自动补全杂谈封面。已经分配且没有重复的目录封面保持不变；新文章、正文新增首图、失效封面和可被新图片消除的重复封面才会更新。分配结果写入各篇 Markdown 的顶部 frontmatter。图片数量不足时允许保留重复，后续向封面目录加入新图片再运行即可逐步替换。covers:dry 只预览变化，covers:check 只检查当前分配。

`npm run build` 会在 Quartz 产物生成后自动运行 images:sync。配置 Blob 时只上传内容哈希变化的图片，并更新 `images/manifest.json`；未配置 Blob 的本地环境会跳过上传，继续使用 `public/` 静态文件。images:dry 可在无 Blob 配置时盘点范围，images:check 需要 Blob 凭据且只检查、不写入。

## 维护约定

- covers:assign 会按需修改 content/misc 下 Markdown 的 cover 字段；封面池只读取 public/chatter-covers/，不会复制或改动图片。
- images:sync 会写入私有 Blob，但不会修改或删除本地图片；站内旧 URL 由 Next.js 重写保持兼容，`/avatar` 与 `/avatar.jpg` 均继续可用。
- 新增跨平台脚本放在 `scripts/` 根下，并在 `package.json` 暴露 npm 命令。
- 常用 Windows 双击包装脚本保留在仓库根目录，减少路径和编码问题。
- 脚本如果会写入 `content/`、`.sync/` 或 git 状态，文档里必须说明副作用。
- Windows 批处理脚本应先 `cd /d "%~dp0"` 回到仓库根目录，避免从其他目录运行失败。
