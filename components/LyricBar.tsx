"use client"

import { useMusic } from "./MusicProvider"
import styles from "./HomeMusic.module.css"

// Mount inside the desktop stage's positioned UI layer, outside destructible art.
export default function LyricBar({
  active = true,
  className = "",
}: {
  active?: boolean
  className?: string
}) {
  const { currentLyric, currentSong, isLoading, musicStatus } = useMusic()
  const lyric = currentLyric.trim()
  // Only render an actual line of this song, never Provider loading/instrumental messages.
  const hasLyric =
    Array.isArray(currentSong?.lyrics) && currentSong.lyrics.some((line) => line.text === lyric)
  if (!active || !currentSong || isLoading || musicStatus !== "ready" || !lyric || !hasLyric)
    return null

  return (
    <section aria-label="当前歌词" className={`${styles.lyricBar} ${className}`}>
      <p className={styles.lyric} title={lyric}>
        <span key={`${currentSong.id}:${lyric}`}>{lyric}</span>
      </p>
    </section>
  )
}
