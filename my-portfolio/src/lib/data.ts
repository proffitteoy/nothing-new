export const personalInfo = {
  name: "李炫良",
  location: "广东，中国",
  phone: "19210109091",
  email: "84025375@qq.com",
  github: "https://github.com/proffitteoy",
  website: "https://nothing-new.icu",
  profilePicture: "/profile.jpeg",
  jobTarget: "数据分析 / 数据建模",
  heroDescription:
    "专注于数据分析与数据建模方向，关注拓扑数据分析、信息传播建模与 AI Agent 工程化落地。",
};

export const education = [
  {
    institution: "广东金融学院",
    location: "广东，中国",
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
      "构建股票时间序列点云，计算 0/1 维持续同调（Persistent Homology），生成持久图与瓶颈距离。",
      "基于 Gudhi 等 TDA 工具库实现批量计算流程，将拓扑距离转化为可用于监督学习的结构化特征。",
      "探索拓扑特征在市场状态区分、相似性度量中的判别能力，并分析其与传统统计特征的互补性。",
      "针对大规模历史数据场景，分析算法复杂度瓶颈，尝试缓存与批处理策略以提升工程可扩展性。",
    ],
  },
  {
    title: "基于持久同调的 AIGC 信息流传播事件点云拓扑研究",
    period: "2026",
    github: "https://github.com/proffitteoy",
    description: [
      "面向 AIGC 与非 AIGC 信息流，构建传播事件点云表示与传播树结构化数据流程，将传播时间、层级深度、局部分支强度等信息统一映射为可计算的拓扑分析对象。",
      "基于 Vietoris--Rips 复形与持久同调提取传播结构的拓扑签名，形成持久图、持久景观等表示，并构造可用于监督学习与组间比较的数值特征。",
      "围绕特征提取与实验流程完成模块化整理与工程优化，降低计算冗余并提升实验复现性，为后续开展 AIGC 信息流识别、传播模式比较与风险预警研究提供方法基础。",
    ],
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

// Keep compatibility for optional sections not used on the resume page.
export const workExperience: Array<{
  company: string;
  location: string;
  position: string;
  period: string;
  achievements: string[];
}> = [];

export const skills = {
  programmingLanguages: [] as string[],
  frontendDevelopment: [] as string[],
  backendDevelopment: [] as string[],
  databaseAndStorage: [] as string[],
  cloudAndDevOps: [] as string[],
  toolsAndServices: [] as string[],
};

export const awards: Array<{
  name: string;
  issuer: string;
  date: string;
  type: string;
  position: string;
}> = [];
