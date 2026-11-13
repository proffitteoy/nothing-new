# Scripts

本目录存放仓库自动化脚本。除特别说明外，脚本都假设从仓库根目录运行。

## 目录说明

- `home-scene-preview.py`：首页总装、边缘交互、谱场与移动分流验证；详见[首页总装](../docs/project/home-scene.md)。
- `celestial-preview.py`：已退役的 #49 入口，旧选项明确报停，不再生成或清理 Next 路由；历史来源与当前替代检查见[日月记录](../docs/project/home-mode-panels.md)。
- `profile-preview.py`：#47 首页个人信息退场与联系操作测试，详见[个人区调整](../docs/project/profile-renewal.md)。
- `home-music-preview.py`：#48 音乐控制与舞台歌词测试，详见[音乐](../docs/project/home-music-renewal.md)。
- `projects-preview.py`：#52 研究小屋与六项目交互测试；`npm run test:projects`，详见[项目页](../docs/project/projects-room.md)。
- `about-preview.py`：关于页三章节、索引与滚动定位的响应式检查，详见[关于页结构](../docs/project/about-restructure.md)。
- `chatter-preview.py`：#55 杂谈图版、搜索和跳转测试；`npm run test:chatter`，详见[杂谈](../docs/project/chatter-magazine.md)。

- `friends-preview.py`：#57 的可选 Python Playwright 验收，`npm run test:friends` 检查原位覆盖、按需加载、全部友链与申请操作。默认只写忽略目录 `.sync/tmp-friends-evidence/`；显式加 `--capture-homepages` 才会访问公开友链并更新 `public/friends-previews/` 的首页快照及来源清单。[使用说明](../docs/project/friends-preview.md)。

- `paper-monitor-preview.py`：可选 Python Playwright 验收周报封面、单列目录和双层阅读，`npm run test:papers` 执行交互检查；[使用说明](../docs/project/tda-paper-monitor.md)。原始截图和检查记录写入 Git 忽略的 `.sync/tmp-paper-monitor/`；`--compare` 会更新两张入库的压缩对照图，不修改业务数据或线上状态。

- `navigation-preview.py`：使用可选的 Python Playwright 截取八个栏目，并检查桌面／手机导航；运行 `npm run test:navigation` 前先按[导航验收说明](../docs/project/navigation-renewal.md)安装浏览器依赖。仅在本地写入已被 Git 忽略的 `docs/images/navigation-renewal/` 截图，不改业务数据或线上环境。

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

`npm run build` 依次执行 Quartz 内容构建和 Next 生产构建，不会自动运行 images:sync。公开站点图片使用 `public/` 和构建附件的静态/CDN 分发。`images:sync` 作为显式历史维护入口保留：配置 Blob 时仅上传内容哈希变化的图片并更新 `images/manifest.json`。images:dry 可在无 Blob 配置时盘点范围，images:check 需要 Blob 凭据且只检查、不写入。

`npm run notes:build` 固定输出 `.quartz-cache/next/` 与 `public/quartz-assets/`。已取消无实际输出作用的 `-o/--output` 参数；`--directory`、`--verbose` 和 `--concurrency` 继续可用。

## 维护约定

- covers:assign 会按需修改 content/misc 下 Markdown 的 cover 字段；封面池只读取 public/chatter-covers/，不会复制或改动图片。
- images:sync 会写入私有 Blob，但不会修改或删除本地图片；`/assets/**` 保留历史兼容路由，不能理解为所有旧图片 URL 都有 rewrite。`/avatar` 仍重写至 `/avatar.jpg`。
- 新增跨平台脚本放在 `scripts/` 根下，并在 `package.json` 暴露 npm 命令。
- 常用 Windows 双击包装脚本保留在仓库根目录，减少路径和编码问题。
- 脚本如果会写入 `content/`、`.sync/` 或 git 状态，文档里必须说明副作用。
- Windows 批处理脚本应先 `cd /d "%~dp0"` 回到仓库根目录，避免从其他目录运行失败。
