import styles from "../AboutClient.module.css"

export default function ResearchSection({ html }: { html: string }) {
  return (
    <section
      id="about-research"
      data-about-section="research"
      className={styles.section}
      aria-labelledby="about-research-title"
    >
      <header className={styles.sectionHeader}>
        <span className={styles.eyebrow}>03 / RESEARCH</span>
        <h2 id="about-research-title" className={styles.sectionTitle}>研究身份</h2>
        <p className={styles.sectionSubtitle}>拓扑数据分析、同调理论与双曲几何</p>
      </header>
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
