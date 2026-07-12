---
title: 第三方代码与授权说明
---

# 第三方代码与授权说明

本仓库整体采用 GPL-3.0-only。下列第三方代码继续保留其原始版权声明与许可证文本。

## Quartz

- 来源：`jackyzha0/quartz`
- 上游仓库：https://github.com/jackyzha0/quartz
- 授权：MIT
- 本仓库使用位置：`quartz/`、`quartz.config.ts`、`quartz.layout.ts` 及相关内容渲染代码
- MIT 文本：`docs/licenses/Quartz-MIT.txt`

## Mineradio 粒子视觉

- 来源：`XxHuberrr/Mineradio`
- 上游仓库：https://github.com/XxHuberrr/Mineradio
- 授权：GPL-3.0
- 本仓库使用位置：`components/MineradioParticleField.tsx`
- GPL 文本：`docs/licenses/Mineradio-GPL-3.0.txt`

说明：音乐页的粒子舞台在用户确认接受 GPL-3.0 授权影响后，移植并改造了 Mineradio `public/index.html` 中的封面粒子、壁纸粒子与 bloom Shader 分支，使其可以在本项目的 Next.js/React 页面中运行。
