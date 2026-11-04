"use client"

import { useId } from "react"
import { useTheme } from "./ThemeProvider"
import styles from "./ModePanel.module.css"

export default function ThemeToggleBlock() {
  const { isDark, toggleTheme } = useTheme()
  const id = useId()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? "切换到日间模式" : "切换到夜间模式"}
      className={styles.panel}
      data-dark={isDark}
    >
      <span className={styles.content}>
        <span className={styles.copy} data-panel-copy>
          <span className={styles.eyebrow} aria-hidden="true">
            01 / SKY STUDY
          </span>
          <span className={styles.heading}>昼夜交替</span>
          <span className={styles.status}>{isDark ? "当前 · 夜间流萤" : "当前 · 日间落樱"}</span>
        </span>
        <svg className={styles.art} viewBox="0 0 180 132" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-day`} x2="0" y2="1">
              <stop stopColor="#B8D9E8" />
              <stop offset=".65" stopColor="#E0EAF0" />
              <stop offset="1" stopColor="#FAEDDC" />
            </linearGradient>
            <linearGradient id={`${id}-night`} x2="0" y2="1">
              <stop stopColor="#202D51" />
              <stop offset="1" stopColor="#4B5272" />
            </linearGradient>
            <radialGradient id={`${id}-sun`}>
              <stop stopColor="#FFF0BD" stopOpacity=".8" />
              <stop offset="1" stopColor="#FFF0BD" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className={styles.skyDay}>
            <path fill={`url(#${id}-day)`} d="M0 0h180v132H0z" />
            <g className={styles.celestial}>
              <circle cx="134" cy="31" r="37" fill={`url(#${id}-sun)`} />
              <circle cx="134" cy="31" r="13" fill="#FFF1CB" />
            </g>
            <path
              d="M-9 57c13-10 20-5 26-9 7-18 28-15 32-2 10-2 18 3 19 10 12-2 20 2 23 8H-9Z"
              fill="#F7F8F3"
            />
            <path d="M-8 64c31-6 52 4 77-4l22 4" stroke="#D7E2E6" strokeWidth="2" />
            <path d="M108 79c5-8 12-8 17-7 4-15 24-16 31-2 10-2 20 4 23 11h-71Z" fill="#FAF6EC" />
            <path d="M0 113c38-14 72-6 106 2s52 4 74-2v19H0Z" fill="#B7C6CF" fillOpacity=".48" />
            <path d="M0 124c46-10 92 12 180-4v12H0Z" fill="#9FABBD" fillOpacity=".32" />
            <path d="m180 88-16 19-5 25m5-25-19 2m23-7 1-15" stroke="#9A7F88" strokeWidth="1.4" />
            <g fill="#E7A9B8">
              <path d="M143 108c-9-7-14 4-3 6-7 7 4 11 6 2 9 4 13-6 4-7 3-9-8-10-7-1Z" />
              <path d="M168 86c-7-6-10 3-2 5-5 6 4 8 5 1 8 3 10-5 3-6 2-7-7-8-6 0Z" />
            </g>
            <g className={styles.petal}>
              <path d="M37 91c-10-7-12 7-2 8 5-1 8-5 2-8Z" fill="#E6A4B6" />
              <path d="m35 93 3 3" stroke="#C9859E" strokeWidth=".6" />
            </g>
            <g className={styles.petal}>
              <path d="M89 41c-7-6-11 4-3 7 4 0 8-3 3-7Z" fill="#EDB9C6" />
            </g>
            <path d="M100 113c-5-5-9 2-3 5 4 1 7-2 3-5Z" fill="#E8A8B5" />
          </g>
          <g className={styles.skyNight}>
            <path fill={`url(#${id}-night)`} d="M0 0h180v132H0z" />
            <g className={styles.celestial}>
              <path d="M141 17a15 15 0 1 0 7 25 14 14 0 0 1-7-25Z" fill="#F4E8C6" />
            </g>
            <g fill="#D6DCEB">
              <circle cx="28" cy="27" r="1" />
              <circle cx="71" cy="18" r=".8" />
              <circle cx="94" cy="54" r=".9" />
              <circle cx="159" cy="65" r=".7" />
              <circle cx="49" cy="65" r=".6" />
              <path d="m100 24 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" opacity=".7" />
            </g>
            <path
              d="M-8 84c16-15 32-6 44-8 18-7 37-1 43 8 19-4 35 1 40 8H-8Z"
              fill="#65738F"
              fillOpacity=".3"
            />
            <path d="M0 115c44-16 88-1 118 2s43-5 62-4v19H0Z" fill="#2C3956" />
            <path d="M0 128c46-14 94 4 180-5v9H0Z" fill="#242F49" />
            <path
              d="m22 132-4-22m8 22 5-16m122 16 3-26m-8 26-5-15m14 15 9-18"
              stroke="#70808C"
              strokeWidth="1"
            />
            {[
              [44, 96],
              [81, 108],
              [126, 86],
              [150, 103],
            ].map(([x, y]) => (
              <g key={x} className={styles.firefly}>
                <circle cx={x} cy={y} r="5" fill="#EBE5AE" opacity=".08" />
                <circle cx={x} cy={y} r="1.6" fill="#E5E5B5" />
              </g>
            ))}
          </g>
        </svg>
      </span>
    </button>
  )
}
