"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSyncExternalStore } from "react"

import { siteConfig } from "../siteConfig"

const subscribe = () => () => {}
const showDesktopBackdrop = () => !matchMedia("(hover: none) and (pointer: coarse)").matches

export default function BackgroundSlider() {
  const pathname = usePathname()
  const desktop = useSyncExternalStore(subscribe, showDesktopBackdrop, () => false)
  // No SSR preload: mobile notes must never download the homepage artwork.
  if (pathname === "/" || !desktop) return null
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src={siteConfig.backgroundImage}
        alt=""
        fill
        preload
        sizes="100vw"
        quality={75}
        className="scale-[1.01] object-cover object-center opacity-100 transition-opacity duration-1000"
      />
      <div
        className="absolute inset-0 bg-white/[0.12] transition-colors duration-1000"
        style={{
          backgroundImage: `linear-gradient(135deg, ${siteConfig.themeColors.map((color) => `${color}24`).join(", ")})`,
        }}
      />
    </div>
  )
}
