# TDA 论文周报

首页原“研究工作台”图片卡片现为 TDA 文献雷达入口，保留 `/profile-studio.png` 和原卡片高度。点击图片后打开居中的周报窗口，展示本期论文按钮、往期日期选择和综合判断；点击论文后在周报窗口上方再叠加阅读窗口，正文在窗口内部滚动。返回时保留底层论文列表，关闭周报后回到首页图片，不撑高首页。移动端论文按钮为单列，深色模式沿用站点主题。

两个窗口使用原生模态 `dialog`，提供焦点限制与关闭后的焦点恢复；Escape 和遮罩点击只关闭当前最上层窗口。打开周报期间锁定首页滚动。后台更新若在阅读期间到达，会等周报关闭后再应用，避免中途切换当前论文。

## 数据链路

```text
私有 tda-paper-monitor/reports/YYYY-MM-DD.md
  → Send TDA report / sync-blog（与邮件独立）
  → POST https://nothing-new.cn/api/papers
  → 私有 Vercel Blob / papers/reports.json
  → GET /api/papers → 首页论文卡片
```

Action 在每次正常报告 push、补发请求或手动运行时，同步最近 52 期报告，覆盖同日期内容，因此修订不会生成重复条目。博客只接收报告路径与 Markdown，不接收 GitHub 凭据、邮件配置或仓库其他文件。访客可公开阅读这些报告；私有仓库的其他内容仍保持私有。

## 一次性配置与启用

1. 先部署博客端代码，沿用现有私有 Blob 配置（`BLOB_READ_WRITE_TOKEN`，或 `BLOB_STORE_ID` 与 Vercel OIDC）。
2. 生成随机共享密钥，在博客 Vercel 环境变量中设置 `PAPERS_SYNC_SECRET`，在监控仓库 Actions secret 中设置相同值的 `BLOG_SYNC_SECRET`。密钥不能带 `NEXT_PUBLIC_` 前缀，也不要提交到源码或日志。
3. 重新部署博客以应用环境变量。在监控仓库合入 `scripts/sync_blog.py`、`tests/test_sync_blog.py` 和 workflow 中的 `sync-blog` job。
4. 设置监控仓库 Actions variable `BLOG_SYNC_ENABLED=true`。可选 `BLOG_SYNC_URL` 默认 `https://nothing-new.cn/api/papers`；使用无跳转的 HTTPS 最终地址。
5. 手动运行原工作流并填写已有报告路径；首次验证勾选 `sync_only`，避免重复发邮件。正常运行时两个 job 并行，博客成功时日志显示 `Blog synchronized: N reports`。验证 `/api/papers` 的最新日期，再刷新首页检查。

不再需要每周重新部署博客。网页在打开时检查已发布快照，已经打开的页面刷新后获取新内容。同步在 Blob 写入成功后才返回成功。读取绕过 Blob 对象缓存和 HTTP 缓存，避免覆盖后读到旧报告；不自动轮播，不打断阅读。

## 内容与故障边界

- 报告标题严格为 `# TDA 每周新论文报告｜YYYY-MM-DD`；每篇论文使用 `### 1. 标题`、`### 2. 标题` 等。二级标题可组织重点论文、其他论文和综合判断。格式错误会拒绝整次写入，保留原快照。
- 每次最多 52 期、2 MB，每期最多 200,000 字符。限制用于保护公开同步入口；超限时需调整归档范围和服务端限制。
- Markdown 在服务端解析；不启用原始 HTML，危险链接协议被丢弃。GET 仅返回已渲染报告，不返回共享密钥。
- `data/tda-reports.json` 保存从源仓库取得的 2026-10-30、2026-11-02 两期初始报告。构建用它生成可读内容，无 Blob 配置或首次同步前也能展示。运行时检查更新失败时保留已有内容并提示，不冒充同步成功。
- `401`：两端共享密钥不一致；`503`：博客缺少密钥；`400`：报告格式错误；`413`：快照太大；`502`：Blob 不可用。检查配置后重跑 Action 即可；重复推送同一快照不会新增副本。
- 回退时将 `BLOG_SYNC_ENABLED=false` 停止推送，邮件 job 仍运行。不会删除任何源报告。

## 验证

博客：`npm run typecheck`、`npm test`、`npx next build`。本地构建直接运行 Next，避免 `npm run build` 中已有的图片上传步骤。

监控仓库：`python -m unittest discover -s tests -v`、`python scripts/sync_blog.py --dry-run`。dry-run 只验证报告，不写入博客或发送邮件。
