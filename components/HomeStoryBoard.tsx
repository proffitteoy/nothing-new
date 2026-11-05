import PaperMonitor from "./PaperMonitor"
import seedReports from "../data/tda-reports.json"
import { compilePaperReports } from "../lib/papers"
import "katex/dist/katex.min.css"

export default async function HomeStoryBoard() {
  const reports = await compilePaperReports(seedReports)
  return (
    <section className="flex flex-col" aria-label="论文周报">
      <PaperMonitor initialReports={reports} />
    </section>
  )
}
