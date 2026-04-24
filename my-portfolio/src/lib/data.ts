export const personalInfo = {
  name: "你的名字",
  location: "中国·上海",
  email: "hello@example.com",
  github: "https://github.com/yourname",
  linkedin: "https://linkedin.com/in/yourname",
  profilePicture: "/profile.jpeg",
  heroDescription:
    "专注于 Web 前端与全栈工程实践，擅长把复杂需求拆解为稳定、可维护、可扩展的产品能力。关注工程效率、用户体验与长期架构演进。",
};

export const workExperience = [
  {
    company: "星海科技（上海）有限公司",
    location: "上海，中国",
    position: "高级前端工程师",
    period: "2023.03 - 至今",
    achievements: [
      "主导公司核心管理平台重构，首屏加载时间降低约 45%。",
      "推动 TypeScript 全量落地，线上类型相关缺陷显著下降。",
      "设计组件库与设计令牌规范，统一 6 条业务线视觉与交互。",
      "搭建前端 CI 质量门禁（Lint、测试、构建），缩短发布周期。",
      "与后端协同制定接口规范，减少联调返工并提升交付稳定性。",
      "牵头性能治理专项，持续跟踪 Web Vitals 并建立周报机制。",
    ],
  },
  {
    company: "云桥数据科技",
    location: "杭州，中国",
    position: "全栈开发工程师",
    period: "2021.07 - 2023.02",
    achievements: [
      "负责数据分析平台的前后端开发，支持多团队并发使用。",
      "落地权限与审计模块，满足企业级合规与安全要求。",
      "实现自动化报表与任务调度能力，显著降低人工维护成本。",
    ],
  },
  {
    company: "北辰实验室",
    location: "南京，中国",
    position: "软件开发实习生",
    period: "2020.06 - 2021.06",
    achievements: [
      "参与实验平台功能开发与缺陷修复，积累工程协作经验。",
      "编写技术文档与测试用例，提升团队交接效率与可维护性。",
    ],
  },
];

export const education = [
  {
    institution: "华东理工大学",
    location: "上海，中国",
    degree: "软件工程 学士",
    period: "2016 - 2020",
    achievements: [
      "担任技术社团负责人，组织多场技术分享与项目实践。",
      "参与校级创新项目并获得优秀结题评价。",
      "多次获得学业奖学金与综合素质奖。",
    ],
  },
];

export const skills = {
  programmingLanguages: ["JavaScript", "TypeScript", "Python", "Go", "SQL", "Bash"],
  frontendDevelopment: [
    "React",
    "Next.js",
    "Astro",
    "Tailwind CSS",
    "Vite",
    "HTML5",
    "CSS3",
  ],
  backendDevelopment: ["Node.js", "Express", "NestJS", "REST API"],
  databaseAndStorage: ["PostgreSQL", "MySQL", "Redis", "Prisma"],
  cloudAndDevOps: ["Docker", "GitHub Actions", "Nginx", "Linux"],
  toolsAndServices: ["Git", "Figma", "Postman", "Sentry", "Plausible", "Notion"],
};

export const projects = [
  {
    title: "个人知识花园系统",
    github: "https://github.com/yourname/knowledge-garden",
    description: [
      "基于静态站点生成器构建，支持 Markdown 写作与全文检索。",
      "实现标签分类、目录导航与反向链接，提升内容可探索性。",
      "增加自动化部署流程，支持推送后自动发布。",
      "通过缓存与资源压缩优化，提升页面加载速度。",
      "支持 SEO 元数据与站点地图自动生成。",
    ],
  },
  {
    title: "团队协作看板平台",
    github: "https://github.com/yourname/team-kanban",
    description: [
      "提供任务分组、拖拽排序、筛选与搜索等核心能力。",
      "接入角色权限模型，满足多人协作下的访问控制。",
      "实现活动日志与通知机制，保障任务流转可追踪。",
      "封装复用组件与表单校验方案，提升开发一致性。",
      "支持暗色主题与响应式布局，覆盖多端使用场景。",
    ],
  },
];

export const awards = [
  {
    name: "全国高校软件创新大赛",
    issuer: "中国软件行业协会",
    date: "2024.11",
    type: "国家级",
    position: "一等奖",
  },
  {
    name: "华东地区开源应用挑战赛",
    issuer: "开源技术联盟",
    date: "2024.06",
    type: "国际",
    position: "优秀项目奖",
  },
  {
    name: "企业数字化创新黑客松",
    issuer: "星海科技",
    date: "2023.12",
    type: "国家级",
    position: "冠军",
  },
  {
    name: "高校程序设计竞赛",
    issuer: "华东理工大学",
    date: "2019.10",
    type: "国家级",
    position: "二等奖",
  },
];
