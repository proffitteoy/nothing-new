---
title: 第三方代码与授权说明
---

# 第三方代码与授权说明

本仓库整体采用 GPL-3.0-only。下列第三方代码继续保留其原始版权声明与许可证文本。

## Quartz

- 来源：`jackyzha0/quartz`
- 上游仓库：https://github.com/jackyzha0/quartz
- 授权：MIT
- 本仓库使用位置：`quartz/`、`quartz.config.ts`、`components/notes/` 及 `lib/notes/` 内容渲染代码
- MIT 文本：`docs/licenses/Quartz-MIT.txt`

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

上述改编内容仅可用于非商业用途，使用与再发布时需保留原作者、上游链接、修改说明和 CC BY-NC 4.0 许可声明。
