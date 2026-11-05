# 首页个人信息退场与联系操作

本轮依据更新后的 [#47](https://github.com/proffitteoy/nothing-new/issues/47)、[PR #63 收尾回复](https://github.com/proffitteoy/nothing-new/pull/63#issuecomment-6647530359)、[#51](https://github.com/proffitteoy/nothing-new/issues/51) 与 [#67](https://github.com/proffitteoy/nothing-new/issues/67)。原始[《Nothing New — A Living Mathematical Journal》](./frontend%20refactoring.md)第 5.1 节的首页 7:5、暖白个人介绍、头像／大姓名／四项统计和手机首页验收口径已失效。本 PR 保持原分支与 OPEN / DRAFT，不新开重复 PR。

## 实际改动

- `app/page.tsx` 移除个人区挂载和仅服务该展示的统计消费。原生顶部导航中的 `/about` 继续可达；没有在左右侧栏或其他隐藏容器中重新放置 ProfileCard。
- 删除 `ProfileCard.tsx`、`ProfileCard.module.css`，撤掉旧纸张色面板、头像、简介、统计和相关视觉逻辑。
- 将仍可复用的关于／GitHub／三项复制整理为 `ProfileActions.tsx`。它是只有内容的独立组件，需要现有 `ToastProvider`；原生 a/button、44px 最小操作区域、中文可访问名称、成功／失败反馈、Tab／Enter／Space 和焦点外框保留。
- 样式仅包含自然换行、触摸区域与焦点，继承容器的文字颜色与字体，没有定位、人物安全区、斜切外壳、热区、展开尺寸或延迟逻辑。当前不挂载在首页，供 #67 冻结容器后显式接入；不擅自创建展开位置。
- `getNoteManifest()`／`getSectionNotes()`、`loadAnimeSnapshot()` 及其缓存／回退、API、内容 Manifest、`siteConfig.ts` 和 `/about` 页面均未改动。移除的是统计展示与其页面消费者，数据来源仍由原模块提供。

同步 `main` 的基线为 `08012ef`，已包含 PR #72：音乐馆取消、导航为七入口（首页、项目、番剧、杂谈、笔记、友链、关于），不能继续验收旧八入口或 `/music` 链接。这些是已合并的上游变更。

## 与整体舞台的交接

#67 的三种桌面 bounding-box 白模及 #51 原图人物／天体／安全区审计尚未在当前仓库和已读取 Issue 中冻结。左侧为音乐、右侧为周报，个人档案由 `/about` 承担；本 PR 不把联系组件塞入两侧，也不拿候选尺寸当最终几何参数。

本地预览仅证实 ProfileCard 已退场、关于入口可达及独立操作可用。基线中仍存在的播放器、主题、周报、页尾与内页导航外观由其他任务继续改造；该预览不是“背景人物唯一焦点”的整体舞台完成图。人物保护区、边缘默认／触发／展开／关闭边界、七入口切入式导航与全场艺术验收需 #51 / #67 总装后检查。

移动设备 `/` → `/blog` 由 #69 独立负责。本 PR 不新增手机沉浸布局、设备分流或移动首页视觉用例，也不更改既有内页导航。

## 本地预览与功能夹具

在原 PR 分支使用 Node 22 / npm 10+：

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3147
```

打开 <http://127.0.0.1:3147>，等待或跳过现有开场。检查 1440×900、1280×800、1024×768 的真实背景、个人区退场及现有关于入口。

Python Playwright 为可选验收依赖，安装方法见[导航文档](./navigation-renewal.md#复现截图与交互检查)。在第二个终端运行：

```powershell
python scripts/profile-preview.py --output "$env:TEMP/profile-47-revision"
```

脚本在三种桌面尺寸的日夜主题下记录默认、现有关于入口 hover / focus、恢复默认的真实截图；确认首页没有 ProfileCard、简介、头像或统计挂载，并通过现有导航实际进入 `/about`。这些状态只验证现有入口，不冒充 #67 尚未实现的展开／收起。

随后脚本用 esbuild 从实际 `ProfileActions` 与 `ToastProvider` 源码生成本机独立功能夹具，验证原生复制、拒绝／缺少 API 的失败提示、链接目标、Tab 顺序、Enter／Space、焦点与无键盘陷阱。夹具不添加业务路由、不改变真实首页、不替代几何白模，截图文件名使用 `actions-` 前缀以便区分。

需要手动操作同一组件时执行：

```powershell
python scripts/profile-preview.py --serve-actions --output "$env:TEMP/profile-47-revision"
```

访问终端输出的临时本机地址，Ctrl+C 停止。脚本还支持 `--url` 与 `--browser`。全部截图、夹具 bundle 和浏览器日志仅保存在指定本地输出目录，不提交二进制。

## 验证与待验收边界

2026-11-05，基于 `08012ef` 的返工结果：

- Node 22 下 `npm run lint` 通过：0 errors、4 项既有 warning；`npm run typecheck` 通过，现有测试 83/83 通过。
- `npm run build` 通过：Quartz 处理 168 个内容文件，Next.js 生成 247 个静态页面。构建中 GitHub 贡献数据请求出现一次 `ECONNRESET`，现有回退逻辑使构建继续完成；不将该结果视为远端数据已正常同步。
- 开发与生产 Chromium 预览均完成三种桌面尺寸、日夜主题、现有关于入口 default / hover / focus / restored，以及独立组件的链接、原生剪贴板、失败／API 缺失、Tab / Enter / Space 与 reduced-motion 检查；两份 `browser-errors.json` 均为空，没有未捕获页面异常。
- 已人工查看真实首页和组件焦点截图。开发模式仍有既有 `PageTransition` 在 reduced-motion 下的 hydration 属性警告；本机未配置 Blob / Bangumi 凭据，相关现有接口使用失败回退。本轮未验证这些外部服务。
- `lib/notes`、`lib/anime`、`siteConfig.ts`、`app/about` 与 `components/AboutClient.tsx` 相对基线无差异。后台数据、Provider、导航与部署配置不属于本 PR 的新增改动。

本轮本地截图及可切换查看器：

```text
C:\Users\84025\.codex\visualizations\2026\11\04\01a1a6ab-60cd-7b42-97b3-a346f5e88ccf\profile-47-revision\preview.html
```

`development/` 和 `production/` 保存各自真实首页与独立组件截图、浏览器日志。旧 `profile-47/comparison.html` 为已撤销方案，不再作为验收依据。

本 PR 的代码退场与独立操作检查不等于 #51 / #67 的完整视觉验收。人物保护区、实际边缘槽位和展开／收起录像依赖其后续白模；人工验收前保持 Draft，不合并 main、不修改生产部署。
