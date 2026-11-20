import styles from "../AboutClient.module.css"

export default function ResearchSection({ html }: { html: string }) {
  return (
    <section
      id="about-research"
      data-about-section="research"
      className={styles.section}
      aria-label="研究内容"
    >
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
