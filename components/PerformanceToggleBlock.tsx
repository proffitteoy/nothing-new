"use client"

import { useFieldMode } from "./FieldModeProvider"

export default function PerformanceToggleBlock() {
  const { performanceMode, togglePerformanceMode } = useFieldMode()
  const isFieldMode = performanceMode === "field"

  return (
    <button
      type="button"
      onClick={togglePerformanceMode}
      aria-pressed={isFieldMode}
      title={isFieldMode ? "切换到常规性能" : "切换到谱场性能"}
      className={`group relative flex h-full min-h-[132px] w-full cursor-pointer items-center overflow-hidden rounded-3xl border p-5 text-left shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 lg:min-h-0 ${
        isFieldMode
          ? "border-indigo-300/35 bg-slate-900/55"
          : "border-white/60 bg-white/40 dark:border-white/10 dark:bg-slate-800/45"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${isFieldMode ? "bg-[radial-gradient(circle_at_22%_24%,rgba(129,140,248,0.24),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.1),rgba(30,41,59,0.55))] opacity-100" : "bg-[linear-gradient(115deg,rgba(255,255,255,0.24),transparent_55%)] opacity-70"}`}
      />
      <span
        aria-hidden="true"
        className={`relative mr-4 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border shadow-inner transition-all duration-700 ${isFieldMode ? "rotate-6 border-indigo-300/35 bg-indigo-400/15 text-indigo-100" : "border-white/60 bg-white/35 text-slate-700 dark:border-white/10 dark:bg-slate-950/25 dark:text-slate-200"}`}
      >
        <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
          <path
            d="M7 31c5-10 9 8 14-5s9 6 20-10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 20c6 8 10-7 15 2s9-5 19 7"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity=".58"
          />
          {[9, 18, 26, 34, 41].map((cx, index) => (
            <circle key={cx} cx={cx} cy={index % 2 ? 25 : 23} r="1.4" fill="currentColor" />
          ))}
        </svg>
      </span>
      <span className="relative min-w-0">
        <span
          className={`block text-lg font-black tracking-tight transition-colors ${isFieldMode ? "text-white" : "text-slate-800 dark:text-white"}`}
        >
          性能交替
        </span>
        <span
          className={`mt-1 block text-xs font-bold tracking-wide transition-colors ${isFieldMode ? "text-indigo-200/85" : "text-slate-600 dark:text-slate-400"}`}
        >
          {isFieldMode ? "谱场 · 共享频率" : "常规 · 轻量动画"}
        </span>
      </span>
    </button>
  )
}
