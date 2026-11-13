# Vercel 流量止损与自托管迁移预案（2026-11-05）

## 现状与原则

- 2026-11-05，Hobby 团队因 **Fast Origin Transfer 10 GB** 超限被暂停。恢复后 `https://nothing-new.cn/` 已返回 HTTP 200；当前 DNS 仍指向 Vercel。
- 账户 Usage 截图：上一个周期 `math-vault` 约 **9.19 GB (89.6%)**，Blob Stores 约 **1.06 GB (10.4%)**。传输几乎全部为 Outgoing；`iad1` 约 9.19 GB。这些数据说明源站响应占主导，**不能直接归因到某一个路由**。
- 本分支是预备改动：**不切换 DNS、不关停 Vercel、不删除 Blob、不更改现有密钥**。先以可回滚方式修复公开图片链路，再部署备用站并验收。

## 第一阶段：减少 Origin Transfer

此前生产环境只要配置了 Blob 凭据，`next.config.ts` 就会把 `/avatar`、`/avatar.jpg`、`/background.png`、`/about-cover.png`、`/profile-studio.png`、`/chatter-covers/**` 和 `/quartz-assets/content/**` 重写至 `/assets/**`。对应 `app/assets/[...path]/route.ts` 在 Vercel Function 内读取私有 Blob，再输出图片。这条通路在缓存未命中时有 Origin Transfer 成本。

这些图片已经由 `public/` 及 `npm run notes:build` 产出的 `public/quartz-assets/` 提供。因此修改为直接使用 Next.js 的静态文件服务；`/avatar` 仍重写至 `/avatar.jpg`。`next/image` 仍负责需要的转码与尺寸响应。

构建命令移除自动 `images:sync`（其副作用是往 Blob 写入），保留 `npm run images:sync` 作为显式维护命令。现有 `/assets/**` Function 尚未删除，可供兼容与回退审查；不要当成已停用所有 Function。动漫快照、动漫封面和 TDA 周报仍依赖私有 Blob，**这一阶段不迁移它们的数据**。

上线前必须核对：`/avatar`、`/avatar.jpg`、`/background.png`、`/about-cover.png`、`/profile-studio.png`、一张杂谈封面、一张 Quartz 文章图、`/api/anime`、`/api/papers`，以及首页在手机/桌面上的图片完整性；从 Network 看静态图片未落入 `/assets/` 函数代理。对冷缓存与重复请求分别记录响应大小、缓存头、状态码。

成本检验：在 Vercel Usage 中比较发布前后同等访问量的 Fast Origin Transfer；观察至少一个有代表性的访问周期。此改动消除一条明确的源站代理路径，但**没有历史路径级指标，不能承诺立刻降低多少 GB**。

## 第二阶段：备用部署（不切流）

本分支新增 `Dockerfile`、`compose.selfhost.yaml` 和 `.dockerignore`。用途是在任一可运行 Docker 的 Linux 主机上部署完整 Next.js 服务（不是静态导出）：

1. 在一台受控 Linux 服务器上安装 Docker Engine 与 Compose plugin，开放反向代理所需端口。选择具备足够磁盘空间和 Node 22 构建内存的机器。
2. 拉取 **本分支明确提交号**，避免正在变化的 `main` 混入迁移验证。
3. 在服务器创建仅管理员可读的 `.env`，配置 `BLOB_READ_WRITE_TOKEN`、`BANGUMI_USERNAME`、`BANGUMI_ACCESS_TOKEN`、`ANIME_SYNC_SECRET`、`PAPERS_SYNC_SECRET` 等需要的变量。**不要把令牌写入 Git、命令行或工单**。外部服务器不会自动获得 Vercel 的 OIDC；若私有 Blob 令牌无法跨平台工作，需要先完成存储迁移，不能带病切流。
4. 运行 `docker compose -f compose.selfhost.yaml --env-file .env build`，再运行 `docker compose -f compose.selfhost.yaml --env-file .env up -d`。
5. Compose 默认只监听 `127.0.0.1:3000`。在同机用 `curl -fI http://127.0.0.1:3000/` 检查，再通过 Nginx/Caddy 配置**独立预览域名**的 HTTPS 反向代理；尚不修改正式域名。
6. 使用预览域名验收：`/`、`/blog`、多篇数学笔记、`/chatter`、`/projects`、`/anime`、`/api/anime`、`/api/papers`、图片、字体及 `/sitemap.xml`；音乐在首页和项目页耳机面板检查，并验证跨页继续播放。退役 `/music` 应返回 404；核查动态接口、缓存、移动端和错误日志。
7. 在切换前先安排定时任务替代：Vercel `vercel.json` 中的每天 03:00 UTC `/api/anime/sync` 不会在自托管环境自动触发。必须由受控调度器使用 `CRON_SECRET` 的 Bearer 认证执行，并监控成功率。不可把 secret 放在公开 URL。
8. 论文监控 Action 当前向 `https://nothing-new.cn/api/papers` 推送。新实例必须能通过 `PAPERS_SYNC_SECRET` 读取写入原有 Blob；切域名后进行一次 **sync-only** 推送验证。迁移前不要改变生产 Action 目标。
9. Docker 镜像内会包含 `.quartz-cache/next` 与 `public/quartz-assets`，它们分别用于服务端读取笔记与静态附件。更换 Dockerfile 时不可漏掉。

## 第三阶段：正式迁移与回滚

满足以下条件方可切流：备用站成功构建、关键页面和 API 验收通过、存储令牌可读写、健康检查正常、HTTPS 可用、定时任务已接管、监控和数据备份可用。

- 在 DNS 控制台预先降低 A/AAAA/CNAME 记录 TTL（如提供商允许，建议 300 秒）；**不要在此阶段移除原 Vercel 域名绑定**。
- 为 `nothing-new.cn`、`www.nothing-new.cn` 和 `nothing-new.icu` 规划新解析/跳转关系，确认证书与 Host/Origin 行为后再分批切换。切换时记录变更时间、原始记录、目标记录、操作人、验收结果。
- 监控错误率、关键 API、页面资源请求、延迟与 CPU/内存占用。观察稳定后再考虑取消原部署；先保留 Vercel 作为短期回退。
- 回滚：立即恢复之前记录的 DNS 解析值，并检查旧 Vercel Production Deployment 和 Blob 服务仍可用；DNS 缓存传播期间两端需保持兼容。存储写入须使用同一数据源或双端明确冻结，避免回滚产生数据分叉。

### 存储与构建风险

- 私有 Blob 保留会使备用站继续依赖 Vercel 存储；这是应急迁移的过渡方案，不属于完全去 Vercel。
- `/api/papers` 的 POST 和动漫同步写入私有 Blob。迁移存储前，先导出和校验 `papers/reports.json`、`anime/latest.json`、对应 snapshot、封面与 manifest 的完整性。
- `npm run build` 现已无图片上传副作用；如果 `public/` 静态图片缺失，应该让构建/验收失败，不能默默回退到昂贵的 Function 代理。
- 旧 Vercel 生产项目曾报告 Node 24.x，仓库声明 Node 22.x。自托管镜像明确采用 Node 22，必须运行全套测试再切换。

## 关于“迁移备案”

这里保留两种含义：

**迁移留档**：应保存新旧平台、域名、DNS、镜像提交号、部署窗口、鉴权配置清单（不保存明文密钥）、验收记录、回滚步骤与负责人。本文件即初始迁移留档。

**中国大陆 ICP 备案**：若备用站最终部署在**中国大陆境内**，需要核实备案主体、域名、接入商和接入备案要求，**完成所需备案后方可正式提供服务**。中国香港、新加坡等境外服务器通常不需要中国大陆 ICP 备案；具体还需遵循域名及云厂商要求。尚未选定服务器地点，所以目前不能声称备案已完成，也不应填写虚假的备案号。

参见工信部《非经营性互联网信息服务备案管理办法》及政务服务《非经营性互联网信息服务核准》。

## 验收清单

- [ ] CI：`npm ci` / `npm run typecheck` / `npm test` / `npm run lint` / `npm run build`
- [ ] 构建：Docker 镜像成功启动，笔记服务器产物与静态素材存在
- [ ] Vercel 预览：公开图片直接走静态资源，动画封面与论文接口没有回归
- [ ] 监控：能找到异常流量期间最大的请求路由，或者明确记录数据不足
- [ ] 备用站：独立域名和 TLS 正常，关键路由/API 全通过
- [ ] 持久数据：Blob 完整性、写入权限、同步任务经验证
- [ ] 切流：记录 DNS、切换、监控、回滚并决定 ICP 接入备案
