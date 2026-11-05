import type { Metadata } from "next"
import HomeDeviceGate from "../components/HomeDeviceGate"
import seedReports from "../data/tda-reports.json"
import { compilePaperReports } from "../lib/papers"
import { getBlogEntryRoute } from "../lib/notes/server"

export const metadata: Metadata = { alternates: { canonical: "/" } }

export default async function Home() {
  const [reports, blogHref] = await Promise.all([
    compilePaperReports(seedReports),
    getBlogEntryRoute(),
  ])
  return <HomeDeviceGate reports={reports} blogHref={blogHref} />
}
