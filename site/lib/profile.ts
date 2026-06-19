export const profile = {
  name: "李炫良",
  handle: "proffitteoy",
  headline: "数学、数据建模与 AI 工程的长期记录。",
  intro: "一位把数学学习、建模实验、AI 工程和日常思考持续写下来的普通人。",
  location: "广东，中国",
  phone: "19210109091",
  email: "84025375@qq.com",
  github: "https://github.com/proffitteoy",
  website: "https://nothing-new.icu",
  avatar: "/avatar.jpg",
}

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目" },
  { href: "/music", label: "音乐" },
  { href: "/misc", label: "杂谈" },
  { href: "/link", label: "友链" },
  { href: "/about", label: "关于" },
]

export const featuredProjects = [
  {
    title: "early-rumor-propagation-tda",
    description: "面向谣言早期识别的传播树事件点云与持久同调特征工程。",
    href: "https://github.com/proffitteoy/early-rumor-propagation-tda",
    tag: "Research / Math",
  },
  {
    title: "TILO-PRC",
    description: "面向复杂点云与结构数据的拓扑聚类算法研究与实现。",
    href: "https://github.com/proffitteoy/TILO-PRC",
    tag: "TDA",
  },
  {
    title: "Iris-Terminal",
    description: "知识库增强型 ChatAI 前端交互系统，强调长对话、阶段总结和知识沉淀。",
    href: "https://github.com/proffitteoy/Iris-Terminal",
    tag: "AI / Engineering",
  },
  {
    title: "gitvisual-llm",
    description: "代码仓库智能分析与结构可视化工具，用 LLM 辅助理解复杂工程。",
    href: "https://github.com/proffitteoy/gitvisual-llm",
    tag: "Developer Tools",
  },
  {
    title: "ManiMind",
    description: "多 Agent 自动化数学科普视频生成系统，覆盖论文解析、脚本生成与动画任务编排。",
    href: "https://github.com/proffitteoy/ManiMind",
    tag: "Agent",
  },
  {
    title: "waf-incident-platform",
    description: "AI 辅助 Web 安全事件闭环平台，覆盖日志解析、风险解释和策略联动。",
    href: "https://github.com/proffitteoy/waf-incident-platform",
    tag: "Security",
  },
]

export const missionTracks = [
  ["Topological Data Analysis", "Persistent homology, propagation trees, topology-guided features"],
  ["Topology-guided Algorithms", "Graph clustering, PRC, TILO, structure-aware partitioning"],
  ["AI Research Workspace", "Local-first chat, files, retrieval, memory, Obsidian integration"],
  ["Agent Orchestration", "Context packaging, review loops, generated artifacts"],
  ["Developer Tools", "Repository visualization, function graphs, LLM-assisted engineering"],
  ["Security Platform", "WAF logs, incident analysis, policy loop, action audit"],
]

export const musicTracks = [
  { id: "3313005946", title: "网易云音乐 3313005946" },
  { id: "2669802224", title: "网易云音乐 2669802224" },
  { id: "1895061127", title: "网易云音乐 1895061127" },
  { id: "761594", title: "网易云音乐 761594" },
]

export const friendLinks = [
  {
    title: "汐湫的小屋",
    description: "在心灵深处遇见自己",
    href: "https://www.ixiqiu.cn",
    cover: "https://bu.dusays.com/2024/11/04/6728d6b2dc837.png",
    avatar: "https://bu.dusays.com/2024/11/04/6728d6722ca4c.jpg",
  },
]

type SkillGroup = [group: string, items: string[]]

export const aboutProfile: {
  target: string
  description: string
  education: {
    institution: string
    location: string
    degree: string
    period: string
    notes: string[]
  }
  skillGroups: SkillGroup[]
  awards: string[]
} = {
  target: "数据分析 / 数据建模",
  description: "专注于数据分析与数据建模方向，关注拓扑数据分析、信息传播建模与 AI Agent 工程化落地。",
  education: {
    institution: "广东金融学院",
    location: "深圳，广东",
    degree: "金融数学（本科在读）",
    period: "2024.09 - 至今",
    notes: ["预计毕业时间：2028 年 7 月", "GPA：3.15 / 4.00"],
  },
  skillGroups: [
    ["编程与工具", ["Python", "R", "SQL", "MATLAB", "JavaScript", "C++"]],
    ["建模方向", ["时间序列分析", "机器学习建模", "特征工程", "模型评估"]],
    ["研究主题", ["拓扑数据分析（TDA）", "持续同调", "传播网络建模", "监督学习"]],
    ["工程实践", ["RAG 设计", "多 Agent 设计", "实验复现与批处理", "GitHub 项目分析"]],
  ],
  awards: [
    "全国大学生数学建模竞赛：省三",
    "美国大学生数学建模竞赛（MCM/ICM）：H 奖",
    "全国大学生软件创新大赛：省二",
    "“泰迪杯”数据挖掘挑战赛：国三",
  ],
}
