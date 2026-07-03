"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Disc3,
  ListMusic,
  Pause,
  Play,
  RefreshCcw,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import MineradioParticleField from "../../components/MineradioParticleField";
import PageTransition from "../../components/PageTransition";
import { useMusic, type LyricLine, type MusicSong } from "../../components/MusicProvider";

type PlayerPanel = "lyrics" | "queue";

const fallbackCover = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

const getTitle = (song?: MusicSong) => song?.title || song?.name || "未知歌曲";
const getArtist = (song?: MusicSong) => song?.artist || song?.author || "未知歌手";
const getCover = (song?: MusicSong) => song?.cover || song?.pic || fallbackCover;

const formatTime = (time: number) => {
  if (!time || Number.isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function MusicClient() {
  const {
    playlist,
    currentIndex,
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentLyric,
    isLoading,
    togglePlay,
    nextSong,
    prevSong,
    handleSeek,
    seekToPercent,
    playSong,
    playMode,
    togglePlayMode,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    musicStatus,
    musicError,
    retryMusic,
  } = useMusic();

  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLButtonElement>(null);
  const [activePanel, setActivePanel] = useState<PlayerPanel>("lyrics");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const songCover = getCover(currentSong);

  const parsedLyrics = useMemo<LyricLine[]>(() => {
    if (!currentSong) return [];

    if (Array.isArray(currentSong.lyrics) && currentSong.lyrics.length > 0) {
      return currentSong.lyrics;
    }

    const rawLrc =
      currentSong.lrc ||
      currentSong.lyric ||
      (typeof currentSong.lyrics === "string" ? currentSong.lyrics : "");

    if (!rawLrc) return [];

    const parsed: LyricLine[] = [];
    const lines = rawLrc.split(/\r?\n/);
    const timeExp = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
    let hasTimedLine = false;

    for (const line of lines) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, "").trim();
      if (!text) continue;

      let match;
      while ((match = timeExp.exec(line)) !== null) {
        hasTimedLine = true;
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        parsed.push({ time: min * 60 + sec + ms, text });
      }
    }

    if (hasTimedLine) return parsed.sort((a, b) => a.time - b.time);

    return lines
      .map((line) => ({ time: -1, text: line.trim() }))
      .filter((line) => line.text);
  }, [currentSong]);

  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    const firstFutureIndex = parsedLyrics.findIndex((line) => line.time > currentTime);
    if (firstFutureIndex === -1) return parsedLyrics.length - 1;
    return Math.max(0, firstFutureIndex - 1);
  }, [currentTime, parsedLyrics]);

  useEffect(() => {
    if (!activeLyricRef.current || !lyricContainerRef.current || activePanel !== "lyrics") return;

    const container = lyricContainerRef.current;
    const activeItem = activeLyricRef.current;
    const scrollTarget = activeItem.offsetTop - container.offsetHeight / 2 + activeItem.offsetHeight / 2;
    container.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [activeLyricIndex, activePanel]);

  const playModeLabel = {
    loop: "列表循环",
    single: "单曲循环",
    random: "随机播放",
  }[playMode];

  const playModeIcon = {
    loop: <Repeat size={18} aria-hidden="true" />,
    single: <RefreshCcw size={18} aria-hidden="true" />,
    random: <Shuffle size={18} aria-hidden="true" />,
  }[playMode];

  const isRecoverable = musicStatus === "error" || musicStatus === "empty";

  if (isLoading || !currentSong) {
    return (
      <div className="relative min-h-screen overflow-hidden text-slate-900 dark:text-white">
        <Navbar />

        <main
          className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center"
          role="status"
          aria-live="polite"
        >
          <section className="w-full max-w-md rounded-3xl border border-white/40 bg-white/45 p-8 shadow-xl backdrop-blur-xl transition-colors duration-700 dark:border-white/10 dark:bg-slate-800/50">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/50 bg-white/50 shadow-inner dark:border-white/10 dark:bg-slate-900/50">
              <Disc3
                size={42}
                className={isLoading ? "animate-spin text-indigo-500 dark:text-indigo-300" : "text-pink-500 dark:text-pink-300"}
                aria-hidden="true"
              />
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">
              {isLoading ? "正在加载音乐" : musicStatus === "error" ? "音乐暂不可用" : "暂无可播放歌曲"}
            </h1>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
              {isLoading ? "正在准备播放列表，请稍候。" : musicError || "可以稍后重试，或先继续浏览其他内容。"}
            </p>
            {isRecoverable && (
              <button
                type="button"
                onClick={retryMusic}
                className="mt-8 rounded-full bg-indigo-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600"
              >
                重新加载
              </button>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900 dark:text-white">
      <Navbar />

      <PageTransition>
        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-10 pt-24 sm:px-6 md:pt-28 lg:px-10">
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-indigo-600 dark:text-indigo-300">音乐</p>
              <h1 className="text-3xl font-black sm:text-4xl md:text-5xl">正在播放</h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/45 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-200">
              <span className={`h-2.5 w-2.5 rounded-full ${isPlaying ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
              {isPlaying ? "播放中" : "已暂停"}
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <article className="relative isolate min-h-[640px] overflow-hidden rounded-3xl border border-white/40 bg-white/45 shadow-xl backdrop-blur-xl transition-colors duration-700 dark:border-white/10 dark:bg-slate-800/50">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 saturate-125 dark:opacity-15"
                style={{ backgroundImage: `url(${songCover})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/50 to-indigo-100/30 dark:from-slate-900/85 dark:via-slate-900/75 dark:to-indigo-950/45" />
              <MineradioParticleField
                coverUrl={songCover}
                isPlaying={isPlaying}
                progress={progress || 0}
                currentTime={currentTime}
                volume={isMuted ? 0 : volume || 0}
                seed={currentSong.id}
                className="z-[1] opacity-45 mix-blend-multiply dark:opacity-70 dark:mix-blend-screen"
              />

              <div className="relative z-10 flex h-full min-h-[640px] flex-col justify-between p-5 sm:p-7 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="rounded-full border border-white/50 bg-white/55 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-300">
                    {playModeLabel}
                  </p>
                  <p className="rounded-full border border-white/50 bg-white/55 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-300">
                    {currentIndex + 1} / {playlist.length}
                  </p>
                </div>

                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-8">
                  <div className="relative aspect-square w-[min(70vw,340px)]">
                    <motion.div
                      className="relative h-full w-full overflow-hidden rounded-3xl border border-white/60 bg-white/50 shadow-xl dark:border-white/10 dark:bg-slate-950/40"
                      animate={{ rotateY: isPlaying ? 0 : -5, scale: isPlaying ? 1 : 0.97 }}
                      transition={{ type: "spring", stiffness: 80, damping: 18 }}
                    >
                      <img src={songCover} alt={`${getTitle(currentSong)} 封面`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10" />
                    </motion.div>
                  </div>

                  <div className="mt-8 w-full text-center">
                    <h2 className="mx-auto max-w-3xl text-balance text-3xl font-black text-slate-900 dark:text-white sm:text-4xl md:text-5xl">{getTitle(currentSong)}</h2>
                    <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">{getArtist(currentSong)}</p>
                  </div>

                  <div className="relative mt-8 flex h-16 w-full max-w-lg items-end justify-center gap-1.5 overflow-hidden rounded-full border border-white/50 bg-white/45 px-5 pb-3 shadow-inner dark:border-white/10 dark:bg-slate-950/30" aria-hidden="true">
                    <div className="absolute inset-x-8 top-4 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent dark:via-indigo-200/25" />
                    {Array.from({ length: 28 }).map((_, index) => (
                      <span
                        key={index}
                        className={`w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-sky-400 to-pink-400 shadow-[0_0_16px_rgba(99,102,241,0.24)] ${isPlaying ? "radio-wave" : ""}`}
                        style={{
                          height: `${14 + ((index * 13) % 36)}px`,
                          animationDelay: `${index * 70}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/50 bg-white/55 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/35">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="w-12 text-right text-xs font-black tabular-nums text-slate-500 dark:text-slate-400">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress || 0}
                      onChange={handleSeek}
                      aria-label="播放进度"
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
                      style={{ background: `linear-gradient(to right, #6366f1 ${progress || 0}%, rgba(148,163,184,0.35) 0)` }}
                    />
                    <span className="w-12 text-xs font-black tabular-nums text-slate-500 dark:text-slate-400">{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label={`切换播放模式，当前为${playModeLabel}`}
                      title={playModeLabel}
                      onClick={togglePlayMode}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/50 text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:text-indigo-300"
                    >
                      {playModeIcon}
                    </button>

                    <div className="flex items-center gap-3 sm:gap-5">
                      <button
                        type="button"
                        aria-label="上一首"
                        onClick={prevSong}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/50 text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:text-indigo-300"
                      >
                        <SkipBack size={22} fill="currentColor" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={isPlaying ? "暂停" : "播放"}
                        onClick={togglePlay}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:bg-indigo-600"
                      >
                        {isPlaying ? <Pause size={28} fill="currentColor" aria-hidden="true" /> : <Play size={28} fill="currentColor" className="ml-1" aria-hidden="true" />}
                      </button>
                      <button
                        type="button"
                        aria-label="下一首"
                        onClick={nextSong}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/50 text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:text-indigo-300"
                      >
                        <SkipForward size={22} fill="currentColor" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="relative flex items-center" onMouseLeave={() => setShowVolumeSlider(false)}>
                      <AnimatePresence>
                        {showVolumeSlider && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 104 }}
                            exit={{ opacity: 0, width: 0 }}
                            className="absolute bottom-14 right-0 overflow-hidden rounded-full border border-white/50 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 md:bottom-auto md:right-12"
                          >
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              aria-label="音量"
                              value={isMuted ? 0 : volume || 0}
                              onChange={(event) => setVolume(Number(event.target.value))}
                              className="h-1 w-20 cursor-pointer appearance-none rounded-full"
                              style={{ background: `linear-gradient(to right, #ec4899 ${(volume || 0) * 100}%, rgba(148,163,184,0.35) 0)` }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        aria-label={isMuted || volume === 0 ? "打开音量控制，当前静音" : "打开音量控制"}
                        title="单击调节音量，双击静音"
                        onClick={() => setShowVolumeSlider((value) => !value)}
                        onDoubleClick={toggleMute}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                          showVolumeSlider
                            ? "border-pink-300 bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                            : "border-white/50 bg-white/50 text-slate-700 hover:text-pink-600 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:text-pink-300"
                        }`}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={19} aria-hidden="true" /> : <Volume2 size={19} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <aside className="flex min-h-[560px] flex-col rounded-3xl border border-white/40 bg-white/45 shadow-xl backdrop-blur-xl transition-colors duration-700 dark:border-white/10 dark:bg-slate-800/50">
              <div className="flex items-center justify-between border-b border-white/40 p-4 dark:border-white/10">
                <h2 className="text-xl font-black">播放信息</h2>
                <div className="flex rounded-full border border-white/50 bg-white/45 p-1 dark:border-white/10 dark:bg-slate-950/30">
                  <button
                    type="button"
                    aria-pressed={activePanel === "lyrics"}
                    onClick={() => setActivePanel("lyrics")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                      activePanel === "lyrics" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
                    }`}
                  >
                    <AudioLines size={14} aria-hidden="true" />
                    歌词
                  </button>
                  <button
                    type="button"
                    aria-pressed={activePanel === "queue"}
                    onClick={() => setActivePanel("queue")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                      activePanel === "queue" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
                    }`}
                  >
                    <ListMusic size={14} aria-hidden="true" />
                    列表
                  </button>
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activePanel === "lyrics" ? (
                    <motion.div key="lyrics" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="absolute inset-0">
                      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-20 bg-gradient-to-b from-white/95 to-transparent dark:from-slate-800/95" />
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-800/95" />
                      <div ref={lyricContainerRef} className="h-full overflow-y-auto px-5 music-scrollbar lyric-mask">
                        <div className="flex min-h-full flex-col gap-4 py-[34vh]">
                          {parsedLyrics.length > 0 ? (
                            parsedLyrics.map((line, index) => {
                              const isActive = index === activeLyricIndex;
                              const canSeek = line.time >= 0 && duration > 0;
                              return (
                                <button
                                  type="button"
                                  key={`${line.time}-${index}`}
                                  ref={isActive ? activeLyricRef : null}
                                  disabled={!canSeek}
                                  aria-current={isActive ? "true" : undefined}
                                  aria-label={canSeek ? `跳转到歌词：${line.text}` : `歌词：${line.text}`}
                                  onClick={() => canSeek && seekToPercent((line.time / duration) * 100)}
                                  className={`rounded-2xl px-4 py-3 text-left transition ${
                                    isActive
                                      ? "bg-indigo-500/10 text-indigo-700 shadow-sm dark:bg-indigo-400/10 dark:text-indigo-100"
                                      : "text-slate-500 hover:bg-white/50 hover:text-slate-800 disabled:hover:bg-transparent dark:hover:bg-white/5 dark:hover:text-slate-300"
                                  }`}
                                >
                                  <span className={`block leading-relaxed ${isActive ? "text-xl font-black" : "text-sm font-bold"}`}>{line.text}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                              <AudioLines size={34} className="mb-5 animate-pulse text-indigo-500/60 dark:text-indigo-200/60" aria-hidden="true" />
                              <p className="text-lg font-black text-indigo-700 dark:text-indigo-100">{currentLyric || "暂无歌词"}</p>
                              <p className="mt-3 max-w-xs text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">没有时间轴歌词时，这里只显示当前播放状态。</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="queue" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="absolute inset-0 overflow-y-auto p-4 music-scrollbar">
                      <div className="flex flex-col gap-2.5">
                        {playlist.map((song, index) => {
                          const isActive = index === currentIndex;
                          return (
                            <motion.button
                              type="button"
                              layout
                              key={`${song.id}-${index}`}
                              aria-current={isActive ? "true" : undefined}
                              onClick={() => playSong(index)}
                              className={`grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                isActive
                                  ? "border-indigo-400/50 bg-indigo-500/10"
                                  : "border-white/40 bg-white/40 hover:border-indigo-300/50 hover:bg-white/60 dark:border-white/10 dark:bg-slate-950/25 dark:hover:bg-white/5"
                              }`}
                            >
                              <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                                <img src={getCover(song)} alt={`${getTitle(song)} 封面`} className="h-12 w-12 object-cover" referrerPolicy="no-referrer" />
                                {isActive && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-indigo-600/55 backdrop-blur-[1px]">
                                    <AudioLines size={17} className={isPlaying ? "animate-pulse text-white" : "text-indigo-100"} aria-hidden="true" />
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-slate-900 dark:text-white">{getTitle(song)}</span>
                                <span className="mt-1 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{getArtist(song)}</span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </section>
        </main>
      </PageTransition>

      <style jsx global>{`
        .music-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .music-scrollbar::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.14);
          border-radius: 999px;
        }
        .music-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(99, 102, 241, 0.86), rgba(236, 72, 153, 0.58));
          border-radius: 999px;
        }
        .lyric-mask {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%);
        }
        .radio-wave {
          animation: radioWave 1.3s ease-in-out infinite alternate;
          transform-origin: bottom;
        }
        @keyframes radioWave {
          0% {
            transform: scaleY(0.42);
            opacity: 0.45;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .radio-wave {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
