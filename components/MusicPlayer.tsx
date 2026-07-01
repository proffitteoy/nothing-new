"use client";

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface LyricLine {
  time: number;
  text: string;
}

interface Song {
  id: string | number;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl: string | undefined;
}

interface MetingSong {
  id?: string | number;
  name?: string;
  artist?: string;
  cover?: string;
  url?: string;
  lrc?: string;
}

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 20000) return [];

  const result: LyricLine[] = [];
  for (const line of lrcText.split('\n')) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length === 0) continue;

    const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = match[3] ? parseInt(match[3]) : 0;
      const time = min * 60 + sec + ms / (match[3] && match[3].length === 3 ? 1000 : 100);
      result.push({ time, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function CloudPlayer({ songIds }: { songIds: string[] }) {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接音乐云端...");
  const [displayedLyric, setDisplayedLyric] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let isMounted = true;
    let emptyTimer: number | undefined;

    const fetchMusicData = async () => {
      try {
        const results = await Promise.all(
          songIds.map(async (id) => {
            try {
              const response = await fetch(`https://api.injahow.cn/meting/?server=netease&type=song&id=${id}`);
              if (!response.ok) throw new Error("API error");
              return (await response.json()) as MetingSong[];
            } catch {
              return null;
            }
          })
        );

        const mergedPlaylist = results
          .filter((res): res is MetingSong[] => Array.isArray(res) && res.length > 0)
          .map((res) => {
            const song = res[0];
            return {
              id: song.id ?? song.url ?? crypto.randomUUID(),
              title: song.name || '未知歌曲',
              artist: song.artist || '未知歌手',
              cover: song.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300',
              src: song.url || '',
              lrcUrl: song.lrc,
            };
          })
          .filter((song): song is Song => Boolean(song.src));

        if (!isMounted) return;

        if (mergedPlaylist.length > 0) {
          setPlaylist(mergedPlaylist);
        } else {
          setCurrentLyric("音乐流被拦截，可能是版权限制");
        }
        setIsLoading(false);
      } catch {
        if (isMounted) {
          setCurrentLyric("云端连接失败，请检查网络");
          setIsLoading(false);
        }
      }
    };

    if (songIds && songIds.length > 0) {
      void fetchMusicData();
    } else {
      emptyTimer = window.setTimeout(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setCurrentLyric("请配置 cloudMusicIds");
      }, 0);
    }

    return () => {
      isMounted = false;
      if (emptyTimer !== undefined) window.clearTimeout(emptyTimer);
    };
  }, [songIds]);

  useEffect(() => {
    if (playlist.length === 0) return;

    let isMounted = true;
    const currentSong = playlist[currentIndex];

    const loadLyrics = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setCurrentLyric("正在解析歌词...");
      setLyrics([]);

      if (!currentSong.lrcUrl) {
        setCurrentLyric("♪ 纯音乐，请欣赏 ♪");
        return;
      }

      try {
        const response = await fetch(currentSong.lrcUrl);
        if (!response.ok) throw new Error("Lyric request failed");
        const text = await response.text();
        if (!isMounted) return;
        setLyrics(parseLrc(text));
        setCurrentLyric("♪ 歌词加载完毕 ♪");
      } catch {
        if (isMounted) setCurrentLyric("♪ 纯享音乐 ♪");
      }
    };

    const playTimer = window.setTimeout(() => {
      if (isPlayingRef.current && audioRef.current) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }, 150);

    void loadLyrics();

    return () => {
      isMounted = false;
      window.clearTimeout(playTimer);
    };
  }, [currentIndex, playlist]);

  useEffect(() => {
    let i = 0;
    const resetTimer = window.setTimeout(() => setDisplayedLyric(""), 0);
    const typingInterval = window.setInterval(() => {
      if (i <= currentLyric.length) {
        setDisplayedLyric(currentLyric.slice(0, i));
        i++;
      } else {
        window.clearInterval(typingInterval);
      }
    }, 40);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(typingInterval);
    };
  }, [currentLyric]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => setCurrentIndex((prev) => (prev + 1) % playlist.length);
  const prevSong = () => setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const { currentTime, duration } = audioRef.current;
    setCurrentTime(currentTime);
    setDuration(duration || 0);
    setProgress((currentTime / (duration || 1)) * 100);

    if (lyrics.length > 0) {
      const activeLyric = lyrics.slice().reverse().find((line) => currentTime >= line.time);
      if (activeLyric && activeLyric.text !== currentLyric) {
        setCurrentLyric(activeLyric.text);
      }
    }
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(event.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  if (isLoading) {
    return (
      <div className="md:col-span-5 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center transition-colors duration-700 h-[220px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-slate-800 dark:text-white font-bold tracking-widest animate-pulse text-sm">连接音乐云端中...</span>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className="md:col-span-5 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center h-[220px] transition-colors duration-700">
        <span className="text-slate-600 dark:text-slate-300 font-bold mb-2">云端音乐加载失败</span>
      </div>
    );
  }

  const currentSong = playlist[currentIndex];

  return (
    <>
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #6366f1; cursor: pointer; transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.3); }
        @keyframes safeWave { 0%, 100% { height: 4px; } 50% { height: 28px; } }
        .safe-wave { animation: safeWave 1s ease-in-out infinite; transform-origin: bottom; will-change: height; }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor { animation: cursorBlink 0.8s step-end infinite; }
      `}</style>

      <div className="md:col-span-5 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col justify-between transition-all duration-700 hover:scale-[1.02] relative group overflow-hidden min-h-[220px]">
        <audio ref={audioRef} src={currentSong.src} onTimeUpdate={handleTimeUpdate} onEnded={nextSong} onLoadedMetadata={handleTimeUpdate} />
        <div className={`absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 blur-[50px] rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}></div>

        <div className="flex items-center gap-5 relative z-10 mb-6 mt-2">
          <div className={`w-20 h-20 rounded-full border-2 border-white/50 shadow-lg flex-shrink-0 overflow-hidden relative ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
            <img src={currentSong.cover} alt="专辑封面" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-300 shadow-inner"></div>
          </div>
          <div className="flex-col overflow-hidden w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-widest bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-sm shadow-sm transition-colors duration-700">云端音乐</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-700/50 px-2 rounded-full transition-colors duration-700">{currentIndex + 1} / {playlist.length}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate drop-shadow-sm transition-colors duration-700">{currentSong.title}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate drop-shadow-sm transition-colors duration-700">{currentSong.artist}</p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3 transition-colors duration-700">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              aria-label="播放进度"
              className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer shadow-inner"
              style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(255,255,255,0.2) ${progress}%)` }}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={prevSong} aria-label="上一首" className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button onClick={togglePlay} aria-label={isPlaying ? "暂停" : "播放"} className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all border-2 border-white/50 dark:border-slate-600">
              {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button onClick={nextSong} aria-label="下一首" className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          </div>
        </div>
      </div>

      <div className="md:col-span-12 order-last mt-4 rounded-3xl bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl p-5 flex items-center justify-between transition-all duration-700 hover:shadow-indigo-500/20 group min-h-[80px]">
        <div className="flex items-end justify-center gap-[4px] h-8 w-16">
          {isPlaying ? (
            <>
              <div className="w-1.5 bg-indigo-400 rounded-t-sm safe-wave" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 bg-purple-400 rounded-t-sm safe-wave" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 bg-indigo-500 rounded-t-sm safe-wave" style={{ animationDelay: '400ms' }}></div>
              <div className="w-1.5 bg-purple-500 rounded-t-sm safe-wave" style={{ animationDelay: '100ms' }}></div>
              <div className="w-1.5 bg-indigo-300 rounded-t-sm safe-wave" style={{ animationDelay: '300ms' }}></div>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1 bg-slate-600 rounded-t-sm transition-all duration-300"></div>
              <div className="w-1.5 h-1 bg-slate-600 rounded-t-sm transition-all duration-300"></div>
              <div className="w-1.5 h-1 bg-slate-600 rounded-t-sm transition-all duration-300"></div>
              <div className="w-1.5 h-1 bg-slate-600 rounded-t-sm transition-all duration-300"></div>
              <div className="w-1.5 h-1 bg-slate-600 rounded-t-sm transition-all duration-300"></div>
            </>
          )}
        </div>

        <div className="flex-1 px-8 flex justify-center items-center overflow-hidden">
          <p className="text-white text-lg font-bold tracking-widest truncate drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
            {displayedLyric}
            <span className="inline-block w-[3px] h-5 bg-indigo-400 align-middle ml-1 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-cursor"></span>
          </p>
        </div>

        <div className="w-16 flex justify-end">
          <svg className={`w-6 h-6 text-indigo-400/50 ${isPlaying ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>
    </>
  );
}
