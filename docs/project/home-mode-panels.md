# 日月天体与显示入口（#49 / #70）

按 #49 最新正文与 PR #62 的返工回复，旧两张模式面板已撤下。原 PR 保持 OPEN / DRAFT，待人工视觉验收。

## 实际设计依据

已查看 `public/background.png` 原图，尺寸为 1672×941，SHA256 为 `DF00CF1DC7D744EBF7F304A5A21D2FC825166DCB01385F41D4B6F82CE269CE69`。原图右上是漫射亮区，没有可辨认的太阳实体；不能把新增天体的位置声称为原画太阳坐标。

候选美术锚点为原图 `(1390, 145)`，按现有居中 cover 和 1.01 缩放投影，另限制距顶部和右边界的安全距离。实际热区为 80×80px，焦点与现有 72px 导航分开。该点采样为 `#EAE5D9`，附近 `(1415,165)` 为 `#ECE9DF`；太阳的暖光与月亮的灰紫层次据此与人物衣饰协调。主体虚线是人工审图的包络，不是已经交付给谱场的精确保护掩膜。

![原图审计与候选锚点](../images/celestial/background-audit.jpg)

## 实现

- `HomeCelestialControl.tsx` 内联可编辑 SVG 路径：实体光盘、不对称光晕、确定性纹理；负形月相、月面分层与环轨迹。直接点击仅调用既有 `toggleTheme()`，日夜交叉过渡 1000ms；减少动态效果时立即切换。
- `SiteDisplayControls.tsx` 提供默认收起的原生 Popover，主题与 normal/field 独立操作；内页和窄桌面窗口仍可切换主题。Escape、外部点击由浏览器处理，手机菜单与返回按钮错开。
- `FieldModeProvider.tsx` 保留原有状态、持久化和 storage / 自定义事件同步契约。主分支已取消 `/music`，此处不恢复音乐馆、不挂载谱场；性能选项保存用户选择，后续首页引擎由 #71 接入。
- `HomeStoryBoard` 移除旧设置列，周报占满原容器，不留一列空洞；周报阅读逻辑不改。`app/layout.tsx` 仅接入共享状态和紧凑控制。
- 删除旧纸面样式、旧主题面板、旧三张对照图及旧面板脚本。原版提交仍在 PR 历史中。

## 新版独立场景预览

以下截图复用真实根布局、背景、七入口导航、Provider 和生产天体组件；是 #49 的独立展示，不冒充已经完成的 #51 全首页总装。当前根路径其余旧内容的编排、嵌入式导航、移动根路径跳转及五分钟周期分别由 #51 / #67 / #69 / #68 负责。现有背景的日夜呈现沿用根布局，本次没有新增第二张背景或重绘整幅原画。

![日间完整场景](../images/celestial/scene-day.jpg)

![夜间完整场景](../images/celestial/scene-night.jpg)

使用 Node 22 / npm 10+，安装可选 Python Playwright（见导航验收说明）后：

```powershell
npm.cmd ci
python scripts/celestial-preview.py --prepare-study
npm.cmd run dev -- --hostname 127.0.0.1 --port 3129
```

打开 <http://127.0.0.1:3129/celestial-study>。另一个终端执行：

```powershell
python scripts/celestial-preview.py --url http://127.0.0.1:3129
```

原始截图和报告写入忽略目录 `.sync/tmp-celestial/`。支持 `--browser Chromium路径`、`--checks-only`、`--record-only`。预览生成的 `app/celestial-study/page.tsx` 不提交、不部署；结束后执行 `python scripts/celestial-preview.py --clean-study` 删除。

## 已验证与剩余边界

2026-11-05，独立 worktree、Node 22.23.4：

- 生产构建通过；83 项现有测试全部通过；改动 TSX 的 ESLint 通过。
- Chromium：1440×900、1280×800、1024×768 的日夜 × 常规/谱场四组合通过，热区不与导航重叠，无横向溢出。
- 键盘、焦点、主题与性能独立、刷新恢复、跨标签页和同页事件同步、减少动态效果、首页不挂载 Canvas 通过。
- 320/390px 手机内页触摸、主题访问和菜单/返回按钮边界通过。
- 06:00/18:00 自动切换、手动覆盖刷新恢复及边界释放通过；最终浏览器报告 `pageErrors` 为空。
- 主题切换不导航、不刷新、不创建时钟或渲染循环。#68 的真实周期尚未在此分支装配，不能宣称已完成其端到端“不归零”验收。

**待补：切换录屏、人工艺术验收、与 #51/#67/#68/#69 总装后的联合验收。** 录屏依赖安装遇到浏览器版本不匹配，现有静态证据与功能报告不替代录像。不合并 main，不修改线上。
