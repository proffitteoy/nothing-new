"use client"

import { Music2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { useMusic } from "./MusicProvider"
import { getSizedMusicCoverUrl, isNeteaseMusicCoverUrl } from "../lib/image-loading"
import styles from "./HomeMusic.module.css"

const formatTime = (time: number) => {
  const seconds = Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
}

// #67 owns the slide-in shell and its focus/dismissal behavior.
// Retain the original record artwork and frosted visual language in this content component.
export default function CloudPlayer({
  active = true,
  id,
  className = "",
}: {
  active?: boolean
  id?: string
  className?: string
}) {
  const {
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    isLoading,
    musicStatus,
    musicError,
    togglePlay,
    nextSong,
    prevSong,
    handleSeek,
    retryMusic,
  } = useMusic()
  const loading = isLoading || musicStatus === "loading"
  const ready = !loading && musicStatus === "ready" && Boolean(currentSong)
  const title = currentSong?.title || currentSong?.name || "未知歌曲"
  const artist = currentSong?.artist || currentSong?.author || "未知歌手"
  const cover = currentSong?.cover || currentSong?.pic || ""
  const coverUrl = cover ? getSizedMusicCoverUrl(cover, 128) : ""
  const seekProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0

  return (
    <section
      id={id}
      aria-label="音乐控制"
      aria-busy={loading}
      hidden={!active}
      inert={!active}
      className={`${styles.player} ${className}`}
    >
      {ready ? (
        <>
          <div className={styles.track}>
            <div className={styles.coverShell} data-playing={isPlaying} aria-hidden="true">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt=""
                  width={58}
                  height={58}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin={isNeteaseMusicCoverUrl(coverUrl) ? "anonymous" : undefined}
                />
              ) : (
                <Music2 size={24} strokeWidth={1.5} />
              )}
              <span className={styles.recordHole} />
            </div>
            <div className={styles.songInfo}>
              <span className={styles.eyebrow}>云端音乐</span>
              <h2 className={styles.title} title={title}>{title}</h2>
              <p className={styles.artist} title={artist}>{artist}</p>
            </div>
          </div>
          <div className={styles.timeline}>
            <div className={styles.seekRow}>
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                aria-label="播放进度"
                aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                value={seekProgress}
                onChange={handleSeek}
                disabled={!Number.isFinite(duration) || duration <= 0}
                className={styles.seek}
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className={styles.controls}>
            <button type="button" aria-label="上一首" onClick={prevSong} className={styles.control}>
              <SkipBack size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? "暂停" : "播放"}
              onClick={togglePlay}
              className={`${styles.control} ${styles.primaryControl}`}
            >
              {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
            </button>
            <button type="button" aria-label="下一首" onClick={nextSong} className={styles.control}>
              <SkipForward size={18} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.eyebrow}>云端音乐</span>
          <p className={styles.status} role="status">
            {loading ? "正在连接音乐云端" : musicStatus === "error" ? "音乐连接失败" : "暂无可播放音乐"}
          </p>
          {!loading && (
            <>
              <p className={styles.artist}>{musicError || "请检查播放列表或网络连接"}</p>
              <button type="button" onClick={retryMusic} className={styles.retry}>
                <RotateCcw size={16} aria-hidden="true" /> 重试连接
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
