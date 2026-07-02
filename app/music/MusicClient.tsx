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
      <div className="relative min-h-screen overflow-hidden bg-[#070b10] text-white">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_38%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(250,204,21,0.12),transparent_24%),linear-gradient(135deg,#070b10_0%,#101827_54%,#020617_100%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <Navbar />

        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center" role="status" aria-live="polite">
          <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-cyan-200/20 bg-white/5 shadow-[0_0_70px_rgba(34,211,238,0.18)]">
            <div className="absolute inset-4 rounded-full border border-amber-200/20" />
            <Disc3 size={42} className={isLoading ? "animate-spin text-cyan-100" : "text-amber-100"} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {isLoading ? "正在加载音乐" : musicStatus === "error" ? "音乐暂不可用" : "暂无可播放歌曲"}
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-7 text-slate-300">
            {isLoading ? "正在准备播放列表，请稍候。" : musicError || "可以稍后重试，或先继续浏览其他内容。"}
          </p>
          {isRecoverable && (
            <button
              type="button"
              onClick={retryMusic}
              className="mt-8 rounded-full border border-cyan-200/30 bg-cyan-200 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.24)] transition hover:bg-cyan-100"
            >
              重新加载
            </button>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b10] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-[-12%] bg-cover bg-center opacity-26 blur-[64px] saturate-[1.25]" style={{ backgroundImage: `url(${songCover})` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_24%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_78%_78%,rgba(250,204,21,0.12),transparent_24%),linear-gradient(135deg,rgba(7,11,16,0.84),rgba(15,23,42,0.92)_52%,rgba(2,6,23,0.97))]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:52px_52px]" />
      </div>

      <Navbar />

      <PageTransition>
        <main className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pt-28">
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-cyan-100/80">音乐</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">正在播放</h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 backdrop-blur-xl">
              <span className={`h-2.5 w-2.5 rounded-full ${isPlaying ? "animate-pulse bg-emerald-300" : "bg-slate-500"}`} />
              {isPlaying ? "播放中" : "已暂停"}
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="relative isolate min-h-[680px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/25 backdrop-blur-2xl">
              <div className="absolute inset-0 opacity-55" style={{ backgroundImage: `linear-gradient(120deg, rgba(34,211,238,.12), transparent 38%), url(${songCover})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0 bg-gradient-to-b from-[#071018]/58 via-[#080b10]/78 to-[#070b10]/96" />
              <MineradioParticleField
                coverUrl={songCover}
                isPlaying={isPlaying}
                progress={progress || 0}
                currentTime={currentTime}
                volume={isMuted ? 0 : volume || 0}
                seed={currentSong.id}
                className="z-[1] opacity-95"
              />
              <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_43%,transparent_0%,transparent_28%,rgba(7,11,16,0.18)_60%,rgba(7,11,16,0.62)_100%)]" />

              <div className="relative z-10 flex h-full min-h-[680px] flex-col justify-between p-5 sm:p-7 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm font-bold text-slate-300 backdrop-blur-xl">
                    {playModeLabel}
                  </p>
                  <p className="rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm font-bold text-slate-300 backdrop-blur-xl">
                    {currentIndex + 1} / {playlist.length}
                  </p>
                </div>

                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-8">
                  <div className="relative aspect-square w-[min(72vw,350px)]">
                    <div className="absolute inset-[-18%] rounded-full bg-cyan-300/12 blur-3xl" />
                    <div className="absolute inset-[-9%] rounded-full border border-cyan-200/10" />
                    <div className={`absolute inset-[-16%] rounded-full border border-cyan-100/18 ${isPlaying ? "particle-orbit particle-orbit-a" : ""}`} />
                    <div className={`absolute inset-[-28%] rounded-full border border-amber-100/10 ${isPlaying ? "particle-orbit particle-orbit-b" : ""}`} />
                    <motion.div
                      className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/20 bg-slate-900 shadow-[0_32px_100px_rgba(0,0,0,0.5),0_0_80px_rgba(34,211,238,0.18)]"
                      animate={{ rotateY: isPlaying ? 0 : -5, scale: isPlaying ? 1 : 0.97 }}
                      transition={{ type: "spring", stiffness: 80, damping: 18 }}
                    >
                      <img src={songCover} alt={`${getTitle(currentSong)} 封面`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10" />
                    </motion.div>
                  </div>

                  <div className="mt-8 w-full text-center">
                    <h2 className="mx-auto max-w-3xl text-balance text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">{getTitle(currentSong)}</h2>
                    <p className="mt-3 text-sm font-bold tracking-[0.18em] text-slate-300">{getArtist(currentSong)}</p>
                  </div>

                  <div className="relative mt-8 flex h-16 w-full max-w-lg items-end justify-center gap-1.5 overflow-hidden rounded-full border border-white/10 bg-black/18 px-5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" aria-hidden="true">
                    <div className="absolute inset-x-8 top-4 h-px bg-gradient-to-r from-transparent via-cyan-200/26 to-transparent" />
                    {Array.from({ length: 28 }).map((_, index) => (
                      <span
                        key={index}
                        className={`w-1.5 rounded-full bg-gradient-to-t from-cyan-300 via-teal-200 to-amber-100 shadow-[0_0_16px_rgba(103,232,249,0.34)] ${isPlaying ? "radio-wave" : ""}`}
                        style={{
                          height: `${14 + ((index * 13) % 36)}px`,
                          animationDelay: `${index * 70}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-black/30 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="w-12 text-right text-xs font-black tabular-nums text-slate-400">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress || 0}
                      onChange={handleSeek}
                      aria-label="播放进度"
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
                      style={{ background: `linear-gradient(to right, #67e8f9 ${progress}%, rgba(255,255,255,0.16) 0)` }}
                    />
                    <span className="w-12 text-xs font-black tabular-nums text-slate-400">{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label={`切换播放模式，当前为${playModeLabel}`}
                      title={playModeLabel}
                      onClick={togglePlayMode}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-300 transition hover:border-cyan-200/40 hover:text-cyan-100"
                    >
                      {playModeIcon}
                    </button>

                    <div className="flex items-center gap-3 sm:gap-5">
                      <button
                        type="button"
                        aria-label="上一首"
                        onClick={prevSong}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-200 transition hover:border-cyan-200/40 hover:text-cyan-100"
                      >
                        <SkipBack size={22} fill="currentColor" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={isPlaying ? "暂停" : "播放"}
                        onClick={togglePlay}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-200 text-slate-950 shadow-[0_0_45px_rgba(103,232,249,0.35)] transition hover:scale-105 hover:bg-cyan-100"
                      >
                        {isPlaying ? <Pause size={28} fill="currentColor" aria-hidden="true" /> : <Play size={28} fill="currentColor" className="ml-1" aria-hidden="true" />}
                      </button>
                      <button
                        type="button"
                        aria-label="下一首"
                        onClick={nextSong}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-200 transition hover:border-cyan-200/40 hover:text-cyan-100"
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
                            className="absolute bottom-14 right-0 overflow-hidden rounded-full border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl md:bottom-auto md:right-12"
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
                              style={{ background: `linear-gradient(to right, #fcd34d ${(volume || 0) * 100}%, rgba(255,255,255,0.18) 0)` }}
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
                          showVolumeSlider ? "border-amber-200/50 bg-amber-200 text-slate-950" : "border-white/10 bg-white/8 text-slate-300 hover:text-amber-100"
                        }`}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={19} aria-hidden="true" /> : <Volume2 size={19} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <aside className="flex min-h-[560px] flex-col rounded-[28px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h2 className="text-xl font-black">播放信息</h2>
                <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    aria-pressed={activePanel === "lyrics"}
                    onClick={() => setActivePanel("lyrics")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                      activePanel === "lyrics" ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:text-white"
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
                      activePanel === "queue" ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:text-white"
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
                      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-20 bg-gradient-to-b from-[#101827]/95 to-transparent" />
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-[#070b10]/95 to-transparent" />
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
                                      ? "bg-cyan-300/12 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.12)]"
                                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:hover:bg-transparent"
                                  }`}
                                >
                                  <span className={`block leading-relaxed ${isActive ? "text-xl font-black" : "text-sm font-bold"}`}>{line.text}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                              <AudioLines size={34} className="mb-5 animate-pulse text-cyan-200/60" aria-hidden="true" />
                              <p className="text-lg font-black text-cyan-100">{currentLyric || "暂无歌词"}</p>
                              <p className="mt-3 max-w-xs text-sm font-medium leading-6 text-slate-400">没有时间轴歌词时，这里只显示当前播放状态。</p>
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
                                isActive ? "border-cyan-300/40 bg-cyan-300/12" : "border-white/5 bg-black/18 hover:border-white/15 hover:bg-white/8"
                              }`}
                            >
                              <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-800">
                                <img src={getCover(song)} alt={`${getTitle(song)} 封面`} className="h-12 w-12 object-cover" referrerPolicy="no-referrer" />
                                {isActive && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                                    <AudioLines size={17} className={isPlaying ? "animate-pulse text-cyan-100" : "text-slate-300"} aria-hidden="true" />
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-white">{getTitle(song)}</span>
                                <span className="mt-1 block truncate text-xs font-medium text-slate-400">{getArtist(song)}</span>
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
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
        }
        .music-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(103, 232, 249, 0.86), rgba(251, 191, 36, 0.58));
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
        .particle-orbit {
          animation: particleOrbit 9s linear infinite;
          box-shadow:
            0 0 34px rgba(103, 232, 249, 0.12),
            inset 0 0 34px rgba(103, 232, 249, 0.08);
          transform-origin: center;
        }
        .particle-orbit-b {
          animation-duration: 15s;
          animation-direction: reverse;
          box-shadow:
            0 0 42px rgba(251, 191, 36, 0.12),
            inset 0 0 42px rgba(251, 191, 36, 0.07);
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
        @keyframes particleOrbit {
          0% {
            transform: rotate(0deg) scale(0.98);
            opacity: 0.45;
          }
          50% {
            transform: rotate(180deg) scale(1.04);
            opacity: 0.9;
          }
          100% {
            transform: rotate(360deg) scale(0.98);
            opacity: 0.45;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .radio-wave,
          .particle-orbit {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
