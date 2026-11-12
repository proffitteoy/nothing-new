"use client"

import { useEffect, useRef, useState } from "react"
import WebsiteSection from "./about/WebsiteSection"
import EngineeringSection from "./about/EngineeringSection"
import ResearchSection from "./about/ResearchSection"
import styles from "./AboutClient.module.css"

type SectionId = "website" | "engineering" | "research"

const sections: { id: SectionId; target: string; label: string; number: string }[] = [
  { id: "website", target: "about-website", label: "网站介绍", number: "01" },
  { id: "engineering", target: "about-engineering", label: "工程身份", number: "02" },
  { id: "research", target: "about-research", label: "研究身份", number: "03" },
]

export default function AboutClient({
  websiteHtml,
  engineeringHtml,
  researchHtml,
  coverImage,
}: {
  websiteHtml: string
  engineeringHtml: string
  researchHtml: string
  coverImage: string
}) {
  const pageRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState<SectionId>("website")

  useEffect(() => {
    const root = document.getElementById("app-scroll-root")
    const targets = Array.from(
      pageRef.current?.querySelectorAll<HTMLElement>("[data-about-section]") ?? [],
    )
    if (targets.length === 0) return

    let frame = 0
    const updateActive = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const desktop = window.matchMedia("(min-width: 768px)").matches
        const rootTop = desktop && root ? root.getBoundingClientRect().top : 0
        const viewHeight = desktop && root ? root.clientHeight : window.innerHeight
        const marker = rootTop + Math.min(viewHeight * 0.36, 320)
        let current: SectionId = "website"

        for (const target of targets) {
          if (target.getBoundingClientRect().top <= marker) {
            current = target.dataset.aboutSection as SectionId
          }
        }
        setActiveSection(current)
      })
    }

    root?.addEventListener("scroll", updateActive, { passive: true })
    window.addEventListener("scroll", updateActive, { passive: true })
    window.addEventListener("resize", updateActive)
    updateActive()

    return () => {
      window.cancelAnimationFrame(frame)
      root?.removeEventListener("scroll", updateActive)
      window.removeEventListener("scroll", updateActive)
      window.removeEventListener("resize", updateActive)
    }
  }, [])

  const goToSection = (target: string, id: SectionId) => {
    setActiveSection(id)
    document.getElementById(target)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    })
  }

  return (
    <article ref={pageRef} className={styles.profile} aria-labelledby="about-title">
      <div className={styles.layout}>
        <aside className={styles.indexColumn}>
          <nav className={styles.indexNav} aria-label="关于页章节导航">
            <p className={styles.indexTitle}>ABOUT / 目录</p>
            <div className={styles.indexLinks}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={styles.indexButton}
                  aria-controls={section.target}
                  aria-current={activeSection === section.id ? "location" : undefined}
                  onClick={() => goToSection(section.target, section.id)}
                >
                  <span className={styles.indexNumber}>{section.number}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
            <p className={styles.indexHint}>点击章节，或继续向下阅读</p>
          </nav>
        </aside>

        <div className={styles.sections}>
          <WebsiteSection html={websiteHtml} coverImage={coverImage} />
          <EngineeringSection html={engineeringHtml} />
          <ResearchSection html={researchHtml} />
        </div>
      </div>
    </article>
  )
}
