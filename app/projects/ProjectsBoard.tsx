import {
  ArrowUpRight,
  Bot,
  Braces,
  Code2,
  GraduationCap,
  Network,
  Orbit,
  TimerReset,
} from "lucide-react"
import BackButton from "../../components/BackButton"
import styles from "./ProjectsBoard.module.css"

const PROFILE_URL = "https://github.com/proffitteoy"
const HERO_IMAGE =
  "https://raw.githubusercontent.com/proffitteoy/proffitteoy/main/assets/generated/profile-studio.png"

const tracks = [
  { label: "Study", value: "应用数学考研准备", icon: GraduationCap },
  { label: "Research", value: "传播树 · TDA · 图结构分析", icon: Orbit },
  { label: "Build", value: "AI 研究工作台与开源工具", icon: Braces },
]

const projects = [
  {
    index: "01",
    eyebrow: "RESEARCH ORIGINAL",
    name: "early-rumor-propagation-tda",
    description: "从早期谣言传播树中构造拓扑特征，并用持久同调观察传播结构。",
    href: "https://github.com/proffitteoy/early-rumor-propagation-tda",
    tags: ["TDA", "传播树", "持久同调"],
    icon: Orbit,
    featured: true,
  },
  {
    index: "02",
    eyebrow: "AI WORKBENCH",
    name: "Iris-Terminal",
    description: "把对话、检索、文件与笔记放进同一张桌面的本地优先 AI 研究工作台。",
    href: "https://github.com/proffitteoy/Iris-Terminal",
    tags: ["Local-first", "Research Workspace"],
    icon: Bot,
  },
  {
    index: "03",
    eyebrow: "CAMPUS PRODUCT",
    name: "ai-data-competitions-ui",
    description: "面向学生竞赛的学院级服务网站，以及可持续维护的组件体系。",
    href: "https://github.com/GDUF-quantitative/ai-data-competitions-ui",
    tags: ["Next.js", "React", "Tailwind CSS"],
    icon: Braces,
  },
  {
    index: "04",
    eyebrow: "GRAPH METHOD",
    name: "TILO-PRC",
    description: "结构感知的图聚类实验，串联 PRC 与 TILO 划分流程。",
    href: "https://github.com/proffitteoy/TILO-PRC",
    tags: ["Graph Clustering", "PRC", "TILO"],
    icon: Network,
  },
  {
    index: "05",
    eyebrow: "AGENT PIPELINE",
    name: "ManiMind",
    description: "面向研究产物生成的 Agent 编排层，让上下文、任务和审核形成闭环。",
    href: "https://github.com/proffitteoy/ManiMind",
    tags: ["Agent", "Artifact Pipeline"],
    icon: Bot,
  },
  {
    index: "06",
    eyebrow: "COGNITIVE WORKSTATION",
    name: "Task-Manager",
    description: "串联任务、计时、活动统计与每日复盘的本地优先认知工作站。",
    href: "https://github.com/proffitteoy/Task-Manager",
    tags: ["Task Management", "Local-first", "Electron"],
    icon: TimerReset,
  },
]

export default function ProjectsBoard() {
  return (
    <main className={styles.pageShell}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.utilityRow}>
          <BackButton />
          <p>SELECTED WORK · 2026</p>
        </div>

        <section className={styles.hero} aria-labelledby="projects-title">
          <div className={styles.heroImageWrap}>
            {/* The image lives in the public profile repository and stays in sync with its README. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt="夕阳下的数学与 AI 研究工作室"
              width="1792"
              height="1024"
              className={styles.heroImage}
            />
            <div className={styles.imageShade} />
            <span className={styles.imageStamp}>FIELD NOTES / 2026</span>
          </div>

          <div className={styles.heroCopy}>
            <p className={styles.kicker}>PROFFITTEOY · PROJECT ARCHIVE</p>
            <h1 id="projects-title">
              把研究做成
              <span>可以运行的作品。</span>
            </h1>
            <p className={styles.intro}>
              从拓扑数据分析到本地 AI 工具，我在意的不只是一个结果，
              还包括它能否被复现、检查，并在下一次研究里继续生长。
            </p>
            <div className={styles.heroActions}>
              <a href="#project-index" className={styles.primaryAction}>
                浏览项目 <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryAction}
              >
                <Code2 size={17} aria-hidden="true" /> GitHub 主页
              </a>
            </div>
          </div>

          <div className={styles.trackRail} aria-label="当前轨道">
            {tracks.map(({ label, value, icon: Icon }) => (
              <div className={styles.trackItem} key={label}>
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                <div>
                  <span>{label}</span>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.projectsSection} id="project-index" aria-labelledby="project-index-title">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionNumber}>01 / ORIGINAL WORK</p>
              <h2 id="project-index-title">原创作品矩阵</h2>
            </div>
            <p>研究方法、认知工具与真实服务。每个仓库都是一段仍在继续的实验。</p>
          </header>

          <div className={styles.projectGrid}>
            {projects.map(({ icon: Icon, ...project }) => (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.projectCard} ${project.featured ? styles.featuredCard : ""}`}
                key={project.name}
              >
                <div className={styles.cardTopline}>
                  <span>{project.index}</span>
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardEyebrow}>{project.eyebrow}</p>
                  <h3>{project.name}</h3>
                  <p className={styles.cardDescription}>{project.description}</p>
                </div>
                <div className={styles.cardFooter}>
                  <ul aria-label={`${project.name} 技术标签`}>
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <ArrowUpRight className={styles.cardArrow} size={22} aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.contribution} aria-labelledby="open-source-title">
          <div className={styles.contributionLabel}>
            <span>02</span>
            <p>OPEN SOURCE<br />CONTRIBUTION</p>
          </div>
          <div className={styles.contributionBody}>
            <p className={styles.sectionNumber}>COMMUNITY WORK</p>
            <h2 id="open-source-title">open-ani / animeko</h2>
            <p>参与 Android / Kotlin Multiplatform 调试修复、构建验证与 PR 协作。</p>
            <div className={styles.contributionTags}>
              <span>Kotlin Multiplatform</span>
              <span>Android</span>
              <span>PR 协作</span>
            </div>
          </div>
          <a
            href="https://github.com/open-ani/animeko"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="前往 open-ani animeko 仓库"
            className={styles.roundLink}
          >
            <ArrowUpRight size={28} aria-hidden="true" />
          </a>
        </section>

        <section className={styles.stackStrip} aria-label="常用技术栈">
          <p>WORKING STACK</p>
          <div>
            <span>TypeScript</span><i>✦</i>
            <span>React</span><i>✦</i>
            <span>Next.js</span><i>✦</i>
            <span>Python</span><i>✦</i>
            <span>PostgreSQL</span><i>✦</i>
            <span>Docker</span>
          </div>
        </section>

        <footer className={styles.projectFooter}>
          <div>
            <p className={styles.sectionNumber}>THE COMPLETE LOG</p>
            <h2>代码在 GitHub，思考留在这里。</h2>
          </div>
          <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">
            查看全部仓库 <ArrowUpRight size={19} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </main>
  )
}
