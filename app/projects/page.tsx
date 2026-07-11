import Navbar from "../../components/Navbar"
import PageTransition from "../../components/PageTransition"
import ProjectsBoard from "./ProjectsBoard"
import { siteConfig } from "@/siteConfig"

export const metadata = {
  title: "项目档案 | " + siteConfig.title,
  description: "proffitteoy 的研究项目、AI 工具、图方法与开源贡献。",
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="pt-16 md:pt-16">
          <ProjectsBoard />
        </div>
      </PageTransition>
    </div>
  )
}
