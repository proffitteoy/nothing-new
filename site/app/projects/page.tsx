import type { Metadata } from "next"
import { ArrowUpRight, Radar } from "lucide-react"
import { featuredProjects, missionTracks, profile } from "@/lib/profile"

export const metadata: Metadata = {
  title: "项目",
  description: "李炫良的项目索引与 GitHub Profile 展示。",
}

export default function ProjectsPage() {
  return (
    <div className="butterfly-page">
      <section className="profile-readme-card">
        <img
          src="https://capsule-render.vercel.app/api?type=waving&height=230&color=0:020617,35:1e3a8a,70:7c3aed,100:db2777&text=proffitteoy&fontColor=ffffff&fontSize=54&fontAlignY=36&desc=Applied%20Mathematics%20%C2%B7%20TDA%20%C2%B7%20Agent%20Systems%20%C2%B7%20Research%20Infrastructure&descAlignY=58&descSize=16&animation=fadeIn"
          alt="proffitteoy profile banner"
        />
        <img
          src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=22&duration=2600&pause=700&color=38BDF8&center=true&vCenter=true&width=880&lines=Applied+Mathematics+Student;Topological+Data+Analysis+%2F+Mathematical+Modeling;Building+AI-native+Research+Systems;From+Proofs+to+Pipelines%2C+from+Models+to+Agents"
          alt="Typing SVG introduction"
        />
        <div className="profile-badges">
          <img src="https://komarev.com/ghpvc/?username=proffitteoy&style=for-the-badge&color=0ea5e9" alt="Profile views" />
          <img
            src="https://img.shields.io/github/followers/proffitteoy?style=for-the-badge&logo=github&color=7c3aed"
            alt="GitHub followers"
          />
          <a href={profile.website}>
            <img src="https://img.shields.io/badge/Site-nothing--new.icu-db2777?style=for-the-badge" alt="Personal site" />
          </a>
        </div>
      </section>

      <section className="glass-panel p-7 md:p-10">
        <p className="section-eyebrow">Project Constellation</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">项目</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
          这里只展示项目相关内容；关于页不再重复项目经历，首页也不把简历摊开。
        </p>
      </section>

      <section className="project-grid">
        {featuredProjects.map((project) => (
          <a key={project.title} href={project.href} className="project-card">
            <span className="project-card__tag">{project.tag}</span>
            <span className="project-card__title">
              {project.title}
              <ArrowUpRight className="h-5 w-5" />
            </span>
            <span className="project-card__desc">{project.description}</span>
          </a>
        ))}
      </section>

      <section className="glass-panel p-7 md:p-10">
        <h2 className="home-card__headline">
          <Radar className="h-5 w-5" />
          <span>Mission Control</span>
        </h2>
        <div className="mission-table">
          {missionTracks.map(([track, signal]) => (
            <div key={track} className="mission-row">
              <strong>{track}</strong>
              <span>{signal}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
