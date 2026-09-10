"use client"

import { useState, type PointerEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowUpRight,
  Binary,
  Bot,
  Code2,
  Fingerprint,
  Network,
  Orbit,
  type LucideIcon,
} from "lucide-react"
import BackButton from "../../components/BackButton"

type Project = {
  name: string
  category: string
  description: string
  href: string
  tags: string[]
  icon: LucideIcon
  accent: string
  size?: "research" | "standard"
}

const featuredProjects: Project[] = [
  {
    name: "early-rumor-propagation-tda",
    category: "RESEARCH · 论文在投",
    description: "早期谣言传播树的拓扑特征构造与持久同调分析。",
    href: "https://github.com/proffitteoy/early-rumor-propagation-tda",
    tags: ["TDA", "Research"],
    icon: Orbit,
    accent: "56 189 248",
    size: "research",
  },
  {
    name: "topp",
    category: "RESEARCH · 论文在投",
    description: "拓扑数据分析的高速高性能 bottleneck/Wasserstein 计算 Python 库。",
    href: "https://github.com/proffitteoy/Topp",
    tags: ["TDA", "Python", "Exact Matching"],
    icon: Binary,
    accent: "59 130 246",
    size: "research",
  },
  {
    name: "Iris-Terminal",
    category: "AI WORKBENCH",
    description: "本地优先 AI4MATH 工作台。",
    href: "https://github.com/proffitteoy/Iris-Terminal",
    tags: ["Local-first", "Research Workspace"],
    icon: Bot,
    accent: "14 165 233",
  },
  {
    name: "ai-data-competitions-ui",
    category: "CAMPUS COMPETITION UI",
    description: "面向学生竞赛的学院级服务网站。",
    href: "https://github.com/GDUF-quantitative/ai-data-competitions-ui",
    tags: ["Next.js", "React"],
    icon: Network,
    accent: "6 182 212",
  },
]

const openSourceProjects: Project[] = [
  {
    name: "open-ani/animeko",
    category: "OPEN SOURCE CONTRIBUTION",
    description: "基于 CNN 的验证码识别算法开发。",
    href: "https://github.com/open-ani/animeko",
    tags: ["Kotlin Multiplatform", "Android"],
    icon: Fingerprint,
    accent: "56 189 248",
  },
  {
    name: "GUDHI/gudhi-devel",
    category: "OPEN SOURCE CONTRIBUTION",
    description: "核心数学算法的正确性漏洞修复与跨平台验证。",
    href: "https://github.com/GUDHI/gudhi-devel",
    tags: ["C++", "Bottleneck Distance", "Python"],
    icon: Code2,
    accent: "37 99 235",
  },
]

function ProjectCard({
  project,
  activeProject,
  setActiveProject,
  className = "",
}: {
  project: Project
  activeProject: string | null
  setActiveProject: (name: string | null) => void
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const Icon = project.icon
  const dimmed = activeProject !== null && activeProject !== project.name

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setSpotlight({ x, y })
    setTilt({ x: (50 - y) / 18, y: (x - 50) / 18 })
  }

  function resetCard() {
    setActiveProject(null)
    setTilt({ x: 0, y: 0 })
  }

  return (
    <motion.a
      data-field-obstacle
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      onFocus={() => setActiveProject(project.name)}
      onBlur={resetCard}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setActiveProject(project.name)
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCard}
      animate={{
        rotateX: reduceMotion ? 0 : tilt.x,
        rotateY: reduceMotion ? 0 : tilt.y,
        opacity: dimmed ? 0.68 : 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.7 }}
      className={`group relative isolate flex overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-5 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent dark:border-white/10 dark:bg-slate-900/60 sm:p-6 ${className}`}
      style={{ transformPerspective: 900, transformStyle: "preserve-3d" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          background: `radial-gradient(420px circle at ${spotlight.x}% ${spotlight.y}%, rgb(${project.accent} / 0.2), transparent 58%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 -z-10 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: `rgb(${project.accent} / 0.14)` }}
      />

      <div className="flex w-full flex-col" style={{ transform: "translateZ(22px)" }}>
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/60"
            style={{ color: `rgb(${project.accent})` }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <ArrowUpRight
            className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-sky-500 group-focus-visible:-translate-y-1 group-focus-visible:translate-x-1"
            aria-hidden="true"
          />
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-black tracking-[0.22em] text-sky-700 dark:text-sky-300">
            {project.category}
          </p>
          <h3
            className={`mt-3 break-words font-black leading-[1.08] tracking-[-0.035em] text-slate-950 dark:text-white ${project.size === "research" ? "text-2xl sm:text-[1.75rem]" : "text-xl sm:text-2xl"}`}
          >
            {project.name}
          </h3>
          <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-slate-700 dark:text-slate-300">
            {project.description}
          </p>
        </div>

        <ul className="mt-auto flex flex-wrap gap-2 pt-8" aria-label={`${project.name} 标签`}>
          {project.tags.map((tag) => (
            <li
              className="rounded-full border border-slate-200 bg-slate-50/95 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-300"
              key={tag}
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </motion.a>
  )
}

export default function ProjectsBoard() {
  const [activeProject, setActiveProject] = useState<string | null>(null)

  return (
    <main
      className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      style={{
        fontFamily:
          '"Avenir Next", "Segoe UI Variable", "PingFang SC", "Microsoft YaHei UI", sans-serif',
      }}
    >
      <BackButton />

      <header
        data-field-obstacle
        className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 md:p-9"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black tracking-[0.3em] text-sky-700 dark:text-sky-300">
              SELECTED WORK · 2026
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] text-slate-950 dark:text-white md:text-5xl">
              项目档案
            </h1>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
              从拓扑数据分析到本地研究工具，也记录进入成熟开源项目的真实协作。
            </p>
          </div>
          <a
            href="https://github.com/proffitteoy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 dark:bg-white dark:text-slate-950 motion-reduce:transform-none"
          >
            <Code2 className="h-4 w-4" aria-hidden="true" />
            GitHub 主页
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="featured-projects-title">
        <div className="mb-5 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-black tracking-[0.24em] text-sky-700 dark:text-sky-300">
              01 / FEATURED
            </p>
            <h2
              id="featured-projects-title"
              className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white"
            >
              代表作品
            </h2>
          </div>
          <p className="hidden text-xs font-bold text-slate-400 sm:block">研究优先 · 工具落地</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <ProjectCard
            project={featuredProjects[0]}
            activeProject={activeProject}
            setActiveProject={setActiveProject}
            className="min-h-[310px] lg:col-span-7"
          />
          <ProjectCard
            project={featuredProjects[1]}
            activeProject={activeProject}
            setActiveProject={setActiveProject}
            className="min-h-[310px] lg:col-span-5"
          />
          <ProjectCard
            project={featuredProjects[2]}
            activeProject={activeProject}
            setActiveProject={setActiveProject}
            className="min-h-[260px] lg:col-span-5"
          />
          <ProjectCard
            project={featuredProjects[3]}
            activeProject={activeProject}
            setActiveProject={setActiveProject}
            className="min-h-[260px] lg:col-span-7"
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="open-source-title">
        <div className="mb-5 px-1">
          <p className="text-[10px] font-black tracking-[0.24em] text-sky-700 dark:text-sky-300">
            02 / COLLABORATION
          </p>
          <h2
            id="open-source-title"
            className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            开源贡献
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {openSourceProjects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              className="min-h-[270px]"
            />
          ))}
        </div>
      </section>
    </main>
  )
}
