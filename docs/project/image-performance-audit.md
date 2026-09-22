# 生产图片加载策略

网站保留浏览器 native 网络调度、Next Image、Vercel Blob 与现有 CDN 缓存链路，不使用自定义下载队列、分层 residual 或客户端解码器。未获得足以替换 native 的收益，因此已移除图片实验组件、查询参数、环境变量、测量脚本及聚合结果；历史研究可从 Git 历史恢复。

## 列表图片

- 番剧首批立即加载预算：移动端 4、桌面端 6，Save-Data / 2G 为 2。杂谈为 2，受限网络为 1。
- 其余图片仅在进入扩展视口后挂载：移动端 256 px、桌面端 320 px，受限网络为 0。
- 已挂载图片不会因离开视口、改变窗口大小或切换锚点而卸载。不支持 IntersectionObserver 时异步显示图片，番剧仍可手动继续展开。
- 番剧通过 `aspect-[3/4]` 预留空间；`#watched` 直达在快照挂载后定位，并把立即加载预算分配给已看区域。
- 杂谈保持自然封面比例、移动两栏和桌面三栏。站内及已允许的文件夹封面走 `Image fill + sizes`；未知第三方保持原始 URL、lazy、async 和 no-referrer。
- 杂谈首张内容图保持正常优先级，其余立即加载内容图使用低 fetch priority，避免增加图片 preload。过滤与图片序号在一次遍历中计算。

## 音乐与其他图片

- 网易云当前封面统一为 `256y256`，非当前队列封面为 `128y128`。DOM 封面与 WebGL 纹理保持兼容的 CORS 请求模式。
- 首页和音乐页不渲染不可见的浮动播放器视图，播放状态仍由 MusicProvider 保留。
- 保留 Quartz 正文响应式图片、第三方友链原 URL 和固定尺寸属性。
- 不改变 Splash 时序、背景/头像/关于页主视觉 preload、站内 URL、Blob 路径或快照 schema。

## 格式与缓存

继续使用 Next Image 的 AVIF / WebP 协商及现有尺寸、质量和缓存配置。没有部署全量预生成、第三方镜像或自定义格式；也不以实验结果宣称生产 LCP 已提升。

## 维护验证

修改生产图片链路后执行完整测试、TypeScript、定向 ESLint、格式检查和 `git diff --check`。无上传副作用的构建使用：

```powershell
npm.cmd run notes:build
npx.cmd next build
```

`npm run build` 会执行图片同步，不能用于只读构建验证。`images:dry` 只盘点范围；`images:check` 需要 Blob 凭据且不会写入。

本次收尾的本地运行时为 Node 24；项目和 Vercel 要求 Node 22，两者构建证据需分开。浏览器回归关注近视口挂载、锚点跳转、加载失败、图片比例和 preload 数量；本地回归不等同于部署后的冷缓存性能采样。
