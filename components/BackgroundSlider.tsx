"use client"

import { usePathname } from "next/navigation"

export default function BackgroundSlider() {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <div
      className="absolute inset-0"
      style={{ background: "var(--inner-page-background)" }}
      data-inner-backdrop
      aria-hidden="true"
    />
  )
}
