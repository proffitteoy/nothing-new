---
title: 图片加载性能审计
---

# 图片加载性能审计

本文记录 2026-09-14 开始的全站图片加载审计与分级优化。第一轮对应实现提交为 `723c14d`，第二轮确定性优化基线为 `a492db5`。结论以代码、构建产物和浏览器请求为准；lint、类型检查或主观观感不单独作为性能提升证据。

## 目标与约束

- Splash 保持固定约 2.7 秒的非阻塞视觉时序，图片成功、失败或慢速加载都不能延长入站动画。
- 动画期间只提前加载全站背景、Splash 头像，以及当前路由至多一张内容主视觉图。
- 保留私有 Vercel Blob、`/avatar`、根图片、杂谈封面和 Quartz 附件的既有站内 URL。
- 不镜像、不全站预连接或预加载音乐封面、友链头像等第三方图片。
- 原始图片不覆盖、不删除；响应式版本由 Next/Vercel 图片链路按请求生成。

## 基线与负优化判定

| 既有方案                                                   | 判定         | 证据与处理                                                                                                                                 |
| ---------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 全局 `images.unoptimized: true`                            | 负优化       | 已知布局的站内图片只能传输原图，无法按 DPR、视口和现代格式裁减。现已启用 Next Image，并限制本地路径、质量档位、AVIF/WebP 和缓存 TTL。      |
| 首页约 2.18 MB 的 `profile-studio.png` 使用高优先级        | 负优化       | 图片位于首页下方，却会与背景、头像和首屏资源竞争。已取消 preload，按实际视口加载。                                                         |
| 番剧页固定 eager 16 张封面                                 | 负优化       | 移动端远超首行所需。现为移动端 4 张、桌面端 6 张，Save-Data/2G 为 2 张。                                                                   |
| Quartz 正文图片默认立即加载且缺少稳定尺寸                  | 负优化       | 会增加初始带宽竞争，并提高布局偏移风险。生成阶段现补齐真实宽高、lazy、异步解码、`sizes` 和同源响应式 `srcset`。                            |
| 杂谈图片仅 lazy，但直接使用大原图                          | 负优化       | 最大杂谈原图为 21,202,086 bytes，首屏尺寸无需传输该分辨率。现保留原图并通过同源响应式 URL 交付；通常只 eager 2 张，弱网 1 张。             |
| 图片元素同时使用 lazy/异步解码和 `content-visibility:auto` | 中性偏负     | 收益无法证明，且可能形成重复延迟。已移除图片元素上的 `content-visibility:auto`。                                                           |
| Splash 头像与全站背景提前加载                              | 有效但需限额 | 两者会直接用于入站动画或动画结束后的首屏。现使用 Next 16 声明式 `preload`，并统一头像候选尺寸，避免与正文重复下载。                        |
| 关于页封面 preload                                         | 有效         | 它是该路由唯一的内容级主视觉图；连同背景和头像，高优先级图片仍不超过三张。                                                                 |
| 友链头像和音乐封面继续原生 `<img>`                         | 有效         | 来源为第三方，维持 lazy、原 URL 和既有 referrer 策略，避免扩大图片代理白名单和跨站预加载。                                                 |
| 私有 Blob 代理每次上游 `no-store`                          | 负优化       | 连续请求无法利用 Blob/CDN 缓存。现使用官方私有读取接口，传递 ETag、`If-None-Match`、304，并分别设置浏览器、通用 CDN 和 Vercel CDN 缓存头。 |

## 实施结果

- Splash 头像、响应式背景在动画期间开始请求；动画计时逻辑不依赖图片加载事件。
- 首页工作台图不再抢占首屏；关于页封面保留为该路由唯一的内容级 preload。
- 番剧快照仍在组件挂载后立即请求，与 Splash 自然并行；封面 eager 数量按视口和网络条件控制。
- 杂谈维持移动两栏、桌面三栏的天然比例瀑布流，不裁切封面。
- `NoteArtifact` 以可选字段携带封面尺寸，旧构建产物与尺寸缺失场景仍可降级。
- Quartz 构建产物中 54/54 张正文图片具备真实尺寸并使用 lazy + async；49 张适合优化的静态站内图片使用响应式 URL，GIF 和外链保持原地址；18/18 张杂谈封面具备尺寸元数据。
- 图片同步 dry-run 覆盖 80 张站内图片，共 67,020,714 bytes。

## 已完成验证

- 单元测试 51/51 通过，覆盖中文/空格路径、尺寸缺失降级、同源/外链区分、移动/桌面/弱网 eager 预算，以及 Blob 304 与错误响应。
- TypeScript 检查通过；全仓 ESLint 为 0 error、7 warning。剩余 warning 来自有意保留的第三方 `<img>`、NoteShell CSS link 和既有配置提示。
- 完整生产构建和图片同步检查已由维护者确认成功。
- 最终 preload 限额修正后再次通过定向 ESLint、TypeScript 和完整生产构建：164 个 Markdown 输入、227 个 Quartz 输出、191 个静态页面。

### 本地生产浏览器验收

- `/`、`/about`、`/chatter`、`/friends`、`/anime`、`/music` 和图片密集笔记均渲染了非空页面，未出现 Next 错误浮层。
- 390×844 冷启动直达杂谈页时共有 3 条图片 preload：背景、Splash 头像和第一张封面。第二张首行封面仍为 eager，但使用 low fetch priority，不再产生额外 preload；Performance API 未发现重复的站内图片 URL。
- 冷启动直达关于页时共有 3 条图片 preload：背景、Splash 头像和关于页封面。首页工作台图不在 preload 清单中。
- 杂谈实测移动端为两栏、1440×900 桌面端为三栏，已加载卡片无失败图片且保持自然比例。图片密集笔记的 3 张正文图均有数值宽高、lazy、async 和响应式 URL，渲染宽高比与实际图片宽高比的最大差值小于 0.003。
- 本地未配置 Blob 凭据，番剧快照和实时回退均不可用；番剧页会显示受控错误状态而非空白或错误浮层。因此封面 eager 4/6/2 的真实网络行为仍需在有快照的部署环境验证。
- 音乐页的播放器与列表会引用同一第三方封面，Performance API 可出现两个同 URL 条目；它不属于站内 preload，也没有扩大代理白名单，但第三方缓存和传输行为不受本站控制。

## 部署后仍需验证

下列项目没有本地生产凭据或稳定的线上 A/B 环境，因此当前判定为“证据不足”，不能由构建成功代替：

- 以 390×844、受限 4G、DPR 2 和 1440×900、宽带、DPR 1 分别运行至少 5 次，记录冷缓存、子页直达和暖缓存的 LCP、CLS、图片传输量、请求起点、优先级及解码时间。
- 确认冷缓存首屏图片传输量相对旧版下降至少 40%，LCP P75 不回退超过 5% 或 100 ms，CLS 不高于 0.1。
- 检查 preload URL 与最终 `src/srcset` 是否完全复用同一请求，并确认任一路由高优先级图片不超过三张。
- 对 `/background.png`、杂谈封面和 Quartz 附件连续请求，验证 `x-vercel-cache` HIT、有效 304，或第二次 TTFB 至少下降 30%。若均不满足，Blob 缓存仍应记录为未解决的负优化。
- 对暗色/亮色、首页背景、关于页、杂谈瀑布流和正文图片比例做截图对比。

## 2026-09-17：第二阶段调度研究

第二阶段只研究番剧与杂谈列表，不改变正文、友链、音乐或其他全站图片。实验不自己调用 `fetch`，只控制图片元素何时挂载，因此 Next Image、浏览器缓存、HTTP/2/3 和原生解码器仍负责实际网络与渲染调度。

### 已部署基线

- 390×844 生产冷会话中，`/anime` 首批约 16 张番剧封面、4 张 eager，图片资源合计约 83 KB。
- 同视口的 `/chatter` 首批为 13 张内容图，图片资源合计约 78 KB；文件夹站内封面走 `/_next/image`。
- 隔离样本观察到约 62–65 ms Long Task，但采样机器为 22 线程、32 GB 内存，现有 Performance API 不能据此确认任务来自图片解码。该数据只用于决定先做归因实验，不能证明自适应并发有效。

### 实验门禁与变体

只有服务端环境变量 `IMAGE_LOADING_LAB=1` 时，`/anime`、`/anime#watched` 和 `/chatter` 才读取以下查询参数：

```text
?imagePolicy=native
?imagePolicy=gate-unbounded
?imagePolicy=fixed-2
?imagePolicy=fixed-4
?imagePolicy=fixed-6
?imagePolicy=fixed-8
?imagePolicy=fixed-12
?imagePolicy=adaptive
&imageRun=<sample-id>
```

未启用环境变量或参数不合法时强制使用 `native`。生产环境不得设置该变量。实验不会发送遥测、写 Cookie 或写本地存储；当前页面的内存快照通过 `window.__imageLoadingLab.snapshot()` 读取。

`gate-unbounded` 用于量化 hydration 与门控自身的开销。固定并发和 adaptive 按“当前可见、immediate、near viewport”排序，同级 FIFO；远离 near margin 的图片不入队，挂载后不卸载。网络槽在 `load`、`error` 或 15 秒超时后释放。

adaptive 初值为普通移动端 4、普通桌面端 6、Save-Data/2G 为 2，范围为 2–10。控制器每秒评估、调整后冷却 2 秒；活跃请求期间出现 Long Task、长帧、明显 decode tail 或解码积压时降 1，队列持续饱和且至少有 3 个完成样本、最近无压力信号时升 1。它不执行启动 CPU microbenchmark。

### 自动采样

先在本地或 Vercel Preview 设置 `IMAGE_LOADING_LAB=1` 并启动站点，再运行：

```powershell
npm.cmd run images:lab -- --base-url=http://localhost:3000 --runs=5
```

脚本使用隔离的 agent-browser 会话与 CDP 清理缓存，并执行三种配置：1440×900 无节流桌面、390×844 网络受限移动端、390×844 CPU 受限移动端。每轮直达页面，等待当前可见图片完成，滚动一屏，再快速滚动三屏。原始数据与聚合结果写入系统临时目录，不进入仓库。

快速验证单一组合可使用：

```powershell
npm.cmd run images:lab -- --runs=1 --variants=native,fixed-4 --routes=anime --profiles=desktop
```

2026-09-17 本地功能 smoke 使用 `/chatter` 桌面配置完成。fixed-4 的峰值活动槽位为 4，最终 pending 为 0，请求时序字段可读，失败与 15 秒调度超时均为 0；native、gate-unbounded 和 adaptive 也都能生成完整快照。单次样本受开发服务器、冷转换和本机负载影响，不用于性能策略决策，原始 JSON 保留在系统临时目录。

本机未配置番剧 Blob 读取凭据，`/anime/latest.json` 与 `/api/anime` 均返回 503，因此本地没有伪造番剧样本；`/anime`、`/anime#watched` 的自动化矩阵必须在具备真实快照的 Vercel Preview 或等价本地环境执行。

### 决策门槛

- 固定并发只有在至少两种设备配置下让可见区完成时间中位数改善至少 10%，并且 LCP P75、CLS、请求数、传输量、Long Task、最长帧间隔和失败率均不越过既定回退门槛时，才进入 adaptive 对照。
- adaptive 必须相对最佳固定并发再改善至少 5%，或明显降低跨设备尾部波动；否则番剧和杂谈分别保留最佳固定策略或 native。
- 当前只完成实验基础设施与初始生产样本，尚未执行完整 5 次筛选和 15 次确认矩阵，因此不宣称自定义调度或 adaptive 已带来性能收益，也不把实验策略带入生产。

## 2026-09-21：Base + Refinement Representation Gate

两份第二阶段设计在此按层次合并：Phase-Aware 文档定义 Fetch、Decode、Present 的运行时实验框架；Base + Refinement 文档把工作单元由整张图片细化为 Base、Refinement Layer 和后续可选 Tile。此前已部署的 `native`、`fixed-*` 与 `adaptive` 因此只属于 L0/L1 整图基线，不能作为分层传输有效的证据。

本轮严格先完成 Phase 0/1。新增的 Node-only 原型实现 WebP Base、基于上一级真实重建像素的 residual、确定性定点双线性预测、量化、ZigZag、`uint16 little-endian` 与 Deflate。独立解码器验证 manifest、长度和 SHA-256；量化步长 1 仅用于逐像素 oracle，不属于候选产品格式。生产封面同步、快照 schema、Next Image 和浏览器代码均未改变。

### 数据集与矩阵

- 生产快照版本：`4db062a36e10`，更新时间 `2026-09-10T03:16:32.497Z`。
- 样本为全部 17 张“正在看”加稳定 ID 哈希选择的 83 张“看过”；100/100 下载、解码和重建成功。
- 20 张等距子样本用于筛选 27 个组合：三种层级、Base quality 50/65/80、residual quantization 2/4/8。
- 每个 384 px 与 512 px 终点选择三个 finalist，再在完整 100 张上验证。
- Native 对照为相同终点参考像素的 WebP/AVIF，quality 40/50/60/70/80/90/100；字节比使用达到候选 SSIM（容差 0.005）的最小 Native 文件。
- 原始图片、二进制层和约 2.4 MB 的逐样本 JSON 保留在系统临时目录；仓库只保留紧凑聚合结果。

### Representation 结果

| 终点   | 最佳 finalist                 | SSIM median / P10   | 相对同质量 Native bytes median / P75 | 总 bytes median | Gate  |
| ------ | ----------------------------- | ------------------- | ------------------------------------ | --------------: | ----- |
| 384 px | `layered-4-mobile-base80-q2`  | 0.999281 / 0.998698 | 4.947345 / 6.693632                  |         474,131 | NO-GO |
| 512 px | `layered-4-desktop-base80-q2` | 0.999151 / 0.998639 | 5.099741 / 6.369734                  |         772,641 | NO-GO |

六个 finalist 的重建正确率、Native 匹配覆盖率和逐层质量单调率均为 1；Base 占比中位数约 0.22%–0.33%，Base 加第一层约 7.24%–7.48%，最终质量和中间 Pareto 条件也都通过。唯一且决定性的失败项是总字节开销：要求中位数不超过 1.15、P75 不超过 1.25，实测中位数约 4.95–5.10、P75 约 6.37–6.69。

中位层大小也显示问题集中在 residual，而不是 Base。384 px 候选的 Base 约 1.1–1.6 KB，三级 refinement 约 33 KB、102 KB、335 KB；512 px 候选约为 1.8–2.6 KB、56–58 KB、168 KB、547 KB。简单 RGB residual 即使经过量化和 Deflate，仍远大于成熟 WebP/AVIF 对同类高频信息的表示。

### 结论

Representation Gate 为 **NO-GO**。根据预先确定的停止规则，本轮不实现 Phase 2 浏览器重建、Phase 3 BFS、Phase 4 Tile 或 Phase 5 自适应 quantum，也不运行这些不存在的浏览器策略矩阵。Tile 或调度无法合理弥补约五倍的表示层传输开销。

这不是对 phase-aware 假设的普遍否定，只否定当前 Prototype A：`RGB residual → quantize → ZigZag/u16 → Deflate`。若未来重启研究，应先在独立分支验证 transform、wavelet 或成熟可伸缩编码格式能否把总字节压到 Gate 内，再回到浏览器阶段。生产继续使用 native，现有 L0/L1 实验代码不进入默认路径。

本次离线实验运行于 Node `v24.11.1`、Sharp `0.34.5`、Windows x64；项目与 Vercel 要求 Node 22。编码和重建耗时只作为本机描述值，不能外推为浏览器 CPU、Long Task 或线上性能结论。

## 2026-09-22：Representation Recovery（Prototype B）

本轮将成熟 Progressive JPEG 与 DCT residual 分开研究。Prototype A 的 `fe5a70f` 和 `image-layering-representation-summary.json` 继续冻结；新结果为 [image-representation-recovery-summary.json](./image-representation-recovery-summary.json)。生产保持 native。

### 数据与实现

- 沿用快照 `4db062a36e10` 的同一 100 张封面（17 watching + 83 watched）。生产 TLS 连续 ECONNRESET 后直接复用冻结临时缓存，并逐张校验长度和 SHA-256，未更换样本。
- Prototype B 保留 WebP Base q65、真实前级重建和定点双线性预测；residual 改为 YCbCr 4:2:0 → 边缘复制 → 8×8 DCT → JPEG 量化表乘全局 scale → JPEG zigzag → 零游程/signed varint → Deflate level 6。版本化 manifest 为 v2。
- 20 张固定等距样本筛选三种既有 ladder × 七档 scale（0.0625/0.125/0.25/0.5/1/2/4），目标 SSIM 为 0.95/0.97/0.99。固定网格选中的三档为 0.5/0.25/0.125，实际质量会高于目标；没有逐图片调参。筛选 ID 保存在聚合 JSON。
- Layered-5 在筛选集每一档 scale 上均被对应 Layered-4 的字节与最终 SSIM 支配，故正式 100 张只验证两个终点的六个 Layered-4 profile。
- 编码端模拟直接由量化系数重建，不经过字节解析；独立解码端重新解析序列化 manifest 和压缩层。新增 int32 溢出、截断、校验和、尺寸/plane geometry、inflate 上限保护。
- 首轮完整实验目录为 `nothing-new-representation-recovery-2026-09-22T06-39-04-441Z`。补齐逐样本指标和二进制存档后另建 `nothing-new-representation-recovery-2026-09-22T10-17-22-750Z`；六个 profile 的画质与字节比与首轮完全相同。第二份包含 `formats.json`、`layers/`、`result.json`、`aggregate.json`。

### Progressive JPEG 完整文件基线

Sharp/mozjpeg 使用 `progressive: true`。以下每行均为 100 张，Native 为 WebP/AVIF q40/50/60/70/80/90/100，按 `SSIM ≥ candidate − 0.005` 取最小文件。完整字节 Gate 为 ratio median ≤1.15、P75 ≤1.25。

| 尺寸 | JPEG q | SSIM median / P10 | 文件 bytes median | Native ratio median / P75 | 编码 / 完整解码 ms median | 字节 Gate |
| --- | --- | --- | ---: | --- | --- | --- |
| 384 | 40 | 0.913799 / 0.886699 | 22,200 | 0.976 / 1.049 | 14.564 / 2.548 | GO |
| 384 | 50 | 0.928142 / 0.904462 | 26,035 | 1.151 / 1.222 | 16.168 / 2.713 | NO-GO |
| 384 | 60 | 0.940174 / 0.919319 | 30,126 | 1.321 / 1.407 | 19.156 / 3.347 | NO-GO |
| 384 | 70 | 0.952999 / 0.935514 | 36,060 | 1.511 / 1.630 | 22.947 / 2.983 | NO-GO |
| 384 | 80 | 0.967246 / 0.954078 | 46,048 | 1.620 / 1.768 | 26.870 / 3.477 | NO-GO |
| 384 | 90 | 0.982750 / 0.975925 | 66,475 | 1.628 / 1.819 | 35.878 / 4.271 | NO-GO |
| 384 | 95 | 0.991550 / 0.987909 | 90,773 | 1.747 / 1.953 | 49.935 / 5.244 | NO-GO |
| 512 | 40 | 0.916599 / 0.887577 | 34,835 | 1.054 / 1.171 | 22.996 / 3.861 | GO |
| 512 | 50 | 0.930728 / 0.905931 | 40,918 | 1.229 / 1.361 | 26.462 / 3.799 | NO-GO |
| 512 | 60 | 0.942468 / 0.921365 | 47,575 | 1.394 / 1.518 | 30.315 / 3.752 | NO-GO |
| 512 | 70 | 0.955182 / 0.937625 | 57,057 | 1.623 / 1.738 | 34.386 / 4.159 | NO-GO |
| 512 | 80 | 0.969143 / 0.956252 | 73,214 | 1.632 / 1.781 | 42.701 / 4.752 | NO-GO |
| 512 | 90 | 0.983742 / 0.976575 | 106,105 | 1.682 / 1.830 | 57.020 / 6.889 | NO-GO |
| 512 | 95 | 0.991727 / 0.988917 | 144,295 | 1.801 / 2.030 | 77.879 / 7.600 | NO-GO |

仅 q40 通过这个**离散 Native 网格**下的字节 Gate。其最终 SSIM median 只有 0.914/0.917、P10 只有 0.887，不能代表满足 0.95/0.93 画质底线的替换方案。q70 才达到该画质底线，但字节比 median 已为 1.511/1.623，均超过 Gate。q50 在 384 px 的真实 ratio 为 1.150689，虽四舍五入接近 1.15，仍严格判为失败。

q40 的通过还受 Native 最低 q40 的限制：这不是搜索全部 Native quality 后的同质量最优解，补充 Native q<40 可能使这个 GO 消失。因此只把它作为允许进入局部流式实验的历史判定，不宣称 JPEG 压缩优于 WebP/AVIF。

### 浏览器能力与流式实验

采用隔离 agent-browser 0.38.1 会话，回环 HTTP chunked response，无图片实验开关。每张 JPEG 有 5 个扫描 chunk，首包延迟 200 ms，其后每 250 ms 发送一个完整扫描。Chrome 和 Edge 各运行 10 张等距封面 × 384/512 px × 3 次，共 120 轮。headless、DPR 1、图片按参考像素尺寸显示；该设置是单图机制实验，不是移动端页面性能矩阵。

截图请求间隔设为 100 ms，实际截取、传输与计算使观测间隔约 100–300 ms；保留每次截图的时间窗口。TTR 定义为首个变化截图 SSIM ≥0.50（启发式，不是人工辨认测试），TQ80 为 SSIM ≥0.80；Quality Integral 使用从设置 src 至 load 的 SSIM 左保持积分除以总时长，空白不计画质。load 与最终像素可见时间分别记录，避免把完整接收当作已经呈现。
<!-- RECOVERY_APPEND_CONTINUES -->
