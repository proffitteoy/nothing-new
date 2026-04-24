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
      "核心课程：数学分析、概率论与数理统计",
      "自学课程：高等/抽象代数、实/复/泛函分析",
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
    github: "https://github.com/proffitteoy",
    description: [
      "面向社交媒体谣言早期识别任务，构建谣言/非谣言传播树的结构化处理流程，将传播时间、相对层级深度与局部扩散潜势映射为三维事件点云，形成可计算的拓扑分析对象。",
      "基于 Alpha / Vietoris--Rips 复形与持久同调提取传播结构的 H0/H1 维拓扑签名，构造持久图、总持久性、Top-k 持久性等数值特征，用于传播模式比较、结构差异分析与监督学习建模。",
      "完成多早期窗口下的拓扑特征批量计算、统计检验、效应量分析与分类验证流程，结合随机森林/stacking 模型评估拓扑特征在谣言早期识别与传播机制解释中的有效性。",
    ]
  },
  {
    title: "AI 驱动的智能应用与 Agent 系统开发",
    period: "2025 - 至今",
    github: "https://github.com/proffitteoy",
    description: [
      "设计并实现面向财报分析的 RAG 工作流，完成文档解析、分块检索、关键信息抽取与问答链路构建，提升长文档金融信息获取效率与可追溯性。",
      "开发医疗脏文本处理 Agent，面向高噪声、多说话人、口语化 ASR 场景，完成术语纠错、角色重构、上下文语义修复与结构化输出，增强复杂医疗文本的可用性。",
      "搭建 ChatAI 前端交互网站，围绕上下文工程实现对话记忆、阶段总结、项目级会话管理与文件增强检索等功能，提升长对话场景下的信息组织与交互体验。",
      "参与代码仓库智能分析工具开发，支持 GitHub / 本地项目解析、关键函数调用链分析、模块级可视化与历史快照持久化，提升复杂工程代码理解与结构梳理效率。",
    ],
  },
];

export const skills = {
  programmingLanguages: ["Python", "R", "SQL", "MATLAB", "JavaScript"],
  frontendDevelopment: [
    "时间序列分析",
    "统计推断",
    "机器学习建模",
    "特征工程",
    "模型评估",
  ],
  backendDevelopment: [
    "拓扑数据分析（TDA）",
    "持续同调",
    "Vietoris--Rips 复形",
    "传播网络建模",
    "监督学习",
  ],
  databaseAndStorage: [
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "PyTorch",
    "Jupyter",
  ],
  cloudAndDevOps: [
    "RAG 流程设计",
    "Agent 工作流",
    "实验复现与批处理",
    "GitHub 项目分析",
  ],
  toolsAndServices: [
    "Gudhi",
    "LangChain",
    "OpenAI API",
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
    position: "奖项待补充",
  },
  {
    name: "全国大学生统计建模大赛",
    issuer: "中国统计教育学会",
    date: "2026",
    type: "国家级",
    position: "名次待补充",
  },
];

export const workExperience: Array<{
  company: string;
  location: string;
  position: string;
  period: string;
  achievements: string[];
}> = [];
