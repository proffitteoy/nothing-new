import type { Metadata } from "next"
import HomeDeviceGate from "../components/HomeDeviceGate"
import { getBlogEntryRoute } from "../lib/notes/server"

export const metadata: Metadata = { alternates: { canonical: "/" } }

export default async function Home() {
  const blogHref = await getBlogEntryRoute()
  return <HomeDeviceGate blogHref={blogHref} />
}
