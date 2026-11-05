import PageTransition from "../../components/PageTransition"
import ProjectsBoard from "./ProjectsBoard"
import styles from "./room.module.css"
import { siteConfig } from "@/siteConfig"

export const metadata = {
  title: "研究小屋 | " + siteConfig.title,
  description: "proffitteoy 的研究项目、AI 工具、图方法与开源贡献。",
  alternates: { canonical: "/projects" },
}

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" className={styles.backdrop} />
      <PageTransition>
        <ProjectsBoard />
      </PageTransition>
    </div>
  )
}
