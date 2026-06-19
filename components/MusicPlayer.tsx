"use client";

import { useState, useRef, useEffect } from 'react';

// 安全解析 LRC 歌词
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 20000) return [];
  const lines = lrcText.split('\n');
  const result = [];
  for (let line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      if (text) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const time = min * 60 + sec + ms / (match[3] && match[3].length === 3 ? 1000 : 100);
          result.push({ time, text });
        }
      }
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
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);

  const [currentLyric, setCurrentLyric] = useState("正在连接高可用神经云端...");
  const [displayedLyric, setDisplayedLyric] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMusicData = async () => {
      try {
        const fetchPromises = songIds.map(id =>
          fetch(`https://api.injahow.cn/meting/?server=netease&type=song&id=${id}`)
            .then(res => { if (!res.ok) throw new Error("API 异常"); return res.json(); })
            .catch(err => null)
        );
        const results = await Promise.all(fetchPromises);
        const mergedPlaylist = results
          .filter(res => res && res.length > 0)
          .map(res => {
            const song = res[0];
            return {
              id: song.id,
              title: song.name || '未知歌曲',
              artist: song.artist || '未知歌手',
              cover: song.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300',
              src: song.url,
              lrcUrl: song.lrc
            };
          })
          .filter(song => song.src);

        if (isMounted) {
          if (mergedPlaylist.length > 0) {
            setPlaylist(mergedPlaylist);
          } else {
            setCurrentLyric("音乐流被拦截，可能是版权限制");
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setCurrentLyric("云端连接失败，请检查网络");
          setIsLoading(false);
        }
      }
    };

    if (songIds && songIds.length > 0) fetchMusicData();
    else { setIsLoading(false); setCurrentLyric("请配置 cloudMusicIds"); }
    return () => { isMounted = false; };
  }, [songIds]);

  useEffect(() => {
    if (playlist.length === 0) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setCurrentLyric("正在解析歌词...");
    setLyrics([]);

    if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then(res => { if (!res.ok) throw new Error("失败"); return res.text(); })
        .then(text => {
          if (isMounted) {
            setLyrics(parseLrc(text));
            setCurrentLyric("♪ 歌词加载完毕 ♪");
          }
        })
        .catch(() => { if (isMounted) setCurrentLyric("♪ 纯享音乐 ♪"); });
    } else {
      setCurrentLyric("♪ 纯音乐，请欣赏 ♪");
    }

    if (isPlaying && audioRef.current) {
      setTimeout(() => audioRef.current?.play().catch(() => setIsPlaying(false)), 150);
    }
    return () => { isMounted = false; };
  }, [currentIndex, playlist]);

  useEffect(() => {
    setDisplayedLyric("");
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < currentLyric.length) {
        setDisplayedLyric((prev) => prev + currentLyric.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40);
    return () => clearInterval(typingInterval);
  }, [currentLyric]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = () => setCurrentIndex((prev) => (prev + 1) % playlist.length);
  const prevSong = () => setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyric = lyrics.slice().reverse().find(l => currentTime >= l.time);
        if (activeLyric && activeLyric.text !== currentLyric) {
          setCurrentLyric(activeLyric.text);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
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
        {/* 【修改点】：文字加入 dark:text-white */}
        <span className="text-slate-800 dark:text-white font-bold tracking-widest animate-pulse text-sm">CONNECTING...</span>
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

      {/* 音乐播放器卡片主体：加入 dark 模式背景适配 */}
      <div className="md:col-span-5 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col justify-between transition-all duration-700 hover:scale-[1.02] relative group overflow-hidden min-h-[220px]">
        <audio ref={audioRef} src={currentSong.src} onTimeUpdate={handleTimeUpdate} onEnded={nextSong} onLoadedMetadata={handleTimeUpdate} />
        <div className={`absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 blur-[50px] rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}></div>

        <div className="flex items-center gap-5 relative z-10 mb-6 mt-2">
          <div className={`w-20 h-20 rounded-full border-2 border-white/50 shadow-lg flex-shrink-0 overflow-hidden relative ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
            <img src={currentSong.cover} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-300 shadow-inner"></div>
          </div>
          <div className="flex-col overflow-hidden w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-widest uppercase bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-sm shadow-sm transition-colors duration-700">Cloud Music</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-700/50 px-2 rounded-full transition-colors duration-700">{currentIndex + 1} / {playlist.length}</span>
            </div>
            {/* 【修改点】：歌曲标题和歌手加上暗色模式字体 */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate drop-shadow-sm transition-colors duration-700">{currentSong.title}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate drop-shadow-sm transition-colors duration-700">{currentSong.artist}</p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3 transition-colors duration-700">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range" min="0" max="100" value={progress} onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer shadow-inner"
              style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(255,255,255,0.2) ${progress}%)` }}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={prevSong} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button onClick={togglePlay} className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all border-2 border-white/50 dark:border-slate-600">
              {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button onClick={nextSong} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          </div>
        </div>
      </div>

      {/* 底部独立歌词长条：夜晚可以稍微更黑一点以凸显发光字体 */}
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