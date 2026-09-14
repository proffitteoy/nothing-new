"use client"

import Image from "next/image"

import { siteConfig } from "../siteConfig"

export default function BackgroundSlider() {
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
    </div>
  )
}
