"use client"

import Image from "next/image"
import WebsiteSection from "./about/WebsiteSection"
import EngineeringSection from "./about/EngineeringSection"
import ResearchSection from "./about/ResearchSection"
import styles from "./AboutClient.module.css"

const sections = [{ target: "about-website", label: "网站介绍", number: "01" }]

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
  const goToSection = (target: string) => {
    document.getElementById(target)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    })
  }

  return (
    <article className={styles.profile} aria-labelledby="about-title">
      <div className={styles.layout}>
        <aside className={styles.indexColumn}>
          <nav className={styles.indexNav} aria-label="关于页章节导航">
            <p className={styles.indexTitle}>目录</p>
            <div className={styles.indexLinks}>
              {sections.map((section) => (
                <button
                  key={section.target}
                  type="button"
                  className={styles.indexButton}
                  aria-controls={section.target}
                  onClick={() => goToSection(section.target)}
                >
                  <span className={styles.indexNumber}>{section.number}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
            <div className={styles.indexCover}>
              <Image
                src={coverImage}
                alt="网站介绍封面"
                fill
                priority
                sizes="(max-width: 767px) 0px, 220px"
                className={styles.indexCoverImage}
              />
            </div>
          </nav>
        </aside>

        <div className={styles.sections}>
          <WebsiteSection html={websiteHtml} />
          <EngineeringSection html={engineeringHtml} />
          <ResearchSection html={researchHtml} />
        </div>
      </div>
    </article>
  )
}
