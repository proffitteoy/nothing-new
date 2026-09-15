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
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import MineradioParticleField from "../../components/MineradioParticleField";
import PageTransition from "../../components/PageTransition";
import { useMusic, type LyricLine, type MusicSong } from "../../components/MusicProvider";

const fallbackCover = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

const getTitle = (song?: MusicSong) => song?.title || song?.name || "未知歌曲";
const getArtist = (song?: MusicSong) => song?.artist || song?.author || "未知歌手";
const getCover = (song?: MusicSong) => song?.cover || song?.pic || fallbackCover;

const formatTime = (time: number) => {
  if (!time || Number.isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return mins + ":" + secs.toString().padStart(2, "0");
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
  const [queueOpen, setQueueOpen] = useState(false);
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
        const ms = match[3] ? parseFloat("0." + match[3]) : 0;
        parsed.push({ time: min * 60 + sec + ms, text });
      }
    }

    if (hasTimedLine) return parsed.sort((a, b) => a.time - b.time);

    return lines
      .map((line) => ({ time: -1, text: line.trim() }))
      .filter((line) => line.text);
  }, [currentSong]);

  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.some((line) => line.time >= 0)) return -1;
    const firstFutureIndex = parsedLyrics.findIndex((line) => line.time > currentTime);
    if (firstFutureIndex === -1) return parsedLyrics.length - 1;
    return Math.max(0, firstFutureIndex - 1);
  }, [currentTime, parsedLyrics]);

  useEffect(() => {
    if (!activeLyricRef.current || !lyricContainerRef.current) return;
    const container = lyricContainerRef.current;
    const activeItem = activeLyricRef.current;
    const scrollTarget = activeItem.offsetTop - container.offsetHeight / 2 + activeItem.offsetHeight / 2;
    container.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [activeLyricIndex]);

  useEffect(() => {
    if (!queueOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQueueOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueOpen]);

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
        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center" role="status" aria-live="polite">
          <section className="w-full max-w-md rounded-3xl border border-white/40 bg-white/45 p-8 shadow-xl backdrop-blur-xl transition-colors duration-700 dark:border-white/10 dark:bg-slate-800/50">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/50 bg-white/50 shadow-inner dark:border-white/10 dark:bg-slate-900/50">
              <Disc3 size={42} className={isLoading ? "animate-spin text-indigo-500 dark:text-indigo-300" : "text-pink-500 dark:text-pink-300"} aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">
              {isLoading ? "正在加载音乐" : musicStatus === "error" ? "音乐暂不可用" : "暂无可播放歌曲"}
            </h1>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
              {isLoading ? "正在准备播放列表，请稍候。" : musicError || "可以稍后重试，或先继续浏览其他内容。"}
            </p>
            {isRecoverable && (
              <button type="button" onClick={retryMusic} className="mt-8 rounded-full bg-indigo-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600">
                重新加载
              </button>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden text-slate-900 dark:text-white">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(99,102,241,0.12),transparent_42%),radial-gradient(circle_at_72%_28%,rgba(236,72,153,0.10),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_44%,rgba(129,140,248,0.13),transparent_44%),radial-gradient(circle_at_72%_28%,rgba(236,72,153,0.08),transparent_36%)]" />
        <MineradioParticleField
          coverUrl={songCover}
          isPlaying={isPlaying}
          progress={progress || 0}
          currentTime={currentTime}
          volume={isMuted ? 0 : volume || 0}
          seed={currentSong.id}
          className="opacity-55 mix-blend-multiply dark:opacity-75 dark:mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/35 dark:from-slate-950/10 dark:via-transparent dark:to-slate-950/45" />
      </div>

      <PageTransition>
        <main className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-4 pb-44 pt-24 sm:px-7 sm:pb-40 md:pt-28 lg:px-12">
          <header className="flex shrink-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
                <span className={"h-2 w-2 rounded-full " + (isPlaying ? "animate-pulse bg-emerald-500" : "bg-slate-400")} />
                {isPlaying ? "Now playing" : "Paused"}
              </div>
              <h1 className="max-w-[72vw] truncate text-xl font-black sm:text-2xl">{getTitle(currentSong)}</h1>
              <p className="mt-1 truncate text-sm font-bold text-slate-500 dark:text-slate-400">{getArtist(currentSong)}</p>
            </div>
            <button
              type="button"
              aria-label="打开播放列表"
              aria-controls="music-queue"
              aria-expanded={queueOpen}
              onClick={() => setQueueOpen(true)}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/50 bg-white/55 px-4 text-sm font-black text-slate-700 shadow-lg backdrop-blur-xl transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:text-indigo-300"
            >
              <ListMusic size={18} aria-hidden="true" />
              <span className="hidden sm:inline">{currentIndex + 1} / {playlist.length}</span>
            </button>
          </header>

          <section className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center py-3 sm:py-6" aria-label="歌词">
            <div data-field-obstacle className="relative h-full max-h-[62vh] min-h-[350px] w-full max-w-3xl">
              <div ref={lyricContainerRef} className="music-scrollbar lyric-mask h-full overflow-y-auto px-3 text-center sm:px-8">
                <div className="flex min-h-full flex-col items-center gap-3 py-[25vh] sm:gap-5">
                  {parsedLyrics.length > 0 ? (
                    parsedLyrics.map((line, index) => {
                      const isActive = index === activeLyricIndex;
                      const canSeek = line.time >= 0 && duration > 0;
                      const distance = activeLyricIndex < 0 ? 2 : Math.abs(index - activeLyricIndex);
                      const buttonTone = isActive
                        ? "scale-100 text-indigo-700 dark:text-indigo-100"
                        : distance <= 1
                          ? "scale-[0.96] text-slate-600 hover:text-slate-900 disabled:hover:text-slate-600 dark:text-slate-300 dark:hover:text-white dark:disabled:hover:text-slate-300"
                          : "scale-90 text-slate-400/70 hover:text-slate-700 disabled:hover:text-slate-400/70 dark:text-slate-500/75 dark:hover:text-slate-300 dark:disabled:hover:text-slate-500/75";
                      const textSize = isActive
                        ? "text-2xl font-black sm:text-4xl md:text-5xl"
                        : distance <= 1
                          ? "text-base font-bold sm:text-xl"
                          : "text-sm font-semibold sm:text-base";

                      return (
                        <button
                          type="button"
                          key={line.time + "-" + index}
                          ref={isActive ? activeLyricRef : null}
                          disabled={!canSeek}
                          aria-current={isActive ? "true" : undefined}
                          aria-label={canSeek ? "跳转到歌词：" + line.text : "歌词：" + line.text}
                          onClick={() => canSeek && seekToPercent((line.time / duration) * 100)}
                          className={"max-w-full rounded-2xl px-4 py-2 text-center transition duration-500 " + buttonTone}
                        >
                          <span className={"block text-balance leading-relaxed [text-shadow:0_2px_18px_rgba(255,255,255,0.86)] dark:[text-shadow:0_2px_22px_rgba(15,23,42,0.96)] " + textSize}>
                            {line.text}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                      <AudioLines size={34} className="mb-5 animate-pulse text-indigo-500/70 dark:text-indigo-200/70" aria-hidden="true" />
                      <p className="text-balance text-2xl font-black text-indigo-700 dark:text-indigo-100 sm:text-4xl">{currentLyric || "暂无歌词"}</p>
                      <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">这首歌没有可跳转的时间轴歌词。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </PageTransition>

      <section
        data-field-obstacle
        aria-label="播放控制"
        className="fixed inset-x-3 bottom-3 z-30 mx-auto w-auto max-w-4xl rounded-[26px] border border-white/55 bg-white/[0.72] p-3 shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl sm:inset-x-6 sm:bottom-5 sm:p-4 dark:border-white/10 dark:bg-slate-950/[0.72] dark:shadow-black/30"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img src={songCover} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-md" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{getTitle(currentSong)}</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{getArtist(currentSong)}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label={"切换播放模式，当前为" + playModeLabel}
              title={playModeLabel}
              onClick={togglePlayMode}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/70 hover:text-indigo-600 sm:flex dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-indigo-300"
            >
              {playModeIcon}
            </button>
            <button type="button" aria-label="上一首" onClick={prevSong} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/70 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-indigo-300">
              <SkipBack size={20} fill="currentColor" aria-hidden="true" />
            </button>
            <button type="button" aria-label={isPlaying ? "暂停" : "播放"} onClick={togglePlay} className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:bg-indigo-600">
              {isPlaying ? <Pause size={23} fill="currentColor" aria-hidden="true" /> : <Play size={23} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
            </button>
            <button type="button" aria-label="下一首" onClick={nextSong} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/70 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-indigo-300">
              <SkipForward size={20} fill="currentColor" aria-hidden="true" />
            </button>
            <div className="relative hidden items-center sm:flex" onMouseLeave={() => setShowVolumeSlider(false)}>
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-12 right-0 rounded-full border border-white/50 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      aria-label="音量"
                      value={isMuted ? 0 : volume || 0}
                      onChange={(event) => setVolume(Number(event.target.value))}
                      className="h-1 w-20 cursor-pointer appearance-none rounded-full"
                      style={{ background: "linear-gradient(to right, #ec4899 " + (volume || 0) * 100 + "%, rgba(148,163,184,0.35) 0)" }}
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
                className={"flex h-10 w-10 items-center justify-center rounded-full transition " + (showVolumeSlider ? "bg-pink-500 text-white" : "text-slate-600 hover:bg-white/70 hover:text-pink-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-pink-300")}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
              </button>
            </div>
            <button type="button" aria-label="打开播放列表" aria-controls="music-queue" aria-expanded={queueOpen} onClick={() => setQueueOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/70 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-indigo-300 sm:hidden">
              <ListMusic size={19} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-10 text-right text-[11px] font-black tabular-nums text-slate-500 dark:text-slate-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            aria-label="播放进度"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
            style={{ background: "linear-gradient(to right, #6366f1 " + (progress || 0) + "%, rgba(148,163,184,0.35) 0)" }}
          />
          <span className="w-10 text-[11px] font-black tabular-nums text-slate-500 dark:text-slate-400">{formatTime(duration)}</span>
        </div>
      </section>

      <AnimatePresence>
        {queueOpen && (
          <>
            <motion.button
              type="button"
              aria-label="关闭播放列表"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQueueOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[2px]"
            />
            <motion.aside
              id="music-queue"
              role="dialog"
              aria-modal="true"
              aria-labelledby="music-queue-title"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed bottom-3 right-3 top-20 z-50 flex w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/[0.84] shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/[0.86]"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 p-4 dark:border-white/10">
                <div>
                  <h2 id="music-queue-title" className="text-xl font-black">播放列表</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{playlist.length} 首歌曲 · {playModeLabel}</p>
                </div>
                <button type="button" aria-label="关闭播放列表" onClick={() => setQueueOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="music-scrollbar flex-1 overflow-y-auto p-3">
                <div className="flex flex-col gap-2">
                  {playlist.map((song, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <motion.button
                        type="button"
                        layout
                        key={song.id + "-" + index}
                        aria-current={isActive ? "true" : undefined}
                        onClick={() => {
                          playSong(index);
                          setQueueOpen(false);
                        }}
                        className={"grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition " + (isActive ? "border-indigo-400/50 bg-indigo-500/10" : "border-transparent hover:border-indigo-300/40 hover:bg-white/65 dark:hover:border-white/10 dark:hover:bg-white/5")}
                      >
                        <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                          <img src={getCover(song)} alt={getTitle(song) + " 封面"} className="h-12 w-12 object-cover" referrerPolicy="no-referrer" />
                          {isActive && (
                            <span className="absolute inset-0 flex items-center justify-center bg-indigo-600/55">
                              <AudioLines size={17} className={isPlaying ? "animate-pulse text-white" : "text-indigo-100"} aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{getTitle(song)}</span>
                          <span className="mt-1 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{getArtist(song)}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{".music-scrollbar::-webkit-scrollbar{width:8px}.music-scrollbar::-webkit-scrollbar-track{background:rgba(148,163,184,.14);border-radius:999px}.music-scrollbar::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(99,102,241,.86),rgba(236,72,153,.58));border-radius:999px}.lyric-mask{-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 14%,black 86%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0%,black 14%,black 86%,transparent 100%)}"}</style>
    </div>
  );
}
