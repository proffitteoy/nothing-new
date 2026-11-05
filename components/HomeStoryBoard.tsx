import PaperMonitor from "./PaperMonitor"
import seedReports from "../data/tda-reports.json"
import { compilePaperReports } from "../lib/papers"
import "katex/dist/katex.min.css"

import ThemeToggleBlock from "./ThemeToggleBlock"

export default async function HomeStoryBoard() {
  const reports = await compilePaperReports(seedReports)
  return (
    <section
      className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch"
      aria-label="主题与论文周报"
    >
      <div className="lg:col-span-4" data-field-obstacle>
        <ThemeToggleBlock />
      </div>

      <PaperMonitor initialReports={reports} />
    </section>
  )
}
