---
title: 音乐粒子中等能力恢复规格
---

# 音乐粒子中等能力恢复规格

## 1. 状态、基线与边界

本文是中等难度粒子能力的可执行技术规格，基线为 `20b9fee`。第二阶段只落地歌词位置和中央障碍修复；本文描述的真实频谱、CSS 频谱、多预设、交互相机和 CPU 封面分析均为后续实施项，不能据此宣称已经上线。

必须保持的现状：

- `/music` 中央区域不再渲染歌词组件或 `data-field-obstacle`，只显示页面粒子与全站粒子。
- 底部播放控制条是音乐页唯一的粒子障碍。
- 不修改全站粒子数量、速度、几何、Canvas 层级，以及 `FieldBack`/`FieldFront` 既有的 `36px`/`4px` 障碍边距。
- 不新增手动预设切换控件，不使用双场景交叉渲染。

明确的非目标：

- 不引入 AI 深度模型、Transformers.js 或远程推理服务。
- 不把高频分析帧写入 React state、Context value 或事件总线。
- 不为频谱失败阻断、暂停或重建正在播放的音频。
- 不照搬 Mineradio 的完整播放器、手势识别、自由相机或 AI depth 分支。

## 2. 目标数据流

```text
用户点击播放
    │
    ├─ MusicProvider.ensureAudioGraph()
    │      └─ 唯一 HTMLAudioElement
    │           └─ 唯一 MediaElementAudioSourceNode
    │                └─ AnalyserNode (fftSize = 2048)
    │                     ├─ 约 30 FPS 采样与归一化
    │                     └─ audioAnalysisRef.current
    │                          ├─ MineradioParticleField / WebGL uniforms
    │                          └─ 底部歌词后的 24 根 CSS 频谱条
    │
    └─ audio.play()，分析链失败时仍正常播放

封面 URL
    └─ 空闲任务中的 256×256 CPU 分析
         └─ RGBA 深度纹理 + 18 项 LRU
              └─ MineradioParticleField cover/depth uniforms

歌曲 ID ──稳定哈希──> 播放态预设 [0, 1, 2, 4]
播放暂停 ──────────> Wallpaper Pulse（预设 5）
Pointer/Wheel ─────> 单一粒子相机的旋转、惯性与距离
```

音频只产生一份分析帧。WebGL 和 CSS 消费同一个 ref；两者不得各自创建 `AudioContext`、`AnalyserNode` 或采样循环。

## 3. 固定接口

接口放在 `components/MusicProvider.tsx`，所有数值均归一化到 `[0, 1]`。`spectrum` 的实例和 `audioAnalysisRef` 本身在 Provider 生命周期内保持稳定，只原地更新内容。

```ts
import type { RefObject } from "react"

export type AudioAnalysisFrame = {
  available: boolean
  updatedAt: number
  bass: number
  mid: number
  treble: number
  beat: number
  energy: number
  spectrum: Float32Array // 固定长度 24
}

interface MusicContextType {
  // 保留现有字段
  audioAnalysisRef: RefObject<AudioAnalysisFrame>
}

type MineradioParticleFieldProps = {
  // 保留现有字段
  analysisRef: RefObject<AudioAnalysisFrame>
}
```

初始帧和降级帧为 `available: false`、五个标量为 `0`、24 个频谱值为 `0`。`updatedAt` 使用 `performance.now()`；它只用于判断帧是否过期，不参与 React 渲染。

## 4. 真实频谱

### 4.1 音频图生命周期

`MusicProvider` 在正常播放与切歌路径中必须始终渲染同一个 `<audio>` 节点，只更新 `src`，避免重复绑定。播放列表加载后先做一次不改变播放元素的 CORS 资格检查：同源 URL 直接合格；跨域 URL 只有在 CORS fetch 可读时才合格，并且必须在赋值 `src` 前给播放元素设置 `crossOrigin="anonymous"`。当前播放列表存在任一不合格或未知 URL 时，本次 Provider 生命周期完全不创建 MediaElementSource，继续走原生播放并将分析标为不可用。

新增的 `ensureAudioGraph()` 只从 `togglePlay` 或其他明确的用户播放手势中调用：

1. 首次手势创建一个 `AudioContext`。
2. 对该长期存在的 `<audio>` 只调用一次 `createMediaElementSource(audio)`；保存 source，不允许在暂停、切歌或 Context 重新渲染时重建。
3. 创建一个 `AnalyserNode`，设置 `fftSize = 2048`、`smoothingTimeConstant = 0.58`。
4. 连接 `source -> analyser -> audioContext.destination`。
5. 浏览器将 Context 挂起时，只在下一次用户手势中调用 `resume()`。
6. Provider 卸载时取消采样 RAF、断开节点并关闭 Context；普通暂停或切歌不得关闭。

若 source 已创建而 analyser 后续初始化失败，应尝试 `source -> destination` 直连。动态换入的新播放列表必须先重复资格检查；若已有图却出现不合格 URL，唯一允许的恢复是用未绑定 source 的新 `<audio>` 接管同一 URL、音量和当前进度，并在该 Provider 剩余生命周期永久关闭分析，不得对新元素再次调用 `createMediaElementSource`。

上述门禁是播放优先级的一部分：未提供 ACAO 的音源不能直接加 `crossOrigin="anonymous"`，也不能先绑定 source 再等待全零检测，因为 CORS 污染的 MediaElementSource 会输出静音。任何资格检查或建图异常只把分析标为不可用并记录一次开发日志，不改变 `isPlaying`，也不阻止 `audio.play()`。

### 4.2 采样与数值

- 使用 `requestAnimationFrame` 加 33 ms 时间门控，最多约 30 FPS；页面隐藏时停止读取。
- 每次读取 1024 个频域 byte 和 2048 个时域 byte，不创建新数组。
- 24 个频谱段采用对数边界：第 `i` 个边界为 `45 × (min(16000, Nyquist) / 45)^(i / 24)` Hz；每段取 bin 的 RMS，再归一化。
- `bass` 汇总 38–420 Hz，`mid` 汇总 420–6200 Hz，`treble` 汇总 6200 Hz 至 `min(16000, Nyquist)`；`energy` 取时域 RMS，并用缓慢衰减的动态峰值归一化。
- `beat` 是低频上升沿包络，不是布尔值：当归一化低频上升量至少 `0.075`、bass 至少 `0.32`、energy 上升量至少 `0.020` 且距上次触发至少 120 ms 时置为 `1`，随后按 `0.36^(dt×60)` 衰减。
- bass、mid、treble、energy 使用快攻慢释，避免条形抖动；停止采样前先把目标值设为零并完成衰减。

### 4.3 可用性判定

`createMediaElementSource` 成功不等于拿到了可分析数据。播放时若 `currentTime` 持续前进，但连续 90 个采样帧（约 3 秒）频域全为 0 且时域样本相对 128 的偏差全为 0，则将 `available` 设为 `false`。采样器继续低频探测；之后出现非零数据时可恢复为 `true`，避免把真实的静音前奏永久判为跨域失败。

消费者规则固定如下：

- `available === true`：WebGL 与 CSS 都读取真实帧。
- `available === false` 或帧超过 250 ms 未更新：WebGL 使用现有合成驱动，CSS 频谱隐藏。
- 分析失败不更改播放源，不显示“真实频谱”假数据。

## 5. CSS 频谱

在 `MusicClient` 底部当前歌词容器内增加 24 根 `aria-hidden` 的条形，作为文字后的弱化背景层：

- 容器绝对定位、`pointer-events: none`，不得改变控制条尺寸。
- 条形以底部为 transform origin，只直接写 `element.style.transform = scaleY(...)`；不得每帧 setState。
- 总体透明度按 energy 在 `0.12–0.28` 之间映射，歌词文字保持更高层级和可读对比度。
- CSS 更新循环读取 `audioAnalysisRef.current.spectrum`，与分析帧同为最多 30 FPS；不做布局读取。
- 暂停、静音、分析不可用或帧过期时，条形在 180–240 ms 内平滑归零，归零后容器透明度为 0。
- `prefers-reduced-motion: reduce` 下不播放过渡，所有条形固定为零并隐藏。

频谱层只能使用真实 analyser 数据。WebGL 的合成回退不得传给 CSS。

## 6. 自动粒子预设

播放态候选池固定为：

| 上游编号 | 名称   |
| -------- | ------ |
| `0`      | Silk   |
| `1`      | Tunnel |
| `2`      | Orbit  |
| `4`      | Vinyl  |

选择函数固定为：

```ts
const PLAYING_PRESETS = [0, 1, 2, 4] as const
const preset = PLAYING_PRESETS[hashSeed(String(song.id)) % PLAYING_PRESETS.length]
```

同一歌曲 ID 始终得到同一预设，不使用随机数，不提供手动切换 UI。暂停态继续使用预设 `5`（Wallpaper Pulse）；恢复播放时回到该歌曲稳定分配的播放态预设。

切歌时在同一个 song/cover effect 中同时提交新封面和新预设，使拓扑切换与现有封面渐变同帧开始；沿用现有 burst 掩盖瞬时变化。只保留一个 renderer、scene、geometry 和 material，不通过同时渲染两个粒子场做 crossfade。

## 7. 拖拽、惯性与滚轮缩放

### 7.1 事件边界

- 在 Canvas 上使用 Pointer Events，并在 `pointerdown` 后调用 `setPointerCapture(pointerId)`；在 `pointerup`、`pointercancel` 和卸载时释放。
- 当前全屏视觉包装器可保持 `pointer-events: none`，但 Canvas 本身需显式 `pointer-events: auto`；导航、底部控制条、队列和其他更高 z-index 的 UI 继续优先接收事件。
- 只响应主指针和鼠标主键。Canvas 设置 `touch-action: none`，但不得在 UI 控件上捕获或 `preventDefault`。
- wheel 监听为 `{ passive: false }`，仅当事件实际落在 Canvas 且未命中 UI 时阻止默认行为。

### 7.2 固定参数

每次拖动位移：

```text
rotation.x += deltaY × 0.0032
rotation.y += deltaX × 0.0034
angularVelocity = clamp(deltaRotation / dt × 0.46, -6.2, 6.2)
```

释放后每帧先积分旋转，再按 `0.90^(dt×60)` 衰减角速度；`dt` 夹在 `1/120–0.08` 秒。减少动态效果模式仍允许直接拖拽，但释放时立即把角速度清零，完全禁用惯性。

滚轮只修改粒子相机距离，不缩放页面、不改变 UI：

- 延续上游步长：`targetDistance += deltaY × 0.005`。
- 桌面夹在 `5.4–11.5`。
- 移动端夹在 `6.2–12.8`。
- RAF 中对实际距离做阻尼逼近；不修改浏览器 zoom、FOV 或 DOM transform。

## 8. CPU 封面分析

### 8.1 管线与通道

封面显示和音乐播放不等待分析。单独创建用于分析的 Image，尝试匿名 CORS；加载成功后在空闲任务中按与封面纹理一致的 UV 方向归一化到 `256×256`：

1. 计算亮度 `0.299R + 0.587G + 0.114B`。
2. 对亮度执行半径 4 的水平 box blur，再执行垂直 box blur。
3. 在模糊结果上计算 Sobel 梯度并归一化为边缘值。
4. 启发式深度取 `0.45 × blurredLuminance + 0.55 × centerBias`。
5. 高对比前景遮罩取 `clamp(0.6 × depth + 0.5 × edge)`。

输出一张 `256×256` RGBA 纹理：

| 通道 | 含义           |
| ---- | -------------- |
| R    | 启发式深度     |
| G    | Sobel 边缘     |
| B    | 高对比前景遮罩 |
| A    | 原始亮度       |

本方案明确不加载 Mineradio 的 Xenova/depth-anything AI 分支，`uAiBoost` 保持关闭或移除。

### 8.2 调度、缓存与竞态

- 使用 `requestIdleCallback` 分片执行，`timeout` 为 1500 ms；不支持该 API 时用 `setTimeout` 调度同一分片状态机。
- 每个分片最多占用 8 ms，切歌后旧任务以递增 token 判定过期，结果不得覆盖新封面。
- 缓存键为封面 URL 的稳定哈希，LRU 最多 18 项；命中时刷新最近使用顺序。
- 每项只保存最终 RGBA 数据/Canvas 和必要元数据，不保留中间 Float32Array。

### 8.3 失败路径

分析 Image 的 CORS 失败、`drawImage`/`getImageData` 抛出 Canvas 污染错误、内存不足或任务异常时：

- 立即丢弃中间数据并写入中性纹理 `RGBA = (128, 0, 0, 255)`。
- 将 `uHasDepth = 0`，使 shader 不使用 R 通道位移；封面颜色纹理仍照常显示。
- 只记录一次开发日志，不重试当前 URL，不改变播放状态，不隐藏封面。

## 9. 实施顺序

1. 在 `MusicProvider` 增加固定 `AudioAnalysisFrame`、长期 `<audio>`、唯一音频图和 ref；先用单元测试证明暂停、切歌不会重建 source。
2. 加入 30 FPS 分析循环、24 段对数采样、过期/跨域健康判定和清理逻辑。
3. 给 `MineradioParticleField` 增加 `analysisRef`，真实数据可用时写 uniforms，不可用时保持现有合成数据。
4. 在底部歌词后加入 CSS 频谱，并验证它只消费真实数据且不触发 React 高频重渲染。
5. 按歌曲 ID 接入四个播放态预设和暂停态 Wallpaper Pulse，使切歌与封面渐变/burst 同步。
6. 实现 CPU RGBA 分析、取消 token、中性纹理和 18 项 LRU。
7. 最后接入 Pointer capture、旋转惯性和相机距离；交互调试不得改变 UI 命中层级。

每一步独立提交并通过降级测试后再进入下一步；不得把音频图、CPU 分析和相机交互一次性合并，以便定位播放静音、跨域或性能回归。

## 10. 降级矩阵

| 场景                           | 播放                            | WebGL                  | CSS 频谱 | 深度/交互         |
| ------------------------------ | ------------------------------- | ---------------------- | -------- | ----------------- |
| Web Audio 不支持或初始化抛错   | 正常                            | 现有合成驱动           | 隐藏     | 其余能力正常      |
| Context suspended              | 正常或等待原播放手势            | 合成，下一手势 resume  | 隐藏     | 不受影响          |
| CORS 资格检查失败              | 原生播放，不绑定 source         | 合成                   | 隐藏     | 不受影响          |
| 已绑定后换入不合格 URL         | 新原生 audio 接管并永久关闭分析 | 合成                   | 隐藏     | 不受影响          |
| 暂停或静音                     | 暂停/静音符合用户操作           | 暂停态预设 5           | 平滑归零 | 拖拽仍可用        |
| 分析帧超过 250 ms              | 正常                            | 合成                   | 隐藏     | 不受影响          |
| 封面 CORS/Canvas 污染/计算失败 | 正常                            | 保留封面颜色，关闭深度 | 不受影响 | 中性纹理          |
| `requestIdleCallback` 不支持   | 正常                            | 延后分片计算           | 不受影响 | `setTimeout` 回退 |
| `prefers-reduced-motion`       | 正常                            | 保留静态/低动态表现    | 固定为零 | 禁用惯性          |

## 11. 性能预算

| 项目         | 预算                                                             |
| ------------ | ---------------------------------------------------------------- |
| 音频采样     | 最多 30 FPS；JS 处理 p95 ≤ 1.5 ms/次；稳态无 React commit        |
| CSS 频谱     | 24 次 transform 写入 p95 ≤ 0.5 ms/帧；无强制布局；控制条 CLS = 0 |
| CPU 封面分析 | 单分片 ≤ 8 ms；完整分析桌面 p95 ≤ 50 ms、移动端 p95 ≤ 120 ms     |
| 深度缓存     | 18 项最终纹理约 4.5 MiB，含元数据总预算 ≤ 6 MiB                  |
| WebGL 切换   | 不增加第二 scene/renderer；不因预设切换增加常驻 draw call        |
| 交互帧       | 桌面 60 Hz 测试 p95 ≤ 20 ms；390×844 模拟移动端 p95 ≤ 33 ms      |

若任一预算失败，先降低采样/空闲任务频率或分片粒度；不得通过伪造 CSS 频谱、删除降级判断或增加双场景渲染绕过门槛。

## 12. 验收门槛

功能验收：

- 首次播放手势后只存在一个 AudioContext、一个 MediaElementAudioSourceNode 和一个 AnalyserNode；暂停、恢复、切歌十次仍不增加。
- 同一歌曲刷新后仍命中同一播放态预设；候选只能是 Silk、Tunnel、Orbit、Vinyl，暂停只使用 Wallpaper Pulse。
- WebGL 与 CSS 同读一个 `audioAnalysisRef`，React Profiler 中不存在约 30 FPS 的 Provider/音乐页提交。
- 断开 ACAO 的测试音源仍能播放，CSS 频谱不可见，WebGL 明确走合成回退。
- CPU 测试图能逐通道验证 R=depth、G=edge、B=foreground、A=luminance；污染 Canvas 时 `uHasDepth=0`。
- Pointer 拖拽在 Canvas 生效，控制条/队列优先；释放有惯性，reduced motion 下无惯性；滚轮距离不越界。

UI 回归：

- 桌面歌词在歌曲信息和控制按钮之间，390×844 下独占一行；逐句更新不改变控制条高度。
- 浅色、深色模式中央均无矩形粒子空洞；底部控制条仍被 `36px`/`4px` 规则避让。
- 播放、暂停、切歌、拖进度和打开队列后，`currentLyric` 继续更新。

工程验证：

```text
npx eslint app/music/MusicClient.tsx components/MusicProvider.tsx components/MineradioParticleField.tsx
npm run typecheck
npm test
npm run build
git diff --check
```

还需用 Performance/React Profiler 记录 60 秒播放、10 次切歌和一次跨域失败样本；静态检查通过不能替代 FPS、音频可听性或视觉验收。

## 13. Mineradio 上游映射与授权

| Mineradio 上游文件                                          | 采用的依据                                                    | 本项目未来落点                          |
| ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `public/js/modules/05-playback/08-audio-graph-controls.js`  | MediaElementSource 生命周期、Analyser 初始化、播放链兜底      | `components/MusicProvider.tsx`          |
| `public/js/modules/11-main-loop.js`                         | `getByteFrequencyData`、频段 RMS、动态峰值、低频 onset        | `components/MusicProvider.tsx`          |
| `public/js/modules/02-visual/00-pointer-cover-particles.js` | Silk/Tunnel/Orbit/Vinyl/Wallpaper、Canvas drag、wheel `0.005` | `components/MineradioParticleField.tsx` |
| `public/js/modules/10-shell/00-gesture-control.js`          | `0.0032`、`0.0034`、`0.46`、`6.2`、`0.90` 惯性参数            | `components/MineradioParticleField.tsx` |
| `public/js/modules/02-visual/15-ripples-cover-depth.js`     | 256² CPU 纹理、RGBA 通道、中性纹理、18 项 LRU                 | `components/MineradioParticleField.tsx` |

Mineradio 为 GPL-3.0，本仓库为 GPL-3.0-only。后续若移植或改写上述实现，必须保留 `components/MineradioParticleField.tsx` 中的来源注释、`docs/licenses/Mineradio-GPL-3.0.txt` 和 `docs/project/third-party-notices.md` 的说明。本文只锁定行为和参数，不授权引入上游 AI depth 代码或其他未列出的模块。
