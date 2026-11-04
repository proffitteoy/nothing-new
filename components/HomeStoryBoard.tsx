import PaperMonitor from "./PaperMonitor"
import seedReports from "../data/tda-reports.json"
import { compilePaperReports } from "../lib/papers"
import "katex/dist/katex.min.css"

import ThemeToggleBlock from "./ThemeToggleBlock"
import PerformanceToggleBlock from "./PerformanceToggleBlock"

export default async function HomeStoryBoard() {
  const reports = await compilePaperReports(seedReports)
  return (
    <section
      className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch"
      aria-label="主题与论文周报"
    >
      <div
        className="grid min-h-[280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:min-h-[340px] lg:grid-cols-1 lg:grid-rows-2"
        data-field-obstacle
      >
        <ThemeToggleBlock />
        <PerformanceToggleBlock />
      </div>

      <PaperMonitor initialReports={reports} />
    </section>
  )
}
