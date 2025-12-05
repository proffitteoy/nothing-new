---
obsidian-note-status:
  - colorful:needsUpdate
---

>[!tip]
>Quartz 的部署本质上是一个静态站点生成过程，其核心在于将本地的 Markdown 知识拓扑结构映射为 Web 的 HTML 路由结构。
>
>本次部署中遇到的核心矛盾在于**入口点映射** 与 **命名空间解析**。
>1.  **入口点**：构建器 (Builder) 严格要求根节点存在显式的 `index.md` 以生成 `index.html`，否则系统将回退到 XML 数据流（RSS Feed）。
>2.  **命名空间**：`baseUrl` 定义了站点在域内的相对坐标，必须与 GitHub Pages 的仓库路径严格同构，以保证资源链接（CSS/JS）和 RSS 链接的连通性。

### 1. 系统初始化与环境定义

>[!note] 定义
>**项目环境配置**
>
>设本地项目空间为 $\mathcal{P}$，目标部署环境为 GitHub Pages $\mathcal{G}$。
>初始化过程构建了从 $\mathcal{P}$ 到 $\mathcal{G}$ 的映射基础：
>1.  **依赖注入**：执行 `npm install` 以解析并装载 `package.json` 中定义的依赖树（解决 `yargs` 模块缺失错误）。
>2.  **内容注入**：将数学与计算机知识库 $K$ 嵌入 `content/` 目录，形成待处理的数据流。

### 2. 核心配置与路由原理

>[!note] 定理
>基路径同构定理
>
>为了使生成的静态资源在子路径部署下正确索引，配置文件 `quartz.config.ts` 中的 `baseUrl` 参数必须与远程仓库名称 $R$ 保持一致。
>
>$$ \text{baseUrl} \equiv R \quad (\text{在此例中为 "math-vault"}) $$
>
>若违反此条件，RSS Feed 及静态资源链接将指向错误的根域，导致 404 错误。

### 3. 部署流程与故障排除

#### 3.1 依赖解析与构建测试
在本地环境执行构建指令 `npx quartz build`。
#### 3.2 根节点拓扑修正
*   **问题分析**：构建器在 `content/` 根目录下未检测到 `index.md`。默认的 `README.md` 被视为普通文档而非站点入口，导致 `public/index.html` 生成失败，浏览器默认渲染备用的 `index.xml`。
*   **操作**：执行文件重命名操作 $T$：
$$ T: \text{README.md} \to \text{index.md} $$
*   **提交**：通过 Git 原子性提交确保版本控制系统记录此拓扑变更。

#### 3.3 持续集成与网络传输
*   **传输**：执行 `git push` 将本地状态 $S_{local}$ 同步至远程状态 $S_{remote}$。
*   **构建**：GitHub Actions 触发自动化构建。由于 $S_{remote}$ 中已包含 `index.md`，构建器成功生成入口文件 `index.html`。
*   **结果**：访问 `https://[User].github.io/math-vault/`，路由正确解析至 HTML 视图。

### 4. 域名的更改与网站镜像

#### 4.1 购买域名

据说在[https://www.spaceship.com/]上购买十分便宜不过第一次我采用阿里云购买。理由是降低被DNS劫持的风险。

选择架构域名解析+oss静态部署+脚本定期拉取github项目。

这是一个类似于把github page镜像到国内服务器的方法，可以快速访问网站，并且百分百不被墙。但oss上传不了视频与大文件，导致我更换方法。

#### 域名解析

无论是上述方案还是直接重定向到github项目都需要域名解析，在第一条路走不通之后我直接选择抛弃github page转向改写域名，优点是不需要定期拉取，缺点是网络波动。在实际测试之后发现实际上完全不会被墙，推测原因是github page被墙的概率本身就很小，再套了一层已备案的域名之后根本不可能被墙。

### 5.运维与网安

在博客正常运行之后最大的问题就是定期上传与维护
#### 5.1上传脚本

我写了个bash脚本：

```bash
@echo off

chcp 65001 >nul

setlocal

  

cd /d "%~dp0"

  

set /p commit_msg="Commit Message: "

  

git add .

git commit -m "%commit_msg%"

git push origin main

  

endlocal

pause
```
核心是

```bash
git add .

git commit -m "%commit_msg%"

git push origin main
```

拉取git缓存

对更改进行命名

上传github

#### 5.2 网站的日常防御

常态化防御是一个常态化的过程，最主要的威胁来自于DNS劫持，即重定向