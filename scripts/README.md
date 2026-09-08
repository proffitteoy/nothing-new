# Scripts

本目录存放仓库自动化脚本。除特别说明外，脚本都假设从仓库根目录运行。

## 目录说明

- assign-chatter-covers.mjs：为 content/misc/ 杂谈写入封面；正文有图片时使用第一张，否则从 public/chatter-covers/ 随机分配。
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
```

运行 npm run sync:obsidian 时，会在同步成功后自动重新分配杂谈封面。分配结果会写入各篇 Markdown 的顶部 frontmatter；同一轮会先用完不重复的目录图片，图片数量不足时才循环复用，并避免相邻两次分到同一张图。covers:dry 只预览随机结果，covers:check 只检查当前分配。

## 维护约定

- covers:assign 会修改 content/misc/\*_/_.md 的 cover 字段；封面池只读取 public/chatter-covers/，不会复制或改动图片。
- 新增跨平台脚本放在 `scripts/` 根下，并在 `package.json` 暴露 npm 命令。
- 常用 Windows 双击包装脚本保留在仓库根目录，减少路径和编码问题。
- 脚本如果会写入 `content/`、`.sync/` 或 git 状态，文档里必须说明副作用。
- Windows 批处理脚本应先 `cd /d "%~dp0"` 回到仓库根目录，避免从其他目录运行失败。
