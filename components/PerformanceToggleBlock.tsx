"use client"

import { useFieldMode } from "./FieldModeProvider"
import styles from "./ModePanel.module.css"

// Fixed finite-frequency studies, sampled once. These indicate the selection;
// the actual spectral renderer remains exclusive to /music.
function curve(offset: number, harmonic = false) {
  return Array.from({ length: 65 }, (_, index) => {
    const t = index / 64
    const wave = Math.sin(t * Math.PI * 2 - 0.6 + (harmonic ? offset * 0.045 : 0))
    const detail = harmonic
      ? 10 * Math.sin(t * Math.PI * 4 + offset * 0.09) * Math.sin(t * Math.PI)
      : 0
    return `${index ? "L" : "M"}${(8 + t * 164).toFixed(2)},${(66 + offset + 17 * wave + detail).toFixed(2)}`
  }).join(" ")
}

const mainCurve = curve(0)
const normalCurves = [-26, 26].map((offset) => curve(offset))
const fieldCurves = [-28, -14, 14, 28].map((offset) => curve(offset, true))

export default function PerformanceToggleBlock() {
  const { performanceMode, togglePerformanceMode } = useFieldMode()
  const isFieldMode = performanceMode === "field"

  return (
    <button
      type="button"
      onClick={togglePerformanceMode}
      aria-pressed={isFieldMode}
      title={isFieldMode ? "切换到常规性能" : "切换到谱场性能"}
      className={styles.panel}
      data-field={isFieldMode}
    >
      <span className={styles.content}>
        <span className={styles.copy} data-panel-copy>
          <span className={styles.eyebrow} aria-hidden="true">
            02 / CURVE STUDY
          </span>
          <span className={styles.heading}>性能交替</span>
          <span className={styles.status}>
            {isFieldMode ? "谱场 · 共享频率" : "常规 · 轻量动画"}
          </span>
        </span>
        <svg
          className={`${styles.art} ${styles.curves}`}
          viewBox="0 0 180 132"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 0h180v132H0z" className={styles.curvePaper} />
          <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <g className={styles.normalCurves}>
              {normalCurves.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g className={styles.fieldCurves}>
              {fieldCurves.map((d, index) => (
                <path key={d} d={d} className={index % 2 ? styles.warmCurve : undefined} />
              ))}
            </g>
            <path d={mainCurve} strokeWidth="1.8" />
          </g>
        </svg>
      </span>
    </button>
  )
}
