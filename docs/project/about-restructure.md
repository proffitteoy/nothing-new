# 关于页三章节重构

新版 /about 使用连续滚动的三个独立章节：网站介绍、工程身份、研究身份。桌面左侧目录保持 sticky，点击章节执行平滑定位；移动端目录转换成顶部横向索引。当前章节由真实滚动位置决定，支持滚轮、触控板、触摸滚动及减少动画偏好，不强制滚动吸附。

内容分别位于：

- app/about/about.md（网站介绍）
- app/about/engineering.md（工程身份）
- app/about/research.md（研究身份）

呈现组件分别为 components/about/WebsiteSection.tsx、EngineeringSection.tsx 和 ResearchSection.tsx。components/AboutClient.tsx 仅管理索引与滚动状态；app/about/page.tsx 单独读取并渲染三份 Markdown。三个板块的内容与 UI 代码可分别维护。

旧版 GitHub 贡献热力图、贡献抓取和缓存逻辑已从 /about 移除。工程身份正文中仍允许使用 GitHub 项目源码链接，网页上没有独立 GitHub 统计板块。

页面继续沿用全站背景、已有导航和富文本排版。可选 Playwright 冒烟检查为 scripts/about-preview.py；在运行的开发/生产预览上执行。
