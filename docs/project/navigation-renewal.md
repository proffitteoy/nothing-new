# 导航视觉更新与验收

> 2026-11-13：当前导航仅使用[固定浅色色卡](blue-theme.md)，不再提供昼夜切换。下文日夜对照和切换验收均为历史记录。

本次把 #43（设计规范与安全预览）、#45（桌面导航）、#46（手机圆盘）合并为一个 PR。依据为[完整视觉方案](<./frontend refactoring.md>)，改造前基线是 `d565bb3`。首页及七个内页的正文、卡片、业务数据、路由和部署配置保持原样；此次新设计的实际预览对象是全站共享导航。

## 局部视觉规范

2026-11-07：导航局部变量引用 `app/globals.css` 中的[蓝色基调与组件色卡](blue-theme.md)。以下为当前日夜配色；原暖色色板已废止。字体与布局延续原实现。

| 规则         | 日间      | 夜间      |
| ------------ | --------- | --------- |
| 纸张／主表面 | `#FFFFFF` | `#1A2233` |
| 主文字       | `#29354B` | `#E6EAF3` |
| 次文字       | `#627087` | `#ABB6CB` |
| 强调／焦点   | `#4266CF` | `#A4B8FF` |
| 辅助曲线     | `#146D64` | `#70CCB6` |
| 细分割线     | `#D8DFEB` | `#354056` |

日间强调色和次文字比方案候选值略深，以满足浅色表面的小字号阅读。UI 字体顺序为 Inter、思源黑体、Noto Sans SC、微软雅黑；品牌字为 Newsreader、思源宋体、Noto Serif SC、宋体。当前使用本机已有字体和回退，不额外请求字体服务，也不改变正文与 KaTeX。

桌面栏高 72px，最大内容宽度 1248px；常规左右留白 32px，窄桌面留白 20px。保留「阿の宝藏之地」和八个栏目，不换行、不新增悬停面板。当前栏目用蓝色曲线与 `aria-current="page"` 标明，悬停只改变颜色与细线，键盘焦点有 2px 外框。

手机触发按钮为 48 × 72px，仍可上下拖动。圆盘直径取 320px、视口宽减 32px、视口高减 96px 的最小值，320px 屏幕下直径为 288px；八个入口各 52 × 52px，可以直接点击。中心按钮关闭，外部遮罩与 Escape 也可关闭；打开时聚焦关闭按钮、锁定背景滚动并循环 Tab 焦点，关闭后归还焦点。拖动和转动手势结束不会触发栏目跳转，跨越桌面断点会关闭圆盘并恢复滚动。

品牌、触发按钮及圆盘中心复用从 [GDUF Community 竞赛网站 EulerBridgeLoader](https://github.com/gduf-community/ai-data-competitions-ui/blob/main/src/components/shared/euler-bridge-loader.tsx) 移植的动态 SVG（本仓 `components/EulerBridgeMark.tsx`）。保留原有四节点闭合回路，按全站规范改为蓝／青绿双色、沿路径运动的粒子尾迹与 20 秒一周的整体旋转；根据导航中的 26–32px 尺寸使用每段 8 粒子的紧凑版本。可见时运行浏览器动画帧，导航被隐藏、页面切到后台或设置减少动态效果后暂停；静态曲线仍可见。该图标仍独立于完整谱场系统，不引入 Canvas，也不替换音乐粒子／3D 小屋。颜色反馈 180ms，导航指示与圆盘展开 300ms；减少动态效果时取消过渡和自动旋转，保留手动转动与全部操作。

## 截图与视觉验收

为避免将大量二进制截图加入仓库，**改造前后截图仅作为本地验收产物保存，不提交到 Git，也不附在本 PR 中**。截图输出目录为 `docs/images/navigation-renewal/`，已通过 `.gitignore` 排除。

本次改动仅覆盖全站共享导航；审核时可从 PR 的 Vercel Preview 直接检查桌面导航和手机圆盘，或按下文启动本地预览。建议检查八个栏目、320／390px 的手机布局、768／960／1280／1440px 的桌面布局，以及日夜模式。

需要重新生成截图时，在本 PR 分支运行 `python scripts/navigation-preview.py --stage after`。如需改造前对照，在基线提交 `d565bb3` 的独立工作树启动旧版站点，并将本 PR 的 `scripts/navigation-preview.py` 复制到该工作树执行 `--stage before`；两套截图分别保留在各自的本地工作树，供人工对照。该目录不会被上传到远端仓库。

## 查看 PR 的本地预览

检出 PR 分支 `feat/navigation-visual-renewal`，使用 Node 22 与 npm 10+：

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3100
```

打开 <http://127.0.0.1:3100>，等待原有开场结束或点击跳过。桌面检查八个入口及当前栏目曲线；开发者工具切换到 320／390px 后，点击右侧几何按钮展开圆盘。首页原有「昼夜交替」可以检查两种主题。预览在本机运行，不需要部署或连接生产 Blob；笔记由 `dev` 脚本先行构建。番剧和音乐的外部数据可受本地凭据和网络影响。

PR 若出现 Vercel 预览，可从 PR 的 Checks／Deployments 进入；没有自动预览时，上述本地步骤可以独立复现。该分支须经人工视觉验收后再合并，本次不合并 `main`。

## 复现截图与交互检查

Python Playwright 为可选验收依赖，不参与网站构建。可以创建独立虚拟环境后安装：

```powershell
python -m venv .sync/tmp-navigation/venv
.\.sync\tmp-navigation\venv\Scripts\Activate.ps1
python -m pip install playwright
python -m playwright install chromium
```

保持预览服务器运行，在第二个终端中执行：

```powershell
python scripts/navigation-preview.py --stage after
npm.cmd run test:navigation
```

两个命令可追加 `--url http://127.0.0.1:其他端口` 或 `--browser Chromium可执行文件路径`，npm 入口需用 `--` 传参，例如 `npm.cmd run test:navigation -- --url http://127.0.0.1:3101`。截图命令抓取八个栏目的桌面／手机首屏及展开圆盘；交互检查会重新生成尺寸与主题的导航截图。截图和交互检查生成的图片只写入本地 `docs/images/navigation-renewal/after/`；整个 `docs/images/navigation-renewal/` 已被 `.gitignore` 忽略，不会产生待提交的图片差异，也不写业务数据。`--stage before` 仅在使用改造前代码的独立工作树中执行，避免将新版页面误标成旧版基线。

交互检查覆盖桌面四种宽度的八个链接、无重叠、当前栏目、键盘 Tab／Enter；覆盖 320px 日间减少动态效果、390px 日间常规动效、390px 夜间减少动态效果的圆盘边界、点击、真实触摸事件拖动与旋转、误触保护、关闭、焦点归还、浏览器返回和窗口缩放。

## 验证记录与边界

2026-11-04 本地已完成：

- ESLint、Next.js 类型生成与 TypeScript 检查；本次导航文件无 lint 警告，仓库其他文件有原有警告。
- 现有 87 项测试通过。
- Node 22.23.4 下完整 `build` 通过，生成 250 个静态页面；本地无 Blob 配置，图片同步明确跳过，没有上传图片。
- Chromium 导航交互检查在开发预览和 Node 22 的生产构建预览中均通过，改造前后在本地曾生成共 42 张截图；图片不随 PR 提交，人工验收请使用 Vercel 预览或本地重新截图。

改造前后预览均观察到 `PageTransition` 在减少动态效果下的 hydration 属性警告；本地没有 Blob 时，番剧会走现有实时回退并可能超时；音乐／小屋预热出现过 Three.js 材质 `isReady` 错误。截图保留原始开发提示。这些问题没有在本次导航范围内修改，浏览器检查通过不等于整站所有动态场景均无错误。iOS Safari、Android 实机和线上环境尚未验收。
