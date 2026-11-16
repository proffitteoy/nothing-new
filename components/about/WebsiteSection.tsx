import styles from "../AboutClient.module.css"

export default function WebsiteSection({ html }: { html: string }) {
  return (
    <section
      id="about-website"
      data-about-section="website"
      className={styles.section}
      aria-labelledby="about-website-title"
    >
      <h1 id="about-title" className="sr-only">关于</h1>
      <h2 id="about-website-title" className="sr-only">网站介绍</h2>
      <div className={styles.introGrid}>
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  )
}
