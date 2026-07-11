import { ArrowUpRight, Bot, Braces, Code2, Network, Orbit, TimerReset } from "lucide-react"
import BackButton from "../../components/BackButton"

const projects = [
  {
    name: "early-rumor-propagation-tda",
    description: "早期谣言传播树的拓扑特征构造与持久同调分析。",
    href: "https://github.com/proffitteoy/early-rumor-propagation-tda",
    tags: ["TDA", "传播树", "持久同调"],
    icon: Orbit,
    tone: "from-sky-500/20 to-indigo-500/20",
  },
  {
    name: "Iris-Terminal",
    description: "本地优先 AI 研究工作台。",
    href: "https://github.com/proffitteoy/Iris-Terminal",
    tags: ["Local-first", "AI"],
    icon: Bot,
    tone: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    name: "ai-data-competitions-ui",
    description: "面向学生竞赛的学院级服务网站与组件体系。",
    href: "https://github.com/GDUF-quantitative/ai-data-competitions-ui",
    tags: ["Next.js", "React", "Tailwind CSS"],
    icon: Braces,
    tone: "from-cyan-500/20 to-blue-500/20",
  },
  {
    name: "TILO-PRC",
    description: "结构感知图聚类、PRC 与 TILO 划分流程。",
    href: "https://github.com/proffitteoy/TILO-PRC",
    tags: ["图聚类", "PRC", "TILO"],
    icon: Network,
    tone: "from-emerald-500/20 to-teal-500/20",
  },
  {
    name: "ManiMind",
    description: "面向研究产物生成的 Agent 编排层。",
    href: "https://github.com/proffitteoy/ManiMind",
    tags: ["Agent", "工作流"],
    icon: Bot,
    tone: "from-amber-500/20 to-orange-500/20",
  },
  {
    name: "Task-Manager",
    description: "串联任务、计时、活动统计与每日复盘的本地优先工作站。",
    href: "https://github.com/proffitteoy/Task-Manager",
    tags: ["Electron", "Local-first"],
    icon: TimerReset,
    tone: "from-rose-500/20 to-pink-500/20",
  },
]

export default function ProjectsBoard() {
  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12 relative z-10">
      <BackButton />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between rounded-3xl bg-white/45 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl p-6 md:p-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            项目
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            近期维护的个人项目与开源协作。
          </p>
        </div>
        <a
          href="https://github.com/proffitteoy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-600"
        >
          <Code2 className="h-4 w-4" aria-hidden="true" />
          GitHub
        </a>
      </header>

      <section className="mt-8" aria-labelledby="personal-projects-title">
        <h2
          id="personal-projects-title"
          className="mb-4 text-xl font-black text-slate-900 dark:text-white"
        >
          个人项目
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(({ icon: Icon, ...project }) => (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl bg-white/45 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              key={project.name}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${project.tone} opacity-60 transition-opacity duration-300 group-hover:opacity-90`}
              />

              <div className="relative flex min-h-44 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-white/50 dark:border-white/10 shadow-sm">
                    <Icon
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-300"
                      aria-hidden="true"
                    />
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-5">
                  <h3 className="text-lg font-black leading-snug text-slate-900 dark:text-white break-words">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {project.description}
                  </p>
                </div>

                <ul
                  className="mt-auto flex flex-wrap gap-1.5 pt-4"
                  aria-label={`${project.name} 标签`}
                >
                  {project.tags.map((tag) => (
                    <li
                      className="rounded-full bg-white/65 dark:bg-slate-900/50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                      key={tag}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="open-source-title">
        <h2
          id="open-source-title"
          className="mb-4 text-xl font-black text-slate-900 dark:text-white"
        >
          开源贡献
        </h2>
        <a
          href="https://github.com/open-ani/animeko"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-4 rounded-3xl bg-white/45 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:items-center"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10">
            <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              open-ani / animeko
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Android / Kotlin Multiplatform 调试修复、构建验证和 PR 协作。
            </p>
          </div>
          <ArrowUpRight
            className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500"
            aria-hidden="true"
          />
        </a>
      </section>
    </main>
  )
}
