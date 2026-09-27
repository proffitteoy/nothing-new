export const projects = [
  {
    id: "rumor",
    name: "early-rumor-propagation-tda",
    label: "传播树研究",
    category: "研究 · 论文在投",
    description: "早期谣言传播树的拓扑特征构造与持久同调分析。",
    href: "https://github.com/proffitteoy/early-rumor-propagation-tda",
    tags: ["TDA", "Research"],
    object: "桌前手稿",
    contribution: false,
  },
  {
    id: "topp",
    name: "topp",
    label: "Topp",
    category: "研究 · 论文在投",
    description: "拓扑数据分析的高速高性能 bottleneck/Wasserstein 计算 Python 库。",
    href: "https://github.com/proffitteoy/Topp",
    tags: ["TDA", "Python", "Exact Matching"],
    object: "右侧竖屏",
    contribution: false,
  },
  {
    id: "iris",
    name: "Iris-Terminal",
    label: "Iris-Terminal",
    category: "AI WORKBENCH",
    description: "本地优先 AI4MATH 工作台。",
    href: "https://github.com/proffitteoy/Iris-Terminal",
    tags: ["Local-first", "Research Workspace"],
    object: "中央笔记本电脑",
    contribution: false,
  },
  {
    id: "competitions",
    name: "ai-data-competitions-ui",
    label: "学院竞赛平台",
    category: "CAMPUS COMPETITION UI",
    description: "面向学生竞赛的学院级服务网站。",
    href: "https://github.com/GDUF-quantitative/ai-data-competitions-ui",
    tags: ["Next.js", "React"],
    object: "左侧横屏",
    contribution: false,
  },
  {
    id: "gudhi",
    name: "GUDHI/gudhi-devel",
    label: "GUDHI",
    category: "开源贡献",
    description: "核心数学算法的正确性漏洞修复与跨平台验证。",
    href: "https://github.com/GUDHI/gudhi-devel",
    tags: ["C++", "Bottleneck Distance", "Python"],
    object: "算法档案册",
    contribution: true,
  },
  {
    id: "animeko",
    name: "open-ani/animeko",
    label: "animeko",
    category: "开源贡献",
    description: "基于 CNN 的验证码识别算法开发。",
    href: "https://github.com/open-ani/animeko",
    tags: ["Kotlin Multiplatform", "Android"],
    object: "图像识别档案盒",
    contribution: true,
  },
] as const

export type Project = (typeof projects)[number]
export type ProjectId = Project["id"]
export type RoomTarget = ProjectId | "notes" | "anime" | "headphones"

export const lifeObjects = [
  { id: "notes", label: "翻开笔记", description: "数学学习与持续记录", href: "/blog" },
  { id: "anime", label: "看看番剧", description: "研究之外的日常", href: "/anime" },
  { id: "headphones", label: "桌边音乐", description: "继续此刻的歌", href: "/music" },
] as const

export const roomTargets: readonly RoomTarget[] = [
  ...projects.map((project) => project.id),
  ...lifeObjects.map((object) => object.id),
]
