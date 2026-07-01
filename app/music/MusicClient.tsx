"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  CloudSun,
  Disc3,
  ListMusic,
  Loader2,
  MapPin,
  Pause,
  Play,
  Radio,
  RefreshCcw,
  Repeat,
  Search,
  Shuffle,
  Signal,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { useMusic, type LyricLine, type MusicSong } from "../../components/MusicProvider";

type StudioPanel = "lyrics" | "queue";
type TuneStatus = "idle" | "loading" | "ready" | "error";

type TuneSong = {
  id: string | number;
  name?: string;
  title?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
};

type WeatherRadioResponse = {
  ok?: boolean;
  error?: string;
  weather?: {
    label?: string;
    temperature?: number | null;
    location?: {
      name?: string;
    };
  };
  radio?: {
    title?: string;
    subtitle?: string;
    songs?: TuneSong[];
  };
};

const fallbackCover = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

const getTitle = (song?: MusicSong) => song?.title || song?.name || "未知频道";
const getArtist = (song?: MusicSong) => song?.artist || song?.author || "Unknown artist";
const getCover = (song?: MusicSong) => song?.cover || song?.pic || fallbackCover;

const formatTime = (time: number) => {
  if (!time || Number.isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const frequencyFor = (index: number) => `${(88.6 + index * 1.3).toFixed(1)} FM`;

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
    stationName,
    stationDescription,
    retryMusic,
    loadSongsByIds,
  } = useMusic();

  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLButtonElement>(null);
  const [studioPanel, setStudioPanel] = useState<StudioPanel>("lyrics");
  const [tuningQuery, setTuningQuery] = useState("");
  const [tuneStatus, setTuneStatus] = useState<TuneStatus>("idle");
  const [tuneResults, setTuneResults] = useState<TuneSong[]>([]);
  const [tuneError, setTuneError] = useState("");
  const [weatherCity, setWeatherCity] = useState("上海");
  const [weatherStatus, setWeatherStatus] = useState<TuneStatus>("idle");
  const [weatherSummary, setWeatherSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const songCover = getCover(currentSong);
  const stationFrequency = frequencyFor(Math.max(currentIndex, 0));

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

  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return playlist;
    const lowerQuery = searchQuery.toLowerCase();

    return playlist.filter((song) =>
      getTitle(song).toLowerCase().includes(lowerQuery) ||
      getArtist(song).toLowerCase().includes(lowerQuery) ||
      frequencyFor(playlist.findIndex((item) => item.id === song.id)).toLowerCase().includes(lowerQuery)
    );
  }, [playlist, searchQuery]);

  useEffect(() => {
    if (!activeLyricRef.current || !lyricContainerRef.current || studioPanel !== "lyrics") return;

    const container = lyricContainerRef.current;
    const activeItem = activeLyricRef.current;
    const scrollTarget = activeItem.offsetTop - container.offsetHeight / 2 + activeItem.offsetHeight / 2;
    container.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [activeLyricIndex, studioPanel]);

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
  const tuningMessage = tuneStatus === "error" ? tuneError : weatherSummary;
  const tuningMessageIsError = tuneStatus === "error" || weatherStatus === "error";

  const tuneWithSongs = async (songs: TuneSong[], options: { name: string; description: string }) => {
    const ids = songs.map((song) => song.id).filter(Boolean);
    if (ids.length === 0) return;

    await loadSongsByIds(ids, {
      stationName: options.name,
      stationDescription: options.description,
      autoPlay: true,
    });
    setStudioPanel("lyrics");
  };

  const searchMineradioStation = async () => {
    const query = tuningQuery.trim();
    if (!query || tuneStatus === "loading") return;

    setTuneStatus("loading");
    setTuneError("");
    setWeatherSummary("");

    try {
      const response = await fetch(`/api/music/search?keywords=${encodeURIComponent(query)}&limit=12`);
      const data = (await response.json()) as { songs?: TuneSong[]; error?: string };
      if (!response.ok) throw new Error(data.error || "搜索频道失败");

      const songs = data.songs || [];
      setTuneResults(songs);
      setTuneStatus(songs.length > 0 ? "ready" : "error");
      if (songs.length === 0) setTuneError("没有搜索到可调谐的歌曲");
    } catch (error) {
      setTuneResults([]);
      setTuneStatus("error");
      setTuneError(error instanceof Error ? error.message : "搜索频道失败");
    }
  };

  const tuneSearchResult = async (song: TuneSong) => {
    const ordered = [song, ...tuneResults.filter((item) => item.id !== song.id)];
    await tuneWithSongs(ordered, {
      name: `搜索频道 · ${tuningQuery.trim() || getTitle(song as MusicSong)}`,
      description: `${ordered.length} 首搜索结果已经进入频道栈`,
    });
  };

  const tuneWeatherRadio = async () => {
    if (weatherStatus === "loading") return;

    setWeatherStatus("loading");
    setWeatherSummary("");
    setTuneError("");

    try {
      const response = await fetch(`/api/music/weather-radio?city=${encodeURIComponent(weatherCity.trim())}&limit=18`);
      const data = (await response.json()) as WeatherRadioResponse;
      if (!response.ok || !data.radio?.songs?.length) {
        throw new Error(data.error || "天气电台暂时没有歌曲");
      }

      const cityName = data.weather?.location?.name || weatherCity.trim() || "当前位置";
      const weatherText = [
        cityName,
        data.weather?.label,
        typeof data.weather?.temperature === "number" ? `${Math.round(data.weather.temperature)}°C` : "",
      ].filter(Boolean).join(" · ");

      setWeatherSummary(weatherText);
      setWeatherStatus("ready");
      await tuneWithSongs(data.radio.songs, {
        name: data.radio.title || "天气电台",
        description: data.radio.subtitle || weatherText || "根据天气调谐的播放队列",
      });
    } catch (error) {
      setWeatherStatus("error");
      setWeatherSummary(error instanceof Error ? error.message : "天气电台调谐失败");
    }
  };

  if (isLoading || !currentSong) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#080b10] text-white">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.22),transparent_28%),radial-gradient(circle_at_70%_10%,rgba(245,158,11,0.16),transparent_28%),linear-gradient(135deg,#080b10_0%,#111827_52%,#020617_100%)]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        </div>

        <Navbar />

        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center" role="status" aria-live="polite">
          <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full border border-cyan-300/20 bg-white/5 shadow-[0_0_70px_rgba(34,211,238,0.18)]">
            <div className="absolute inset-4 rounded-full border border-amber-300/20" />
            <Disc3 size={46} className={isLoading ? "animate-spin text-cyan-200" : "text-amber-200"} aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.45em] text-cyan-200/80">MINERADIO CLOUD</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {isLoading ? "正在调谐音乐信号" : musicStatus === "error" ? "云端信号中断" : "暂未捕获可播频道"}
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-7 text-slate-300">
            {isLoading ? "频道栈正在唤醒，播放器会在可用信号出现后进入播出状态。" : musicError || "可以稍后重试，或先继续浏览站点。"}
          </p>
          {isRecoverable && (
            <button
              type="button"
              onClick={retryMusic}
              className="mt-8 rounded-full border border-cyan-300/30 bg-cyan-300 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.24)] transition hover:bg-cyan-200"
            >
              重新调谐
            </button>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b10] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-[-12%] bg-cover bg-center opacity-30 blur-[62px] saturate-[1.25]" style={{ backgroundImage: `url(${songCover})` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(20,184,166,0.24),transparent_26%),radial-gradient(circle_at_80%_12%,rgba(245,158,11,0.16),transparent_24%),linear-gradient(135deg,rgba(8,11,16,0.82),rgba(15,23,42,0.92)_52%,rgba(2,6,23,0.96))]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <Navbar />

      <PageTransition>
        <main className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pt-28">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  <Radio size={13} aria-hidden="true" />
                  Mineradio Mode
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">
                  <Signal size={13} aria-hidden="true" />
                  {isPlaying ? "ON AIR" : "STANDBY"}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">Cloud Radio Deck</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-300 md:text-base">
                {stationDescription || "把歌单当作频道栈浏览：左侧选台，中间播出，右侧同步歌词和节目队列。"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 text-center shadow-2xl shadow-black/20 backdrop-blur-xl md:min-w-[360px]">
              <div className="rounded-xl bg-black/20 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Station</p>
                <p className="mt-1 text-sm font-black text-cyan-200">{stationFrequency}</p>
              </div>
              <div className="rounded-xl bg-black/20 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Tracks</p>
                <p className="mt-1 text-sm font-black text-amber-100">{playlist.length}</p>
              </div>
              <div className="rounded-xl bg-black/20 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Channel</p>
                <p className="mt-1 truncate text-sm font-black text-teal-100">{stationName || playModeLabel}</p>
              </div>
            </div>
          </header>

          <section className="grid min-h-[720px] grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)_390px]">
            <aside className="flex min-h-[360px] flex-col rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl lg:min-h-0">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200/70">Channel Stack</p>
                  <h2 className="mt-1 text-xl font-black">频道栈</h2>
                </div>
                <Waves className="text-cyan-200/70" size={22} aria-hidden="true" />
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <form
                  className="relative"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void searchMineradioStation();
                  }}
                >
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    type="text"
                    aria-label="搜索歌曲并调谐频道"
                    placeholder="搜索歌曲或歌手"
                    value={tuningQuery}
                    onChange={(event) => setTuningQuery(event.target.value)}
                    className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pl-10 pr-24 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50"
                  />
                  <button
                    type="submit"
                    disabled={!tuningQuery.trim() || tuneStatus === "loading"}
                    className="absolute right-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-full bg-cyan-200 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {tuneStatus === "loading" ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Radio size={13} aria-hidden="true" />}
                    Tune
                  </button>
                </form>

                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      type="text"
                      aria-label="天气电台城市"
                      value={weatherCity}
                      onChange={(event) => setWeatherCity(event.target.value)}
                      className="h-10 w-full rounded-full border border-white/10 bg-white/[0.06] pl-10 pr-3 text-xs font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-amber-200/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void tuneWeatherRadio()}
                    disabled={weatherStatus === "loading"}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 transition hover:border-amber-200/40 hover:bg-amber-200/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {weatherStatus === "loading" ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <CloudSun size={13} aria-hidden="true" />}
                    Weather
                  </button>
                </div>

                {tuningMessage && (
                  <p className={`mt-3 text-xs font-bold leading-5 ${tuningMessageIsError ? "text-rose-200" : "text-slate-400"}`}>
                    {tuningMessage}
                  </p>
                )}

                {tuneResults.length > 0 && (
                  <div className="mt-3 flex max-h-44 flex-col gap-2 overflow-y-auto pr-1 music-scrollbar">
                    {tuneResults.slice(0, 5).map((song) => (
                      <button
                        type="button"
                        key={song.id}
                        onClick={() => void tuneSearchResult(song)}
                        className="grid grid-cols-[38px_minmax(0,1fr)] gap-2 rounded-xl border border-white/5 bg-white/[0.05] p-2 text-left transition hover:border-cyan-200/25 hover:bg-cyan-300/[0.08]"
                      >
                        <img src={getCover(song as MusicSong)} alt={`${getTitle(song as MusicSong)} 封面`} className="h-9 w-9 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-black text-white">{getTitle(song as MusicSong)}</span>
                          <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400">{getArtist(song as MusicSong)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 music-scrollbar">
                <div className="flex flex-col gap-2">
                  {playlist.map((song, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <button
                        type="button"
                        key={song.id}
                        onClick={() => playSong(index)}
                        aria-current={isActive ? "true" : undefined}
                        className={`group grid grid-cols-[48px_minmax(0,1fr)] gap-3 rounded-2xl border p-2.5 text-left transition ${
                          isActive
                            ? "border-cyan-300/40 bg-cyan-300/12 shadow-[0_0_35px_rgba(34,211,238,0.12)]"
                            : "border-white/5 bg-black/18 hover:border-white/15 hover:bg-white/8"
                        }`}
                      >
                        <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-800">
                          <img src={getCover(song)} alt={`${getTitle(song)} 封面`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          {isActive && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                              <AudioLines size={17} className={isPlaying ? "animate-pulse text-cyan-100" : "text-slate-300"} aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/80">{frequencyFor(index)}</span>
                            {isActive && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-950">Live</span>}
                          </span>
                          <span className={`block truncate text-sm font-black ${isActive ? "text-white" : "text-slate-200"}`}>{getTitle(song)}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">{getArtist(song)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <section className="relative min-h-[680px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/25 backdrop-blur-2xl">
              <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `linear-gradient(120deg, rgba(34,211,238,.12), transparent 38%), url(${songCover})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0 bg-gradient-to-b from-[#071018]/60 via-[#080b10]/82 to-[#080b10]/96" />

              <div className="relative flex h-full min-h-[680px] flex-col justify-between p-5 sm:p-7 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Now Broadcasting</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                    <span className={`h-2 w-2 rounded-full ${isPlaying ? "animate-pulse bg-emerald-300" : "bg-slate-500"}`} />
                    {isPlaying ? "Signal Open" : "Signal Held"}
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-8">
                  <div className="relative aspect-square w-[min(72vw,360px)]">
                    <div className="absolute inset-[-18%] rounded-full bg-cyan-300/12 blur-3xl" />
                    <div className="absolute inset-[-8%] rounded-full border border-cyan-200/10" />
                    <motion.div
                      className="relative h-full w-full overflow-hidden rounded-[34px] border border-white/20 bg-slate-900 shadow-[0_32px_100px_rgba(0,0,0,0.5)]"
                      animate={{ rotateY: isPlaying ? 0 : -6, scale: isPlaying ? 1 : 0.97 }}
                      transition={{ type: "spring", stiffness: 80, damping: 18 }}
                    >
                      <img src={songCover} alt={`${getTitle(currentSong)} 封面`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10" />
                    </motion.div>
                  </div>

                  <div className="mt-8 w-full text-center">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.32em] text-cyan-200">{stationFrequency}</p>
                    <h2 className="mx-auto max-w-3xl text-balance text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">{getTitle(currentSong)}</h2>
                    <p className="mt-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-300">{getArtist(currentSong)}</p>
                  </div>

                  <div className="mt-8 flex h-16 w-full max-w-xl items-end justify-center gap-1.5" aria-hidden="true">
                    {Array.from({ length: 34 }).map((_, index) => (
                      <span
                        key={index}
                        className={`w-1.5 rounded-full bg-gradient-to-t from-cyan-300 via-teal-200 to-amber-100 ${isPlaying ? "radio-wave" : ""}`}
                        style={{
                          height: `${18 + ((index * 13) % 38)}px`,
                          animationDelay: `${index * 70}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/28 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
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
            </section>

            <aside className="flex min-h-[620px] flex-col rounded-[28px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-100/70">Studio Panel</p>
                  <h2 className="mt-1 text-xl font-black">直播间</h2>
                </div>
                <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    aria-pressed={studioPanel === "lyrics"}
                    onClick={() => setStudioPanel("lyrics")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                      studioPanel === "lyrics" ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <AudioLines size={14} aria-hidden="true" />
                    歌词
                  </button>
                  <button
                    type="button"
                    aria-pressed={studioPanel === "queue"}
                    onClick={() => setStudioPanel("queue")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                      studioPanel === "queue" ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <ListMusic size={14} aria-hidden="true" />
                    队列
                  </button>
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {studioPanel === "lyrics" ? (
                    <motion.div key="lyrics" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="absolute inset-0">
                      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-24 bg-gradient-to-b from-[#111827]/95 to-transparent" />
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-28 bg-gradient-to-t from-[#080b10]/95 to-transparent" />
                      <div ref={lyricContainerRef} className="h-full overflow-y-auto px-5 music-scrollbar lyric-mask">
                        <div className="flex min-h-full flex-col gap-4 py-[42vh]">
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
                            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                              <AudioLines size={38} className="mb-5 animate-pulse text-cyan-200/60" aria-hidden="true" />
                              <p className="text-lg font-black text-cyan-100">{currentLyric || "正在捕获歌词信号"}</p>
                              <p className="mt-3 max-w-xs text-sm font-medium leading-6 text-slate-400">没有时间轴歌词时，播放器会保持播出状态并显示当前信号。</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="queue" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="absolute inset-0 flex flex-col p-4">
                      <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                        <input
                          type="text"
                          aria-label="搜索频道"
                          placeholder="搜索频道、歌名或频率"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          className="h-12 w-full rounded-full border border-white/10 bg-black/25 pl-11 pr-11 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            aria-label="清空搜索"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                          >
                            <X size={15} aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1 music-scrollbar">
                        <div className="flex flex-col gap-2.5">
                          {filteredPlaylist.map((song) => {
                            const originalIndex = playlist.findIndex((item) => item.id === song.id);
                            const isActive = originalIndex === currentIndex;
                            return (
                              <motion.button
                                type="button"
                                layout
                                key={song.id}
                                onClick={() => playSong(originalIndex)}
                                className={`grid grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                  isActive ? "border-cyan-300/40 bg-cyan-300/12" : "border-white/5 bg-black/18 hover:border-white/15 hover:bg-white/8"
                                }`}
                              >
                                <img src={getCover(song)} alt={`${getTitle(song)} 封面`} className="h-14 w-14 rounded-xl object-cover" referrerPolicy="no-referrer" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-black text-white">{getTitle(song)}</span>
                                  <span className="mt-1 block truncate text-xs font-medium text-slate-400">{getArtist(song)}</span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/80">{frequencyFor(originalIndex)}</span>
                              </motion.button>
                            );
                          })}
                          {filteredPlaylist.length === 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-sm font-bold text-slate-400">
                              没有匹配的频道
                            </div>
                          )}
                        </div>
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
          background: linear-gradient(180deg, rgba(103, 232, 249, 0.9), rgba(251, 191, 36, 0.65));
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
