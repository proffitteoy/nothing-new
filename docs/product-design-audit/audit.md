# 音乐播放器前端体验审计

日期：2026-06-30  
目标：评估当前个人站点首页播放器与 `/music` 音乐页，并判断 Mineradio 可借鉴哪些能力来改进播放器体验。  
范围：`https://nothing-new.icu/`、`https://nothing-new.icu/music`、本仓库 `app/` 与 `components/` 中的播放器相关实现。  

## 证据与限制

- Vercel 线上抓取：`/` 与 `/music` 均返回 200，且命中 Vercel cache。
- 截图限制：Codex 内置浏览器可以连接，但 `tab.goto("https://nothing-new.icu/")` 等待完整加载超时；改用地址栏导航也未成功提交。按 Product Design audit 规则，本次不伪造截图，以下结论以线上 HTML、Vercel 部署数据和本地代码为证据。
- 本地运行限制：尝试启动 `npm run dev` 时未形成 3000/3001 监听，未能用本地同代码渲染补截图。
- 目录中可能残留 3 个 0 字节日志文件：`dev-server.err.log`、`dev-server.out.log`、`dev-server.job.log`。它们没有审计价值，删除动作被权限审查拦截，未继续绕行处理。

## 步骤与健康状态

1. 首页首访：有风险  
   HTML 中 `#app-mount-root` 默认 `opacity: 0; visibility: hidden; pointer-events: none;`，只有 `html.splash-seen` 才显示主内容；首访依赖 `SplashScreen` 在约 2.7 秒后写入 `sessionStorage` 并加 class。

2. 首页播放器卡：中等  
   页面能渲染个人信息、入口卡和播放器加载态；但播放器区域首屏可能长时间停在“连接音乐云端中...”，没有明确超时、重试或降级入口。

3. 音乐页入口：中等偏低  
   `/music` 返回 200，但服务端 HTML 首屏是“唤醒音频引擎中...”。如果 `/api/music` 或网易云链路慢，用户会先看到单一 loading，而不是可浏览的歌单骨架或缓存内容。

4. 音乐页播放器主操作：中等  
   有唱片封面、进度条、播放/上一首/下一首、播放模式、音量、歌词/歌单 tab，功能面完整；但多个图标按钮缺少 `aria-label`，双击音量才静音属于隐性手势。

5. 移动端导航：有风险  
   移动端使用右侧可拖拽半圆按钮和旋转圆盘导航，视觉有记忆点，但触发器缺少可读标签，键盘/读屏可达性弱，且右侧悬浮区域容易与页面滚动、播放器控件产生误触。

6. 发布链路：有风险  
   Vercel 项目最新部署 `dpl_GRnyc8CLySZc1Rcvk7VTBN3tQgHh` 为 `ERROR`。失败日志显示 dependabot 升级生产依赖后，Quartz 构建报错：`SyntaxError: The requested module 'js-yaml' does not provide an export named 'default'`。

## 优点

- 首页和音乐页已经有统一的“玻璃拟态 + 动态背景 + 音乐氛围”语言，个人站点气质明确。
- 音乐页功能骨架完整：播放控制、歌词同步、歌单切换、搜索、音量、播放模式都有入口。
- API 层已经给网易云详情和歌词请求设置了 `AbortSignal.timeout(6000)`，这是可靠性建设的好起点。
- 桌面端隐藏高负载效果、移动端关闭部分粒子/弹幕的思路正确，说明已经考虑性能分层。

## UX 风险

- 首访内容被 splash gate 完全隐藏。若 JS 执行失败、动画状态异常或 sessionStorage 不可用，主内容可能长期不可见。更稳的做法是主内容默认可见，splash 作为覆盖层逐渐退场。
- 音乐加载态缺少“可恢复”的下一步。现在用户只能等待；建议加入超时后的“重试 / 进入歌单 / 查看缓存歌曲 / 继续浏览站点”。
- 首页播放器整卡跳转到 `/music`，内部进度条和按钮靠 `stopPropagation` 避免误跳。这个模型可用，但建议增加明确的“打开完整播放器”入口，减少控件和卡片导航的心理冲突。
- 歌词点击 seek 很好玩，但当前是普通 `div onClick`，用户不容易知道可点，也不适合键盘操作。
- 播放模式图标没有文字反馈。用户点击后看到图标变化，但不一定知道当前是循环、单曲还是随机。

## 无障碍风险

- 多个图标按钮缺少 `aria-label`：播放/暂停、上一首、下一首、播放模式、音量、清空搜索、浮动播放器按钮、移动菜单触发器等。
- 进度条和音量条缺少可读标签，读屏用户无法知道滑块作用。
- 移动端导航触发器是视觉点阵，没有文本、`aria-label` 或打开状态语义。
- 大量动效未看到统一的 `prefers-reduced-motion` 降级：splash、唱片旋转、歌词滚动、背景渐变、粒子/点击效果、波形动画都可能影响动效敏感用户。
- 歌词列表使用 `div` 承载可点击 seek 行，应改为 button 或补足 `role="button"`、`tabIndex`、键盘事件与当前行 `aria-current`。

## Mineradio 可借鉴方向

结论：可以借鉴“播放器能力模型”，不建议直接移植代码。

可借鉴：

- 音源抽象：把“获取歌曲信息 / 获取播放地址 / 获取歌词 / 失败兜底”拆成清晰服务层，当前 `/api/music` 可继续演进为 provider adapter。
- 歌词体验：歌词时间轴、当前行高亮、点击跳转、无歌词时的替代文案，都适合做成稳定组件。
- 播放队列 UX：完整播放器页应让用户清楚看到当前队列、当前播放、搜索结果为空、加载失败、切歌后的状态。
- 可视化氛围：可以参考音频频谱/唱片/波形方向，但要受控、可关闭、尊重 reduced motion。

不建议直接移植：

- Electron 桌面能力、Cookie 登录、系统级音频能力与当前 Web/Next.js 站点目标不一致。
- 第三方项目许可证和实现架构需要单独审查；当前项目最好只吸收交互思路和状态模型。

## 优先级建议

P0：修复发布链路  
锁住或回退 dependabot 的生产依赖升级，优先解决 `js-yaml` ESM 默认导出导致的 Quartz 构建失败。前端体验再好，也需要可稳定发布。

P1：改 splash 为非阻塞覆盖层  
让 `#app-mount-root` 默认可见，splash 只作为 fixed overlay；退出失败时也不挡主内容。保留动画，但不要让主内容依赖 sessionStorage 才可见。

P1：给音乐加载态加失败恢复  
在 `MusicProvider` 中区分 `loading / ready / empty / error / partial`，并在首页播放器和音乐页显示明确操作：重试、打开歌单、继续浏览、显示已缓存的歌曲信息。

P1：补齐播放器控件语义  
为所有图标按钮加 `aria-label`；进度条加 `aria-label="播放进度"`，音量条加 `aria-label="音量"`；播放模式按钮点击后给出当前模式文本或 tooltip。

P2：让歌词 seek 可发现且可访问  
把歌词行改成 button 或至少补齐 role、tabIndex、Enter/Space 支持；当前歌词使用 `aria-current="true"`。

P2：优化移动导航  
保留圆盘的个性，但给右侧触发器加 `aria-label="打开导航"`、`aria-expanded`；考虑提供底部简洁导航或在圆盘打开后支持 Escape/返回关闭。

P2：引入 reduced motion 策略  
在全局 CSS 中对 `prefers-reduced-motion: reduce` 关闭唱片旋转、背景流动、splash 旋转、歌词平滑滚动和点击粒子。

P3：降低视觉层级重复  
当前 `rounded-3xl + backdrop-blur + shadow-xl + indigo` 使用很密。建议将播放器主卡、入口卡、辅助状态分成 2-3 个明确层级，音乐页主播放器可以更强，普通入口卡更克制。

## 推荐实施顺序

1. 修 Vercel 构建失败，恢复主分支生产发布信心。
2. 改 splash gating，确保首访主内容不会被隐藏机制卡死。
3. 给音乐 Provider 增加状态机和加载失败恢复 UI。
4. 补播放器、浮动播放器、移动导航的 aria 与键盘语义。
5. 基于 Mineradio 思路重构音源 adapter 与歌词/队列组件，而不是直接搬代码。

## 2026-07-01 实施跟进

已完成：
- Splash 不再 gate 主内容：`#app-mount-root` 默认可见，`SplashScreen` 仅作为可退出的覆盖层；`sessionStorage` 不可用时不会阻塞站点。
- 音乐状态机补齐：`MusicProvider` 区分 `loading / ready / empty / error`，失败和空列表会暴露错误文案与 `retryMusic`。
- 首页播放器和 `/music` 页面补齐可恢复状态：加载失败/空列表时显示明确说明与重试入口，首页播放器增加“完整播放器”入口，避免整卡点击和内部控件冲突。
- 播放器语义增强：播放/暂停、上一首、下一首、播放模式、进度、音量、搜索、清空搜索、浮动播放器等控件补齐 `aria-label` 或当前状态说明。
- 歌词 seek 改为按钮语义：当前歌词使用 `aria-current`，点击歌词通过 `seekToPercent` 跳转，不再伪造 input change 事件。
- 移动导航补齐可访问性：触发器增加 `aria-label / aria-expanded / aria-controls`，圆盘弹层增加 dialog 语义，支持 Escape 关闭，当前页面标记 `aria-current`。
- 全局增加 `prefers-reduced-motion: reduce` 降级，降低唱片旋转、pulse、spin、bounce 等动效对敏感用户的影响。

验证：
- `npm.cmd run lint`：通过，0 errors；剩余 16 个 warning 为既有 `<img>` 优化建议和 `obsidian-sync.config.mjs` 匿名默认导出提示。
- `npm.cmd run typecheck`：通过。
- `npm.cmd run build`：通过。Quartz 输出到 `public/blog`，Next.js 16.2.1 生产构建成功。
- 本地 3002 旧服务 `/` 与 `/music` 均返回 200；Browser DOM 检查首页确认 `#app-mount-root` 默认可见、无 Next 错误层、无页面 console error。`/music` 在该旧服务上 9 秒后仍停留在“唤醒音频引擎中...”，因此不作为最新构建截图证据。
- `next start --port 3003` 前台诊断可在约 1 秒内 Ready；但沙箱外后台启动审批因额度限制被拒绝，未能用浏览器对最新 build 产物完成新截图验证。

未纳入本轮：
- Vercel 上 dependabot PR 的 `js-yaml`/Quartz 构建失败属于依赖升级发布链路问题，建议单独处理 PR #21。
- `<img>` 切换到 `next/image` 涉及远程图片域名、尺寸和缓存策略，建议作为后续性能专项处理。
- Browser 插件没有拿到最新构建的音乐页截图证据；音乐页以 lint/typecheck/build 通过、HTTP 200 和代码级语义检查作为当前验证依据。

Vercel / GitHub 复核：
- Vercel `math-vault` 最新 production 部署 `dpl_5uaCkRHJV12bvdUGHkQXG9dTBPfN` 为 `READY`，对应 `main` 分支提交 `6625f169b4d8413ae15feaf0d90df50e9f1dd2d9`，提交信息 `6.30`。
- GitHub PR #21 仍为 open、未合并、mergeable；head commit `004e6260766d0751035893621d988aee84bfd685` 的 Vercel status 为 `failure`，对应失败部署 `dpl_GRnyc8CLySZc1Rcvk7VTBN3tQgHh`。
