

>[!tip]
>Quartz 的部署本质上是一个**静态站点生成 (Static Site Generation, SSG)** 过程，其核心在于将本地的 Markdown 知识拓扑结构映射为 Web 的 HTML 路由结构。
>
>本次部署中遇到的核心矛盾在于**入口点映射 (Entry Point Mapping)** 与 **命名空间解析 (Namespace Resolution)**。
>1.  **入口点**：构建器 (Builder) 严格要求根节点存在显式的 `index.md` 以生成 `index.html`，否则系统将回退到 XML 数据流（RSS Feed）。
>2.  **命名空间**：`baseUrl` 定义了站点在域内的相对坐标，必须与 GitHub Pages 的仓库路径严格同构，以保证资源链接（CSS/JS）和 RSS 链接的连通性。

### 1. 系统初始化与环境定义

>[!定义]
>**项目环境配置**
>
>设本地项目空间为 $\mathcal{P}$，目标部署环境为 GitHub Pages $\mathcal{G}$。
>初始化过程构建了从 $\mathcal{P}$ 到 $\mathcal{G}$ 的映射基础：
>1.  **依赖注入**：执行 `npm install` 以解析并装载 `package.json` 中定义的依赖树（解决 `yargs` 模块缺失错误）。
>2.  **内容注入**：将数学与计算机知识库 $K$ 嵌入 `content/` 目录，形成待处理的数据流。

### 2. 核心配置与路由原理

>[!定理]
>**基路径同构定理 (Base URL Isomorphism)**
>
>为了使生成的静态资源在子路径部署（Sub-path Deployment）下正确索引，配置文件 `quartz.config.ts` 中的 `baseUrl` 参数必须与远程仓库名称 $R$ 保持一致。
>
>$$ \text{baseUrl} \equiv R \quad (\text{在此例中为 "math-vault"}) $$
>
>若违反此条件，RSS Feed 及静态资源链接将指向错误的根域，导致 404 错误。

### 3. 部署流程与故障排除

#### 3.1 依赖解析与构建测试
在本地环境执行构建指令 `npx quartz build`。
*   **目标**：验证构建管线 $f: \text{Markdown} \to \text{HTML}$ 的完整性。
*   **修正**：通过 `npm install` 补全缺失的节点模块，确保构建函数 $f$ 可执行。

#### 3.2 根节点拓扑修正 (Root Node Correction)
这是解决“主页显示为 XML”问题的关键步骤。
*   **问题分析**：构建器在 `content/` 根目录下未检测到 `index.md`。默认的 `README.md` 被视为普通文档而非站点入口，导致 `public/index.html` 生成失败，浏览器默认渲染备用的 `index.xml`。
*   **操作**：执行文件重命名操作 $T$：
    $$ T: \text{README.md} \to \text{index.md} $$
*   **提交**：通过 Git 原子性提交确保版本控制系统记录此拓扑变更。

#### 3.3 持续集成与网络传输
*   **传输**：执行 `git push` 将本地状态 $S_{local}$ 同步至远程状态 $S_{remote}$。
*   **构建 (CI/CD)**：GitHub Actions 触发自动化构建。由于 $S_{remote}$ 中已包含 `index.md`，构建器成功生成入口文件 `index.html`。
*   **结果**：访问 `https://[User].github.io/math-vault/`，路由正确解析至 HTML 视图。

### 4. 错误分析矩阵 (Error Analysis Matrix)

| 异常现象 (Symptom) | 结构性原因 (Structural Cause)                   | 修正算子 (Correction Operator)       |
| :------------- | :----------------------------------------- | :------------------------------- |
| **主页回退至 XML**  | 根目录缺失入口映射 `index.md`，导致 `index.html` 生成失败。 | **重命名**：`mv README.md index.md`  |
| **RSS 链接失效**   | `baseUrl` 参数与物理部署路径（仓库名）不匹配。               | **配置**：`baseUrl := "math-vault"` |
| **构建模块缺失**     | `node_modules` 依赖树未构建。                     | **安装**：`npm install`             |
| **网络传输中断**     | 端口 443 连接重置 (Connection Reset)。            | **重试/代理**：检查网络连通性后重推             |