import Image from "next/image"
import { siteConfig } from "../../siteConfig"
import styles from "../AboutClient.module.css"

export default function WebsiteSection({
  html,
  coverImage,
}: {
  html: string
  coverImage: string
}) {
  return (
    <section
      id="about-website"
      data-about-section="website"
      className={styles.section}
      aria-labelledby="about-website-title"
    >
      <header className={styles.sectionHeader}>
        <span className={styles.eyebrow}>01 / THE WEBSITE</span>
        <h1 id="about-title" className={styles.pageTitle}>关于</h1>
        <h2 id="about-website-title" className={styles.sectionTitle}>网站介绍</h2>
        <p className={styles.sectionSubtitle}>由 {siteConfig.authorName} 持续维护的个人空间</p>
      </header>
      <div className={styles.introGrid}>
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
        <div className={styles.cover}>
          <Image
            src={coverImage}
            alt="网站介绍封面"
            fill
            priority
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 35vw, 300px"
            className={styles.coverImage}
          />
        </div>
      </div>
    </section>
  )
}
