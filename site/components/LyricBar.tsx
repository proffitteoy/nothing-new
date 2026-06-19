"use client";
import { useEffect, useState } from 'react';
import { useMusic } from './MusicProvider';

export default function LyricBar() {
  const { isPlaying, currentLyric, currentSong } = useMusic();
  const [displayedLyric, setDisplayedLyric] = useState("");

  useEffect(() => {
    setDisplayedLyric("");
    let i = 0;
    const targetText = currentLyric || "";
    if (!targetText) return;

    const typingInterval = setInterval(() => {
      if (i <= targetText.length) {
        setDisplayedLyric(targetText.slice(0, i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentLyric]);

  if (!currentSong) return null;

  // 这里的波浪数据，方便循环渲染，减少代码冗余
  const waves = [
    { color: 'bg-indigo-400', delay: '0ms' },
    { color: 'bg-purple-400', delay: '200ms' },
    { color: 'bg-indigo-500', delay: '400ms' },
    { color: 'bg-purple-500', delay: '100ms' },
    { color: 'bg-indigo-300', delay: '300ms' },
  ];

  return (
    <>
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor {
          animation: cursorBlink 0.8s step-end infinite;
        }
        /* 核心修改：让动画高度从 4px 到 28px */
        @keyframes safeWave {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }
        .safe-wave-active {
          animation: safeWave 1s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full rounded-3xl bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl p-5 flex items-center justify-between transition-all duration-700 hover:shadow-indigo-500/20 group h-20">

        {/* 1. 音频波形动态部分：改用统一渲染逻辑实现过渡 */}
        <div className="flex items-end justify-center gap-[4px] h-8 w-16">
          {waves.map((wave, index) => (
            <div
              key={index}
              className={`w-1.5 rounded-t-sm transition-all duration-500 ease-out ${
                isPlaying 
                  ? `${wave.color} safe-wave-active` 
                  : 'h-1 bg-slate-600 shadow-none'
              }`}
              style={{
                animationDelay: wave.delay,
                // 当暂停时，强制回到 4px 高度
                height: isPlaying ? undefined : '4px'
              }}
            ></div>
          ))}
        </div>

        {/* 2. 歌词显示区 */}
        <div className="flex-1 px-8 flex justify-center items-center overflow-hidden">
          <p className="text-white text-lg font-bold tracking-widest truncate drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
            {displayedLyric}
            <span className="inline-block w-[3px] h-5 bg-indigo-400 align-middle ml-1 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-cursor"></span>
          </p>
        </div>

        {/* 3. 右侧音乐图标 */}
        <div className="w-16 flex justify-end">
          <svg className={`w-6 h-6 text-indigo-400/50 transition-all duration-500 ${isPlaying ? 'animate-bounce' : 'opacity-30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>
    </>
  );
}