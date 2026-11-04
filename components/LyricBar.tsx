"use client"

import { Music2 } from "lucide-react"
import { useMusic } from "./MusicProvider"
import styles from "./HomeMusic.module.css"

export default function LyricBar() {
  const { isPlaying, currentLyric, currentSong, isLoading, musicStatus } = useMusic()

  if (!currentSong || isLoading || musicStatus !== "ready") return null

  const lyric = currentLyric || "暂无歌词，静听音乐"

  return (
    <section
      aria-label="当前歌词"
      data-field-obstacle
      data-playing={isPlaying}
      className={`${styles.visualScope} ${styles.lyricBar}`}
    >
      <div className={styles.lyricLabel}>
        <div className={styles.waveform} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span key={bar} />
          ))}
        </div>
        <span className={styles.eyebrow}>LYRICS</span>
      </div>
      <p className={styles.lyric} title={lyric}>
        <span key={`${currentSong.id}:${lyric}`}>{lyric}</span>
      </p>
      <span className={styles.lyricState}>
        <Music2 size={15} aria-hidden="true" />
        {isPlaying ? "播放中" : "已暂停"}
      </span>
    </section>
  )
}
