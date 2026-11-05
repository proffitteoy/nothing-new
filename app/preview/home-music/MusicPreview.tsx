"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import CloudPlayer from "../../../components/CloudPlayer"
import LyricBar from "../../../components/LyricBar"
import styles from "./preview.module.css"

// Contract harness only. This is not #67's sidebar, geometry or navigation.
export default function MusicPreview() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  return (
    <main className={styles.preview}>
      <h1>音乐组件接口预览</h1>
      <p>
        中性白模：演示受控显隐与舞台沉底歌词。人物安全区和 #67
        几何尚未冻结，此页不作为首页视觉验收。
      </p>
      <div className={styles.stage} aria-label="接口演示舞台">
        <div
          className={styles.host}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.preventDefault()
              setOpen(false)
              trigger.current?.focus()
            }
          }}
        >
          <button
            type="button"
            ref={trigger}
            aria-expanded={open}
            aria-controls="preview-music-controls"
            onClick={() => setOpen(!open)}
          >
            {open ? "收起音乐控制" : "展开音乐控制"}
          </button>
          <CloudPlayer id="preview-music-controls" active={open} />
        </div>
        <p className={styles.placeholder}>舞台内容由 #51 / #68 负责</p>
        <LyricBar />
      </div>
      <Link href="/about" prefetch={false}>
        前往关于页，检查跨页播放
      </Link>
    </main>
  )
}
