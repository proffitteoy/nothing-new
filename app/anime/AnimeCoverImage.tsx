"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export default function AnimeCoverImage({
  src,
  alt,
  eager,
}: {
  src: string | null
  alt: string
  eager: boolean
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200/80 via-white/60 to-pink-200/80 px-2 text-center text-[8px] font-black tracking-[0.14em] text-indigo-700 dark:from-indigo-950 dark:via-slate-900 dark:to-pink-950 dark:text-indigo-200 sm:text-[9px]">
        NO COVER
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 639px) 24vw, (max-width: 1023px) 19vw, 170px"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
    />
  )
}
