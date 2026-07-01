"use client";

import { createContext, useContext, useState, useRef, useEffect, type ChangeEvent, type ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

// 【增强版 LRC 歌词解析】
export type LyricLine = { time: number; text: string };

export type MusicSong = {
  id: string | number;
  title?: string;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  src?: string;
  url?: string;
  lrc?: string;
  lyric?: string;
  lyrics?: LyricLine[] | string;
  lrcUrl?: string | null;
  error?: unknown;
};

type ApiSong = {
  id?: string | number;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  url?: string;
  lrc?: string;
  error?: unknown;
};

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

// 🌟 1. 扩充 Context 类型，加入 MusicPage 需要的所有属性
type PlayMode = 'loop' | 'single' | 'random';
type MusicStatus = 'loading' | 'ready' | 'empty' | 'error';

interface MusicContextType {
  playlist: MusicSong[];
  currentIndex: number;
  currentSong: MusicSong | undefined; // 扩展了 lyrics 属性
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  musicStatus: MusicStatus;
  musicError: string;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: ChangeEvent<HTMLInputElement>) => void;
  seekToPercent: (newProgress: number) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
  retryMusic: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接高可用神经云端...");
  const [isLoading, setIsLoading] = useState(true);
  const [musicStatus, setMusicStatus] = useState<MusicStatus>('loading');
  const [musicError, setMusicError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = playlist[currentIndex];

  useEffect(() => {
    let isMounted = true;
    const fetchMusicData = async () => {
      if (!siteConfig.cloudMusicIds?.length) {
        setPlaylist([]);
        setIsPlaying(false);
        setMusicStatus('empty');
        setMusicError('还没有配置播放列表');
        setCurrentLyric("还没有配置播放列表");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setMusicStatus('loading');
      setMusicError('');
      setCurrentLyric("正在连接高可用神经云端...");

      try {
        const res = await fetch(`/api/music?ids=${siteConfig.cloudMusicIds.join(',')}`);
        if (!res.ok) {
          throw new Error(`音乐接口返回 ${res.status}`);
        }

        const rawResults = await res.json();
        const songResults = Array.isArray(rawResults) ? (rawResults as ApiSong[]) : [];

        const mergedPlaylist = songResults
          .filter((song): song is ApiSong & { url: string } => Boolean(song && song.url && !song.error))
          .map((song): MusicSong => ({
            id: song.id || Math.random().toString(),
            title: song.name || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            cover: song.cover || song.pic || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
            src: song.url,
            lrcUrl: null,
            lyrics: song.lrc ? parseLrc(song.lrc) : []
          }));

        if (isMounted) {
          setPlaylist(mergedPlaylist);
          setCurrentIndex(0);
          if (mergedPlaylist.length > 0) {
            setMusicStatus('ready');
          } else {
            setIsPlaying(false);
            setMusicStatus('empty');
            setMusicError('没有拿到可播放的音轨');
            setCurrentLyric("云端链路受阻");
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setPlaylist([]);
          setIsPlaying(false);
          setMusicStatus('error');
          setMusicError(error instanceof Error ? error.message : '音乐初始化失败');
          setCurrentLyric("网络初始化失败");
          setIsLoading(false);
        }
      }
    };

    fetchMusicData();

    return () => { isMounted = false; };
  }, [retryKey]);

  useEffect(() => {
    if (!currentSong) return;
    let isMounted = true;

    const syncLyrics = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLyrics([]);
      setCurrentLyric("♪ 正在缓冲 ♪");

      if (Array.isArray(currentSong.lyrics) && currentSong.lyrics.length > 0) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(currentSong.lyrics[0]?.text || "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      } else if (currentSong.lrcUrl) {
        fetch(currentSong.lrcUrl)
          .then(res => res.text())
          .then(text => {
            if (isMounted) {
              const parsed = parseLrc(text);
              setLyrics(parsed);
              setPlaylist(prev => {
                const newPlaylist = [...prev];
                newPlaylist[currentIndex].lyrics = parsed;
                return newPlaylist;
              });
            }
          })
          .catch(() => { if (isMounted) setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a"); });
      } else {
        setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      }
    };

    void syncLyrics();

    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
    return () => { isMounted = false; };
  }, [currentIndex, currentSong, isPlaying]);

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current && currentSong) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    }
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (playlist.length === 0) return;
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (playlist.length === 0) return;
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentIndex(index);
    if (!isPlaying) setIsPlaying(true); // 保证切歌后自动播放
  };

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

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play();
    } else {
       nextSong();
    }
  };

  const seekToPercent = (newProgress: number) => {
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    seekToPercent(Number(e.target.value));
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  const retryMusic = () => setRetryKey((key) => key + 1);

  return (
    <MusicContext.Provider value={{
        playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        musicStatus, musicError,
        volume, isMuted, playMode, // 暴露新状态
        togglePlay, nextSong, prevSong, handleSeek, seekToPercent,
        playSong, setVolume, toggleMute, togglePlayMode, retryMusic // 暴露新方法
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} // 使用我们重写的结束处理
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic 必须在 MusicProvider 内部使用");
  return context;
};
