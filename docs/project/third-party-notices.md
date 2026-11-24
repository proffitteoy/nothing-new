---
title: 第三方代码与授权说明
---

# 第三方代码与授权说明

本仓库整体采用 GPL-3.0-only。下列第三方代码继续保留其原始版权声明与许可证文本。

## 观景窗山湖夜景

- 来源：[Convict Lake at night fixed](https://commons.wikimedia.org/wiki/File:Convict_Lake_at_night_fixed.jpg)，原摄影 TheDailyNathan，镜头畸变校正 Hike395。
- 授权：[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)，图片及其衍生作品单独沿用此许可。
- 使用位置：`public/home-window/convict-lake-night.webp`；首页窗台的「景观来源」链接提供公开署名及许可。
- 修改：以原摄影为编辑目标，使用内置 imagegen 制作克制的午夜数字绘景，保留山体、湖岸和观察位置；随后裁去顶部 156px 并编码 WebP。没有混入其他摄影或网站截图。
- 公开署名台账与提示词摘要：`public/home-window/NOTICE.txt`；完整编辑提示词见[观景窗方案第 11 节](Nothing_New_观景窗首页_视觉与开发方案_2026-11-17.md)。官方 3840px 源图和未压缩编辑结果保存在工作树忽略目录 `.sync/tmp-night-window/`，不随首屏下载。
- Late Shift 等未明确授权的参考代码没有复制到本项目。

## 日间观景窗审阅候选（2026-11-17）

- 使用同一份 TheDailyNathan / Hike395 授权摄影原稿，经内置 imagegen 重新制作冷晨天空、山体日照与湖面倒影；不以午夜成品提亮，也未拼入旅游网站摄影。
- 候选为 `public/home-window/convict-lake-day-study.webp`，1672×877，272,712 bytes；衍生图片继续采用 CC BY-SA 3.0。它是 AI 辅助绘景，不声称为实拍日景或精确地形测绘。
- 完整来源、修改过程与实际提示词见 `public/home-window/NOTICE-day-study.txt`；未压缩生成图保存在忽略目录 `.sync/tmp-day-window/day-source.png`。
- 当前正式首页源码已引用该日景，并以单一合成器实现局部水面响应。该分支的本地生产构建已验证，尚未部署或取得人工美术认可。

## 室内透明前景（2026-11-18）

- 当前审阅稿使用 `public/home-window/observation-room-open.webp`：1585×992、910,632 bytes，由原室内前景经内置 imagegen 调整窗洞、浅木材质与自然受光，无损编码并保留 alpha。完整实际提示词、源资产与许可见 `public/home-window/NOTICE-observation-room-open.txt`；此衍生物继续 CC BY-SA 3.0。
- `public/home-window/observation-room.webp`：内置 imagegen 生成的完整室内前景，1586×992，1,064,508 bytes，窗洞保留 alpha；无损编码 WebP。
- 以原授权日景确定光线/视口，另参考室内摄影与交互站的空间组织，不把网站截图作为运行时纹理或复制其代码。
- 生成过程、参考角色和提示摘要见 `public/home-window/NOTICE-observation-room.txt`。该前景与湖景分别加载，此素材采用 CC BY-SA 3.0；站点代码继续 GPL-3.0-only。

## 薄云、枝叶与室内受光派生素材（2026-11-18）

- `ambient-sky.webp`、`ambient-clouds.webp`、`ambient-branch.webp` 来自当前授权日景，经内置 imagegen 提取／重建和天空补全；保留原日景及室内文件，采用 CC BY-SA 3.0。透明云层和枝叶只做尺寸规范化、裁切与无损编码。
- `ambient-sky-region.png` 是原图颜色与保护边界生成的数值天空遮罩；`ambient-room-light.png` 是针对当前房间手工编写的接收面投影和直射贡献图。它们不代表摄影深度、反照率或真实光照烘焙。
- 来源、许可、实际完整提示词、离线导出方法及失败候选见 [NOTICE-ambient.txt](../../public/home-window/NOTICE-ambient.txt)。原始生成 PNG 保留在本地忽略目录 `.sync/tmp-ambient-window/source/`。
- **倒影配准未通过，运行时保持关闭**：生成清理底图改变了原水纹，合成后出现局部蓝块；不发布该候选，不声称已清除旧云倒影或实现同步倒影。

## Quartz

- 来源：`jackyzha0/quartz`
- 上游仓库：https://github.com/jackyzha0/quartz
- 授权：MIT
- 本仓库使用位置：`quartz/`、`quartz.config.ts`、`components/notes/` 及 `lib/notes/` 内容渲染代码
- MIT 文本：`docs/licenses/Quartz-MIT.txt`

## MmzMing 文件夹关系图

- 来源：[MmzMing/my-blog](https://github.com/MmzMing/my-blog)，经本站友链的[图谱页](https://tblog.mmzhiku.xyz/categories/)定位。
- 固定版本：`524fd989bd332c7480033aef6983f8423ced63cc`，上游 `src/utils/graph/` 与图谱数据类型。
- 授权：MIT；原许可保留 saicaca、CuteLeaf 署名，图谱实现归属 MmzMing。
- 使用位置：`app/papers/graph/`，由 `PaperFolderGraph.tsx` 接入 Zotero 文件夹和已读论文。
- 修改：移除 Astro／Swup 导航，接入本站论文预览与固定色板；适配真实文件夹层级、分支框选、标签字号及文字避让。不复制原站文章或图片。
- 许可文本：`docs/licenses/MmzMing-Graph-MIT.txt`。

## Mineradio 音乐链路与历史粒子视觉

- 来源：`XxHuberrr/Mineradio`
- 上游仓库：https://github.com/XxHuberrr/Mineradio
- 授权：GPL-3.0
- 当前音乐链路：`app/api/music/_mineradio.ts` 的按 ID 歌曲详情与歌词获取；历史 `MineradioParticleField` 和独立音乐页已退役
- GPL 文本：`docs/licenses/Mineradio-GPL-3.0.txt`

历史说明：音乐页的粒子舞台曾在用户确认接受 GPL-3.0 授权影响后，移植并改造 Mineradio `public/index.html` 中的封面粒子、壁纸粒子与 bloom Shader 分支。相关组件现已删除，来源及授权记录继续保留；2026-11-12 清理的天气/搜索分支不影响现行按 ID 获取歌曲与歌词。

## XHBlogs 杂谈卡片与活动热力图

- 来源：heiehiehi/XinghuisamaBlogs
- 上游仓库：https://github.com/heiehiehi/XinghuisamaBlogs
- 授权：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
- 当前使用位置：`components/ChatterBoard.tsx`；历史关于页活动热力图已在三章节重构中删除
- 修改说明：杂谈页保留搜索与封面卡片的交互思路，并将卡片精简为封面和标题；历史活动热力图曾借鉴其布局表现。未复制上游个人内容与图片，退役实现的来源与授权记录继续保留。

本节 XHBlogs 改编内容仅可用于非商业用途，使用与再发布时需保留原作者、上游链接、修改说明和 CC BY-NC 4.0 许可声明。

## 湖景周边补全（2026-11-24）

- `public/home-window/lake-periphery-v1.webp`：2172×724、430,274 bytes；以现有授权湖景经内置 imagegen 扩展视野，采用 CC BY-SA 3.0。原首页资产保留不变。
- 转场中通过 SIFT／RANSAC 特征配准的 UV 使用完整连续宽景，水面仍为实际水平几何。生成结果属于艺术近似，不声称精确地形或像素保真的摄影扩展。
- 来源、实际两次提示词、配准矩阵及工具说明见 [NOTICE-periphery.txt](../../public/home-window/NOTICE-periphery.txt)。PNG 只进行 WebP 编码；原生成文件保留在本地 Codex 生成目录。
