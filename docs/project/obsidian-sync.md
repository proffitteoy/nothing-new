---
title: Obsidian 同步到博客
---

# Obsidian 同步到博客

这个仓库提供了一套单向同步脚本，把 `E:\math` 里的公开内容同步到 `content/`。

目标是把“写作”和“发布”分开：

- 写作继续放在 Obsidian 的 `E:\math`
- 博客继续只认 Quartz 的 `content/`
- 你只需要对每篇笔记做一次是否发布的决策

## 网页阅读排版

笔记与杂谈共用 Quartz 渲染链。正文按 Obsidian 默认阅读模式处理：单次换行显示为换行，空行分隔段落；连续空行不额外生成空段落。普通行内空格遵循 Markdown/HTML 的折叠规则，需要保留的代码缩进请使用代码块。代码、公式、Callout 和内部链接仍由原有插件处理，不通过改写源文或全局 `white-space: pre-wrap` 模拟排版。

`NoteShell` 的正文样式由 `quartz/styles/custom.scss` 生成到 `note.css`，独立恢复段落间距、列表缩进与标题层级，不依赖旧版 Quartz 布局。网页保留自身字体与昼夜配色，不复制 Obsidian 主题的全部样式。

阅读页的标题、正文、探索栏、目录和反向链接面板均标记为 Field Mode 障碍物；仅登记实际卡片，不登记撑满高度的网格列，沿用已有包围圆避让与安全间距。

## 文件说明

- `obsidian-sync.config.mjs`：同步根目录和运行参数。
- `.sync/obsidian-sync.include.txt`：允许同步的路径或 glob。
- `.sync/obsidian-sync.exclude.txt`：显式禁止同步的路径或 glob。
- `.sync/obsidian-sync-state.json`：运行时状态文件，记录已管理文件和笔记扫描快照，不提交到 git。
- `scripts/obsidian-sync.mjs`：实际同步脚本。
- `同步博客.bat`：Windows 双击入口，自动审阅新/改动笔记后再同步。
- `审阅未决笔记.bat`：Windows 双击入口，只做决策，不执行同步。

## 常用命令

```bash
npm run sync:obsidian:init
npm run sync:obsidian
npm run sync:obsidian:dry
npm run sync:obsidian:check
npm run sync:obsidian:review
npm run sync:obsidian:review:all
```

如果你在 PowerShell 里遇到 `npm.ps1` 被执行策略拦截，请改用：

```bash
npm.cmd run sync:obsidian
```

## 推荐工作流

1. 第一次使用时运行 `npm run sync:obsidian:init`
2. 以后平时只在 `E:\math` 写作
3. 每次写完后直接运行 `npm run sync:obsidian`
4. 如果有新建或改过、但还没决定是否发布的笔记，程序会逐篇询问
5. 你对每篇笔记只需要做一次 `加入` 或 `忽略` 决策
6. 然后照常执行 Quartz 的构建或部署命令

## 自动审阅机制

默认的 `npm run sync:obsidian` 会先做两件事：

1. 自动扫描 `E:\math` 里新建或改动过、但尚未决定是否发布的 Markdown 笔记
2. 在终端里逐篇询问你是否加入博客

可用输入如下：

```txt
y = 加入博客
n = 永久忽略
s = 暂时跳过
q = 退出本轮审阅
```

一旦你选了 `y` 或 `n`，这篇笔记以后就不会再问：

- 选了 `y`：后续内容更新会自动同步
- 选了 `n`：后续不会上传，也不会再提示
- 选了 `s`：本次先不处理，只有这篇笔记以后再次改动时才会再提示

如果你只想做决策、不立刻同步：

- `npm run sync:obsidian:review`：只审阅最近新建或改动过的未决笔记
- `npm run sync:obsidian:review:all`：把所有还没决定的笔记重新过一遍

## 规则格式

同步清单默认按“字面路径”处理，路径都相对 `E:\math`。

如果你需要通配符，显式写 `glob:` 前缀：

```txt
math/Carleman不等式.md
glob: math/**/*.md
glob: 图片/**/*
glob: 数学建模/读优秀论文杂记/*.md
```

排除清单同样支持 glob，例如：

```txt
glob: **/未命名*.md
glob: misc/private/**
```

如果你有整类永远不需要审阅或上传的目录，也可以直接在排除清单里写 glob。

## 附件同步

一篇已经批准发布的 Markdown 笔记，在同步时会自动带上它引用到的本地附件，例如：

- `png/jpg/gif/svg/webp`
- `pdf`
- 其他带扩展名的本地文件

这样你通常只需要对“笔记”做一次决定，不需要再为同一篇笔记里的图片逐个确认。

## 删除行为

同步脚本会记录“哪些文件由同步系统接管过”。

如果某个文件之前被同步过，后来又从 include 中移除，或者被加入 exclude，下一次执行 `npm run sync:obsidian` 时，它在 `content/` 里的对应文件会被删除。

这样可以保证博客目录和同步配置保持一致，避免已经取消发布的文章继续残留在博客里。

## 注意事项

- 这是单向同步：`E:\math -> content`
- 请不要把 `content/` 当作主编辑目录
- 如果你想先看会发生什么，用 `npm run sync:obsidian:dry`
- 如果你只想检查“当前是否还有未同步变化”，用 `npm run sync:obsidian:check`

## 默认排除目录

为避免误发布，系统默认排除 `笔记共享vault` 目录（`笔记共享vault/**` 与 `**/笔记共享vault/**`）。

- 该目录下的文件不会进入“未决审阅”列表。
- 该目录下的文件不会被同步到 `content/`。
- 如需发布其中内容，请先移动到其他目录后再审阅/同步。
