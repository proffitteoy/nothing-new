import styles from "../AboutClient.module.css"

export default function EngineeringSection({ html }: { html: string }) {
  return (
    <section
      id="about-engineering"
      data-about-section="engineering"
      className={styles.section}
      aria-label="工程实践"
    >
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
