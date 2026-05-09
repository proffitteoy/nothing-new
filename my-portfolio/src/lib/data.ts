export const personalInfo = {
  name: "李炫良",
  location: "广东，中国",
  phone: "19210109091",
  email: "84025375@qq.com",
  github: "https://github.com/proffitteoy",
  website: "https://nothing-new.icu",
  profilePicture: "/profile.jpg",
  jobTarget: "数据分析 / 数据建模",
  heroDescription:
    "专注于数据分析与数据建模方向，关注拓扑数据分析、信息传播建模与 AI Agent 工程化落地。",
};

export const education = [
  {
    institution: "广东金融学院",
    location: "深圳，广东",
    degree: "金融数学（本科在读）",
    period: "2024.09 - 至今",
    achievements: [
      "预计毕业时间：2028 年 7 月",
      "GPA：3.15 / 4.00",
    ],
  },
];

export const projects = [
  {
    title: "拓扑数据分析在 A 股市场中的应用",
    period: "2025 - 至今",
    github: "https://github.com/proffitteoy",
    description: [
      "基于 Sliding Window Embedding 将股票收益率序列映射为高维点云，使用持续同调刻画时间序列中的周期性、结构稳定性与多尺度形态特征。",
      "围绕 0/1 维持续同调构建拓扑特征体系，提取最大持久性、总持久性、持久熵、Betti 曲线面积、Persistence Landscape 与 Silhouette 等结构摘要。",
      "参考 Sliding Windows and Persistence 理论，分析窗口长度、延迟参数与拓扑信号强度之间的关系，探索其在市场状态识别与结构突变检测中的应用。",
      "将拓扑特征转化为可接入机器学习模型的量化因子与 regime gate，用于辅助收益预测、模型融合、风险过滤和相似市场状态检索。",
      "面向批量股票历史数据，设计可复用的 TDA 计算流水线，评估 Ripser/Gudhi 等后端在大规模滚动窗口场景下的计算成本，并通过缓存、分批计算与特征持久化提升工程可扩展性。"
    ],
  },
  {
    title: "基于持久同调的 AIGC 信息流传播事件点云拓扑研究",
    period: "2026",
    github: "https://github.com/proffitteoy/addd",
    description: [
      "面向社交媒体谣言早期识别任务，构建谣言/非谣言传播树的结构化处理流程，将传播时间、相对层级深度与局部扩散潜势映射为三维事件点云，形成可计算的拓扑分析对象。",
      "基于 Alpha / Vietoris--Rips 复形与持久同调提取传播结构的 H0/H1 维拓扑签名，构造持久图、总持久性、Top-k 持久性等数值特征，用于传播模式比较、结构差异分析与监督学习建模。",
      "完成多早期窗口下的拓扑特征批量计算、统计检验、效应量分析与分类验证流程，结合随机森林/stacking 模型评估拓扑特征在谣言早期识别与传播机制解释中的有效性。",
    ]
  },
  {
  title: "基于拓扑数据分析的聚类算法研究与实现",
  period: "2025 - 至今",
  github: "https://github.com/proffitteoy",
  description: [
    "研究并实现面向复杂点云与非线性结构数据的拓扑聚类算法流程，覆盖数据预处理、距离度量设计、邻域图构建、连通结构提取、聚类标签生成与可视化分析。",
    "引入持久同调、多尺度连通分支与拓扑特征描述，刻画簇在不同尺度下的生成、合并与消亡过程，用于识别非凸簇、链式簇和传统距离聚类难以捕捉的复杂结构。",
    "将算法结果与 K-Means、DBSCAN、HDBSCAN 等方法进行对比，结合持久图、条形码、邻域图和降维嵌入图分析聚类稳定性与结构可解释性。",
    "完成参数实验、结果缓存、指标统计与批量可视化模块，为传播结构分析、金融时序状态识别和复杂系统建模中的结构发现任务提供方法基础。"
    ]
  },
  {
    title: "Iris-Terminal：知识库增强型 ChatAI 前端交互系统",
    period: "2025 - 至今",
    github: "https://github.com/proffitteoy/Iris-Terminal",
    description: [
      "搭建面向长对话与知识库问答的 ChatAI 前端交互系统，围绕项目级会话管理、阶段总结、对话记忆与文件增强检索，提升复杂任务中的上下文组织能力。",
      "设计渐进式信息披露交互方式，将用户问题、历史上下文、文件内容与知识库索引进行统一组织，支持更稳定的多轮问答与任务追踪。",
      "探索 Obsidian 知识库与传统检索系统的结合方式，为后续接入 PostgreSQL、向量检索与 RAG 问答链路预留工程接口。",
      "面向个人知识管理与科研辅助场景，构建可扩展的 AI 对话工作台，用于项目复盘、资料检索、阶段总结与知识沉淀。"
    ],
  },
  {
    title: "ManiMind：多 Agent 自动化数学科普视频生成系统",
    period: "2025 - 至今",
    github: "https://github.com/proffitteoy/ManiMind",
    description: [
      "设计面向数学论文与学习笔记的多 Agent 自动化科普视频生成系统，覆盖论文解析、研究总结、脚本生成、分镜规划、公式动画与内容审核等环节。",
      "构建从输入文档到结构化创作任务的编排流程，将 PDF、用户笔记和目标受众信息转化为讲解脚本、镜头任务表与可执行的动画生成任务。",
      "围绕 Manim 公式动画与 HTML 科普片段生成，探索数学内容从严肃学术文本到可视化讲解材料的自动化转化路径。",
      "通过任务状态、上下文记录与文件快照管理，提升长链路 Agent 工作流的可追踪性、可复现性与后续扩展能力。"
    ],
  },
  {
    title: "GitVisual-LLM：代码仓库智能分析与结构可视化工具",
    period: "2025 - 至今",
    github: "https://github.com/proffitteoy/gitvisual-llm",
    description: [
      "开发面向 GitHub 与本地项目的代码仓库智能分析工具，支持项目结构解析、关键文件识别、函数调用链分析与模块关系梳理。",
      "结合 LLM 对代码语义、模块职责与工程结构进行辅助解释，将复杂仓库转化为更易理解的结构化摘要与可视化结果。",
      "实现项目历史快照与分析结果持久化，便于对比不同版本下的模块变化、结构演化与关键逻辑调整。",
      "面向代码审计、项目接手与工程知识沉淀场景，提升复杂代码库的阅读效率、结构理解能力与文档化水平。"
    ],
  },
  {
    title: "WAF Incident Platform：AI 辅助 Web 安全事件闭环平台",
    period: "2026",
    github: "https://github.com/proffitteoy/waf-incident-platform",
    description: [
      "构建面向个人站点与中小型 Web 服务的安全事件闭环平台，设计 Logs、Parser、Event Store、LLM Analyze、Incident Store、Policy、Actuator 与 Dashboard 的完整处理链路。",
      "基于 Nginx/OpenResty、Coraza/ModSecurity 与 OWASP CRS 接入入口防护能力，结合 Node.js / TypeScript / Express 后端、PostgreSQL、Redis 与 Vue 3 前端实现事件展示与联动分析。",
      "实现日志回放、事件解析、策略决策、模拟执行器与取证 worker 等模块，探索 LLM 在攻击摘要、风险解释、处置建议与安全运营辅助中的应用。"
    ],
  },
  {
    title: "NightShift：Android + WebView 嵌入式 AI 应用实验",
    period: "2026",
    github: "https://github.com/proffitteoy/nightshift",
    description: [
      "开发由后端服务、Android 客户端和嵌入式 Tab3 前端组成的移动端 AI 应用原型，探索 Web 前端能力在 Android WebView 场景下的集成方式。",
      "后端采用 api、services、repositories、clients、models、prompts 分层结构，Android 端基于 MainActivity、Fragment 与 Navigation 组织多 Tab 交互流程。",
      "围绕 Tab3 静态资源构建、后端环境变量注入、GitHub token 隔离与 Android 调试构建流程，完成移动端 AI 工具链的工程化整合。"
    ],
  },
  {
    title: "BDC2026：A 股收益预测与组合生成建模 pipeline",
    period: "2026",
    github: "https://github.com/proffitteoy/BDC2026",
    description: [
      "面向 A 股收益预测任务，构建四阶段量化建模流程，覆盖横截面因子研究、滚动窗口构建、分层式信号生成与最终持仓权重生成。",
      "在信号生成阶段结合因子标准化、横截面 rank 化、cluster 聚合、PCA 压缩、KMeans 市场状态识别与 LGBM / CatBoost 排序模型，形成多分支预测与融合框架。",
      "设计 OOF 权重搜索、分状态 regime 权重覆盖、滚动指标评估与提交结果生成流程，沉淀从数据处理、模型训练到组合输出的完整竞赛工程经验。"
    ],
  },
];

export const skills = {
  programmingLanguages: [
    "Python", "R", "SQL", "MATLAB", "JavaScript", "C++"
  ],
  frontendDevelopment: [
    "时间序列分析",
    "机器学习建模",
    "特征工程",
    "模型评估",
  ],
  backendDevelopment: [
    "拓扑数据分析（TDA）",
    "持续同调",
    "传播网络建模",
    "监督学习",
  ],
  databaseAndStorage: [
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "PyTorch",
  ],
  cloudAndDevOps: [
    "RAG 设计",
    "多Agent设计",
    "实验复现与批处理",
    "GitHub 项目分析",
  ],
  toolsAndServices: [
    "Gudhi",
    "Git / GitHub",
    "VS Code",
    "Linux",
  ],
};

export const awards = [
  {
    name: "全国大学生数学建模竞赛",
    issuer: "教育部高等教育司 / 中国工业与应用数学学会",
    date: "2025",
    type: "国家级",
    position: "省三",
  },
  {
    name: "美国大学生数学建模竞赛（MCM/ICM）",
    issuer: "COMAP",
    date: "2026",
    type: "国际",
    position: "H奖",
  },
  {
    name: "全国大学生统计建模大赛",
    issuer: "中国统计教育学会",
    date: "2026",
    type: "国家级",
    position: "名次待补充",
  },
  {
    name: "全国大学生软件创新大赛",
    issuer: "示范性软件学院联盟",
    date: "2026",
    type: "国家级",
    position: "省二",
  },
  {
    name: "“泰迪杯”数据挖掘挑战赛",
    issuer: "泰迪杯数据挖掘挑战赛组织委员会",
    date: "2025",
    type: "国家级",
    position: "国三",
  },
  {
    name: "广东首届高质量数据集创新大赛",
    issuer: "广东省政务服务和数据管理局",
    date: "2026",
    type: "省级",
    position: "复赛获奖",
  },
];

export const workExperience: Array<{
  company: string;
  location: string;
  position: string;
  period: string;
  achievements: string[];
}> = [];
