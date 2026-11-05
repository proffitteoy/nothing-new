# 友链首页预览与验收（#57）

友链页保留 `data/friends.ts` 中全部 16 个站点的头像、名称、描述、链接，以及 `siteConfig.ts` 中的申请格式和 GitHub Issue 入口。友链数据、申请流程、共享导航、首页和部署配置不在本次修改范围内。

## 视觉与交互依据

依据原始视觉文档 `docs/project/frontend refactoring.md`，以及本机的 `docs/project/interaction research.md`；后者不随本 PR 上传。本页**禁用米黄色**，使用冷色中性表面、原有背景与紫色强调。

按用户指定，友链卡片放大到至少 300px 高。指针停留 250ms 后，首页小窗直接覆盖当前卡片，位置和尺寸与该卡片一致；移开 220ms 后恢复。进入小窗不会触发其他友链或遮住邻居卡片。常态链接仍直接打开原站，手机通过独立的眼睛按钮预览。

键盘聚焦链接可以预览，Tab 或向下方向键进入小窗操作；Escape 和关闭按钮恢复原链接焦点。小窗提供原站链接、加载状态、12 秒超时及重试。滚动、窗口尺寸变化或点击外部会关闭预览；减少动态效果时停止旋转与过渡。

## 首页快照

`public/friends-previews/` 是通过真实 Chromium 访问公开友链后抓取的首页快照，不是实时可操作的嵌入网页。来源、抓取时间与实际跳转地址保存在 `manifest.json`。站点重定向不会改写友链数据。捕获范围仅为公开首页，没有登录、提交表单或更改远端内容。

首次进入 `/friends` 时不请求任何首页快照；仅在悬停、聚焦或点击预览入口后挂载对应图片。图片通过本站静态资源提供，不依赖运行时第三方截图服务，也不新增服务端浏览器、API 密钥或部署设置。快照可能落后于对方当前网站，新增友链或需要刷新时按下文显式更新；缺少图片时显示可重试的失败状态，直接访问原站不受影响。

## 隔离预览与复现

分支：`feat/friends-directory-57`。使用 Node 22、npm 10+，先构建再启动本地生产预览：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3157
```

打开 <http://127.0.0.1:3157/friends>。开发预览也可使用 `npm.cmd run dev -- --hostname 127.0.0.1 --port 3158`。单独分支及 PR 供人工验收，不合并 main，不调整生产部署。

浏览器验收使用可选 Python Playwright，不属于站点运行依赖：

```powershell
python -m venv .sync/tmp-friends-tools
.\.sync\tmp-friends-tools\Scripts\Activate.ps1
python -m pip install playwright
python -m playwright install chromium
npm.cmd run test:friends -- --url http://127.0.0.1:3157
```

可加 `--browser "C:/Program Files/Google/Chrome/Application/chrome.exe"` 使用已安装 Chromium；`--output` 更换本地验收目录。默认输出 `.sync/tmp-friends-evidence/` 被 Git 忽略。

只在需要更新公开快照时运行：

```powershell
python scripts/friends-preview.py --capture-homepages
```

此命令读取现有友链数据，访问这 16 个公开首页并覆写本任务的图片和来源清单；不修改友链数据。需要审阅生成图片后再提交。抓取失败会记录 `unavailable` 并以非零状态退出，不将错误页面冒充正常首页。

## 验收材料

最终截图随 PR 提交：

| 桌面原位预览                                                   | 手机原位预览                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| ![桌面原位预览](../images/friends-preview/desktop-preview.jpg) | ![手机原位预览](../images/friends-preview/mobile-preview.jpg) |

另见[桌面常态](../images/friends-preview/desktop.jpg)、[夜间预览](../images/friends-preview/night-preview.jpg)、[手机常态](../images/friends-preview/mobile.jpg)、[桌面申请区](../images/friends-preview/application.jpg)与[手机申请区](../images/friends-preview/application-mobile.jpg)。原始检查记录和失败状态截图保存在本地验收目录。

2026-11-06 已在 Node 22.23.4 下验证：ESLint 0 errors（3 条既有警告）、类型检查、83 项现有测试、完整生产构建（247 个页面）；生产预览的 17 组浏览器检查通过，`page_errors` 为空。故障注入产生的预期图片网络错误与 503 单独记录，不属于未处理的页面异常。

浏览器脚本检查初始零预览请求、短暂划过不加载、全部 16 个真实快照、与自身卡片范围一致、键盘与触摸、移开/关闭/外部点击、加载/失败/重试/超时，以及 320–1440px 的内容、布局、复制、申请链接和头像回退。外链打开检查会截获新标签页导航，确认目标 URL，不提交 GitHub 申请。

人工视觉验收与 iOS Safari、Android 实机验证仍需单独进行；Chromium 模拟和自动化通过不代表已获得艺术验收。
