"use client"

import { useState, type CSSProperties } from "react"
import Link from "next/link"
import { ArrowUpRight, Music2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { useMusic } from "./MusicProvider"
import { getSizedMusicCoverUrl, isNeteaseMusicCoverUrl } from "../lib/image-loading"
import styles from "./HomeMusic.module.css"

const formatTime = (time: number) => {
  const seconds = Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`
}

// Keyed by song and URL below: a failed cover never prevents the next image attempt.
function CoverArt({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={styles.cover}>
      {src && !failed ? (
        <img
          src={src}
          alt="专辑封面"
          width={256}
          height={256}
          decoding="async"
          crossOrigin={isNeteaseMusicCoverUrl(src) ? "anonymous" : undefined}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.coverPlaceholder} role="img" aria-label="音乐封面占位">
          <Music2 size={36} strokeWidth={1} aria-hidden="true" />
          <span aria-hidden="true">NOTHING NEW / MUSIC</span>
        </div>
      )}
    </div>
  )
}

export default function CloudPlayer() {
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
  const failed = musicStatus === "error"
  const cover = ready
    ? getSizedMusicCoverUrl(currentSong?.cover || currentSong?.pic || "", 256)
    : ""
  const title = currentSong?.title || currentSong?.name || "未知歌曲"
  const artist = currentSong?.artist || currentSong?.author || "未知歌手"
  const seekProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0
  const stateText = loading
    ? "正在连接音乐云端"
    : ready
      ? isPlaying
        ? "播放中"
        : "已暂停"
      : failed
        ? "连接中断"
        : "暂无音轨"

  return (
    <section
      aria-label="首页音乐"
      aria-busy={loading}
      data-field-obstacle
      className={`${styles.visualScope} ${styles.player}`}
    >
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>NOW PLAYING / MUSIC</span>
        <Link href="/music" className={styles.musicLink}>
          完整播放器 <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </header>

      <div className={styles.record}>
        <CoverArt key={`${currentSong?.id ?? "empty"}:${cover}`} src={cover} />
        <div className={styles.songInfo}>
          {loading ? (
            <div className={styles.skeleton} aria-hidden="true">
              <span />
              <span />
            </div>
          ) : (
            <>
              <h3 className={styles.title} title={ready ? title : undefined}>
                {ready ? title : failed ? "音乐连接失败" : "暂无可播放音乐"}
              </h3>
              <p
                className={styles.artist}
                title={ready ? artist : musicError || "请检查播放列表或网络连接"}
              >
                {ready ? artist : musicError || "请检查播放列表或网络连接"}
              </p>
            </>
          )}
          <p className={styles.playState} role="status">
            <span
              className={styles.stateDot}
              data-playing={ready && isPlaying}
              aria-hidden="true"
            />
            {stateText}
          </p>
        </div>
      </div>

      <div className={styles.playerFooter}>
        {ready ? (
          <>
            <div className={styles.timeline}>
              <time>{formatTime(currentTime)}</time>
              <input
                type="range"
                min="0"
                max="100"
                aria-label="播放进度"
                aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                value={seekProgress}
                onChange={handleSeek}
                className={styles.seek}
                style={{ "--music-progress": `${seekProgress}%` } as CSSProperties}
              />
              <time>{formatTime(duration)}</time>
            </div>
            <div className={styles.controls}>
              <button
                type="button"
                aria-label="上一首"
                onClick={prevSong}
                className={styles.control}
              >
                <SkipBack size={20} fill="currentColor" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={isPlaying ? "暂停" : "播放"}
                onClick={togglePlay}
                className={`${styles.control} ${styles.primaryControl}`}
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" aria-hidden="true" />
                ) : (
                  <Play size={20} fill="currentColor" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="下一首"
                onClick={nextSong}
                className={styles.control}
              >
                <SkipForward size={20} fill="currentColor" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.recovery}>
            {loading ? (
              <p>音乐准备好后，即可从这里播放。</p>
            ) : (
              <button type="button" onClick={retryMusic} className={styles.retry}>
                <RotateCcw size={14} aria-hidden="true" /> 重试连接
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
