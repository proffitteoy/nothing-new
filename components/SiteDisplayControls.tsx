"use client"

import { useId, useState } from "react"
import { useFieldMode } from "./FieldModeProvider"
import styles from "./SiteDisplayControls.module.css"

export default function SiteDisplayControls() {
  const { performanceMode, togglePerformanceMode } = useFieldMode()
  const [isOpen, setIsOpen] = useState(false)
  const id = useId()
  return (
    <div data-site-ui>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget={id}
        aria-expanded={isOpen}
        aria-controls={id}
        aria-label="性能设置"
      >
        <span aria-hidden="true">◦</span> 性能
      </button>
      <div
        id={id}
        popover="auto"
        className={styles.menu}
        role="group"
        aria-label="性能设置选项"
        onToggle={(event) => setIsOpen(event.currentTarget.matches(":popover-open"))}
      >
        <p className={styles.caption}>性能设置</p>
        <button
          type="button"
          onClick={togglePerformanceMode}
          aria-pressed={performanceMode === "field"}
          aria-label={performanceMode === "field" ? "当前谱场，切换到常规" : "当前常规，切换到谱场"}
        >
          <span>性能</span>
          <span>{performanceMode === "field" ? "谱场" : "常规"}</span>
        </button>
      </div>
    </div>
  )
}
