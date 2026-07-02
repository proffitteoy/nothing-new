---
title: 项目文档
---

# 项目文档

这里集中放本仓库特有的维护说明。`docs/` 根目录的大部分内容仍是上游 Quartz 文档，尽量保持原样；和个人博客仓库相关的补充文档放在 `docs/project/`。

## 文档地图

- [[obsidian-sync|Obsidian 同步到博客]]：写作源、同步规则、审阅流程和删除行为。
- [[third-party-notices|第三方代码与授权说明]]：记录项目中直接引入或改造的第三方代码来源和授权边界。
- `scripts/README.md`：Node 脚本、Windows 双击入口和旧上传脚本说明。
- `README.md`：仓库目录职责、常用命令和部署约定。

## 整理约定

- 项目专属文档优先放在 `docs/project/`，不要和上游 Quartz 教程混在一起。
- 自动化脚本放在 `scripts/`；常用 Windows 双击入口保留在仓库根目录。
- `public/blog/`、`.next/`、`tsconfig.tsbuildinfo` 都是生成物，不手动维护。
- 修改同步规则后，先运行 `npm run sync:obsidian:dry` 或 `npm run sync:obsidian:check` 再正式同步。
