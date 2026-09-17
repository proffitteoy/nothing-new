"use client"

import Image from "next/image"
import { useState } from "react"
import { useNearViewport } from "../../lib/image-loading"

export default function AnimeCoverImage({
  src,
  alt,
  immediate,
  nearViewportMarginPx,
}: {
  src: string | null
  alt: string
  immediate: boolean
  nearViewportMarginPx: number
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const { elementRef, shouldLoad } = useNearViewport<HTMLSpanElement>(
    immediate,
    nearViewportMarginPx,
  )
  const failed = failedSrc === src

  if (!src || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200/80 via-white/60 to-pink-200/80 px-2 text-center text-[8px] font-black tracking-[0.14em] text-indigo-700 dark:from-indigo-950 dark:via-slate-900 dark:to-pink-950 dark:text-indigo-200 sm:text-[9px]">
        NO COVER
      </span>
    )
  }

  return (
    <span ref={elementRef} className="absolute inset-0">
      {shouldLoad && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 639px) 24vw, (max-width: 1023px) 19vw, 170px"
          loading={immediate ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
        />
      )}
    </span>
  )
}
