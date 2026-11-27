# Scripts

本目录存放仓库自动化脚本。除特别说明外，脚本都假设从仓库根目录运行。

## 目录说明

- `home-scene-preview.py`：首页总装、边缘交互、谱场与移动分流验证；当前双侧导航与底部音乐使用 `--mode navigation` 验收，`--mode preload` 验证空缓存时七张预览图在开场期间加载、首次展开就绪且悬停不再请求，`--mode preview` 截取真实首页。`--mode snapshots` 会更新 `public/page-previews/` 六张本地新版页面截图；本地番剧服务不可用时只借用正式站公开真实快照和封面，不使用旧版线上页面或合成夹具。其他证据默认写入忽略目录 `.sync/tmp-home-scene-evidence/`。详见[首页总装](../docs/project/home-scene.md)。
- `celestial-preview.py`：已退役的 #49 入口，旧选项明确报停，不再生成或清理 Next 路由；历史来源与当前替代检查见[日月记录](../docs/project/home-mode-panels.md)。
- `profile-preview.py`：#47 首页个人信息退场与联系操作测试，详见[个人区调整](../docs/project/profile-renewal.md)。
- `home-music-preview.py`：#48 音乐控制与舞台歌词测试，详见[音乐](../docs/project/home-music-renewal.md)。
- `projects-preview.py`：#52 研究小屋与六项目交互测试；`--connection-only` 检查窗前／房间／湖景状态、自由查看返程、输入归属、音乐、历史／刷新／resize、八种桌面尺寸及退化，不运行依赖旧工具栏的历史矩阵，不生成画面或修改资产。详见[项目页](../docs/project/projects-room.md)。
- `about-preview.py`：关于页三章节、索引与滚动定位的响应式检查，详见[关于页结构](../docs/project/about-restructure.md)。
- `chatter-preview.py`：#55 杂谈图版、搜索和跳转测试；`npm run test:chatter`，详见[杂谈](../docs/project/chatter-magazine.md)。

- `friends-preview.py`：#57 的可选 Python Playwright 验收，`npm run test:friends` 检查原位覆盖、按需加载、全部友链与申请操作。默认只写忽略目录 `.sync/tmp-friends-evidence/`；显式加 `--capture-homepages` 才会访问公开友链并更新 `public/friends-previews/` 的首页快照及来源清单。[使用说明](../docs/project/friends-preview.md)。

- `paper-monitor-preview.py`：可选 Python Playwright 验收周报封面、单列目录和双层阅读，`npm run test:papers` 执行交互检查；[使用说明](../docs/project/tda-paper-monitor.md)。原始截图和检查记录写入 Git 忽略的 `.sync/tmp-paper-monitor/`；`--compare` 会更新两张入库的压缩对照图，不修改业务数据或线上状态。

- `navigation-preview.py`：使用可选的 Python Playwright 截取八个栏目，并检查桌面／手机导航；运行 `npm run test:navigation` 前先按[导航验收说明](../docs/project/navigation-renewal.md)安装浏览器依赖。仅在本地写入已被 Git 忽略的 `docs/images/navigation-renewal/` 截图，不改业务数据或线上环境。

- assign-chatter-covers.mjs：为 content/misc/ 杂谈分配并固定封面；正文有图片时使用第一张，否则从 public/chatter-covers/ 补充分配。
- `obsidian-sync.mjs`：把 Obsidian 源目录中的已批准内容同步到 `content/`。
- `zotero-sync.mjs`：从获批 Zotero Collections 和启用的未分类入口读取书目、文件夹层级与阅读状态，原子更新 `data/paper-library.json`；`--dry-run`／`--check` 不写文件，`--review` 把逐篇决定写入本地 `.sync/zotero-sync-decisions.json`。不修改 Zotero、不复制 PDF、笔记或批注。配置和上线流程见[论文系统](../docs/project/paper-library.md)。
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

运行 npm run sync:obsidian 时，会在同步成功后自动补全杂谈封面。已经分配且没有重复的目录封面保持不变；新文章、正文新增首图、失效封面和可被新图片消除的重复封面才会更新。分配结果写入各篇 Markdown 的顶部 frontmatter。图片数量不足时允许保留重复，后续向封面目录加入新图片再运行即可逐步替换。covers:dry 只预览变化，covers:check 只检查当前分配。

`npm run build` 依次执行 Quartz 内容构建和 Next 生产构建；Workers Builds 还会在 `postbuild` 打包 OpenNext。构建不上传图片或写入远端数据。公开站点图片使用 `public/` 和构建附件的静态/CDN 分发；番剧快照、镜像封面和周报使用 Cloudflare 的 `SITE_CONTENT` 绑定。旧 `sync-image-assets.mjs` 及 `images:*` 命令已退役，不能再用于上传到旧库。

`npm run build` 依次构建 Quartz 内容和 Next.js 生产版本；公开图片随构建产物静态分发，不再同步到外部对象存储。旧 `/assets/**` 兼容路由优先读取 Cloudflare 存量 `images/*`，找不到时读取构建中的同路径静态图片；`/avatar` 继续走 `/avatar.jpg`。

`npm run notes:build` 固定输出 `.quartz-cache/next/` 与 `public/quartz-assets/`。已取消无实际输出作用的 `-o/--output` 参数；`--directory`、`--verbose` 和 `--concurrency` 继续可用。

## 维护约定

- covers:assign 会按需修改 content/misc 下 Markdown 的 cover 字段；封面池只读取 public/chatter-covers/，不会复制或改动图片。
- 新增跨平台脚本放在 `scripts/` 根下，并在 `package.json` 暴露 npm 命令。
- 常用 Windows 双击包装脚本保留在仓库根目录，减少路径和编码问题。
- 脚本如果会写入 `content/`、`.sync/` 或 git 状态，文档里必须说明副作用。
- Windows 批处理脚本应先 `cd /d "%~dp0"` 回到仓库根目录，避免从其他目录运行失败。

## 首页动态回归

生产预览运行后，用 `python scripts/home-scene-preview.py --mode coupled-window --url http://127.0.0.1:3196 --output .sync/tmp-coupled-window` 检查实际室内/湖水合成、零响应与前后帧、预览不遮入口、指针、论文阅读、唯一音乐和静态退化。默认模式为 `coupled-window`；旧静态/光雾模式仅为历史实验。依赖 Playwright、Pillow 和已安装 Chrome；输出目录会写截图、视频和 JSON，音乐/周报是本地夹具，不发布夹具，也不验证外部服务可用性。当前验证边界见 [首页说明](../docs/project/home-scene.md)。

## 首页开场验收

`opening-preview.mjs` 检查当前山湖图版的真实播放与交接：四种桌面尺寸、冷／热缓存、慢网、图片延迟／失败／重试、无 WebGL、跳过、减少动态、Save-Data／2G、SPA 取消与返回、手机分流、无 JavaScript。只写 `--output` 下的截图、WebM 和 JSON，不修改站点内容或线上状态；默认目录 `.sync/tmp-opening-rewrite/` 已忽略。音乐、番剧和论文 API 使用本地空响应，真实首页素材与模型照常加载。

需要 Node 22、Playwright 和本机 Chrome；Playwright 是可选验收工具，不加入生产依赖。已有工具运行时可将 `PLAYWRIGHT_MODULE` 设为其 ESM 入口的绝对路径或 file URL。也可以安装到本地忽略目录：

```powershell
npm.cmd install --prefix .sync/tmp-opening-tools --no-save playwright
$env:PLAYWRIGHT_MODULE = (Resolve-Path .sync/tmp-opening-tools/node_modules/playwright/index.mjs).Path
$env:PLAYWRIGHT_BROWSERS_PATH = (Resolve-Path .sync/tmp-opening-tools).Path
node .sync/tmp-opening-tools/node_modules/playwright/cli.js install ffmpeg
# 另一个终端运行 npm run start -- --port 3178 后：
npm.cmd run test:opening -- --url http://127.0.0.1:3178
```

`--browser` 可指定 Chrome 可执行文件；`--output` 指定证据目录；`--help` 查看参数。报告同时保留首帧、开始退场、可交互时刻、帧间隔与长任务，不能把 2.4 秒展示预算等同于真实启动总耗时，或把帧间隔分位数等同于全程无掉帧。生产首屏就绪的定义见 [全站启动](../docs/project/site-startup.md)。
