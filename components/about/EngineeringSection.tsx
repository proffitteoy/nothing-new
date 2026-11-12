import styles from "../AboutClient.module.css"

export default function EngineeringSection({ html }: { html: string }) {
  return (
    <section
      id="about-engineering"
      data-about-section="engineering"
      className={styles.section}
      aria-labelledby="about-engineering-title"
    >
      <header className={styles.sectionHeader}>
        <span className={styles.eyebrow}>02 / ENGINEERING</span>
        <h2 id="about-engineering-title" className={styles.sectionTitle}>工程身份</h2>
        <p className={styles.sectionSubtitle}>算法、开源软件与平台开发</p>
      </header>
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
