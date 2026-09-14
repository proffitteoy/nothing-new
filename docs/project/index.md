---
title: 项目文档
---

# 项目文档

这里集中放本仓库特有的维护说明；上游框架教程已经移除，只保留本站当前维护所需的文档、截图和第三方许可证。

## 文档地图

- [[obsidian-sync|Obsidian 同步到博客]]：写作源、同步规则、审阅流程和删除行为。
- [[image-performance-audit|图片加载性能审计]]：记录加载优先级、响应式传输、私有 Blob 缓存和待部署验证项。
- [[third-party-notices|第三方代码与授权说明]]：记录项目中直接引入或改造的第三方代码来源和授权边界。
- `scripts/README.md`：Node 脚本、Windows 双击入口和旧上传脚本说明。
- `README.md`：仓库目录职责、常用命令和部署约定。

## 整理约定

- 项目专属文档统一放在 `docs/project/`。
- 自动化脚本放在 `scripts/`；常用 Windows 双击入口保留在仓库根目录。
- `.quartz-cache/next/`、`public/quartz-assets/`、`.next/`、`tsconfig.tsbuildinfo` 都是生成物，不手动维护。
- 修改同步规则后，先运行 `npm run sync:obsidian:dry` 或 `npm run sync:obsidian:check` 再正式同步。
