"use client"

import dynamic from "next/dynamic"
import { useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import type { PaperReport } from "../lib/papers"
import { createHomeVisitClock, isMobileHomeClient } from "../lib/home-scene"

const HomeScene = dynamic(() => import("./HomeScene"), { ssr: false })
const subscribe = () => () => {}
const desktop = () => !isMobileHomeClient()

export default function HomeDeviceGate({
  reports,
  blogHref,
}: {
  reports: PaperReport[]
  blogHref: string
}) {
  const allowed = useSyncExternalStore(subscribe, desktop, () => false)
  useEffect(() => {
    if (isMobileHomeClient()) {
      location.replace("/blog")
      return
    }
    if (!window.__homeVisitClock) {
      const clock = createHomeVisitClock(performance.now(), !document.hidden)
      const visibility = () => clock.visibility(performance.now(), !document.hidden)
      document.addEventListener("visibilitychange", visibility)
      window.__homeVisitClock = {
        ...clock,
        stop: () => document.removeEventListener("visibilitychange", visibility),
      }
    }
    return () => {
      window.__homeVisitClock?.stop()
      delete window.__homeVisitClock
    }
  }, [])
  return allowed ? (
    <HomeScene reports={reports} blogHref={blogHref} />
  ) : (
    <main
      aria-label="阿の宝藏之地"
      className="min-h-dvh grid place-content-center gap-6 text-center"
    >
      <h1>阿の宝藏之地</h1>
      <Link href={blogHref}>进入笔记</Link>
      <Link href="/about">关于</Link>
    </main>
  )
}
