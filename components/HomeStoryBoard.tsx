import Image from "next/image"

import ThemeToggleBlock from "./ThemeToggleBlock"
import PerformanceToggleBlock from "./PerformanceToggleBlock"

export default function HomeStoryBoard() {
  return (
    <section
      className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch"
      aria-label="主题与个人照片"
    >
      <div
        className="grid min-h-[280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:min-h-[340px] lg:grid-cols-1 lg:grid-rows-2"
        data-field-obstacle
      >
        <ThemeToggleBlock />
        <PerformanceToggleBlock />
      </div>

      <figure
        className="group relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/55 bg-white/45 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.65)] backdrop-blur-xl lg:col-span-8 lg:min-h-[340px] dark:border-white/10 dark:bg-slate-900/45"
        data-field-obstacle
      >
        <Image
          src="/profile-studio.png"
          alt="灯光下的个人研究工作台"
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
          sizes="(max-width: 1023px) calc(100vw - 2rem), 704px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/5 to-transparent" />
        <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-200/90">
            Photo Notes · 研究工作台
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            研究、构建，也持续记录。
          </h2>
        </figcaption>
      </figure>
    </section>
  )
}
