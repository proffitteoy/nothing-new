import PageTransition from "../../components/PageTransition"
import ProjectsBoard from "./ProjectsBoard"
import { siteConfig } from "@/siteConfig"

export const metadata = {
  title: "窗边研究小屋 | " + siteConfig.title,
  description: "proffitteoy 的研究项目、AI 工具、图方法与开源贡献。",
}

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-slate-50/15 dark:bg-slate-950/10"
      />
      <PageTransition>
        <ProjectsBoard />
      </PageTransition>
    </div>
  )
}
