"use client";

import { usePathname } from 'next/navigation';
import { useMusic } from './MusicProvider';
import { motion } from 'framer-motion';
import { getSizedMusicCoverUrl, isNeteaseMusicCoverUrl } from '../lib/image-loading';

export default function FloatingPlayer() {
  const pathname = usePathname();
  const { currentSong, isPlaying, togglePlay, nextSong, currentLyric, isLoading } = useMusic();

  if (pathname === '/' || pathname === '/music') return null;

  if (isLoading || !currentSong) return null;

  const currentCover = getSizedMusicCoverUrl(currentSong.cover || currentSong.pic || '', 256);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" style={{ pointerEvents: 'none' }}>
      <motion.div
        drag
        dragMomentum={false} // 取消惯性
        style={{ touchAction: 'none' }}
        animate={{
          opacity: 1,
          scale: 1,
          pointerEvents: 'auto',
        }}
        initial={false}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl p-2 pr-4 rounded-full transition-colors duration-700 cursor-grab active:cursor-grabbing"
      >

        {/* 旋转的光碟封面 */}
        <div
          className="w-10 h-10 rounded-full border border-white/50 shadow-sm flex-shrink-0 overflow-hidden relative animate-[spin_6s_linear_infinite] pointer-events-none"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          <img
            src={currentCover}
            alt="专辑封面"
            width={40}
            height={40}
            decoding="async"
            crossOrigin={isNeteaseMusicCoverUrl(currentCover) ? 'anonymous' : undefined}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-inner"></div>
        </div>

        {/* 歌曲信息与滚动歌词 */}
        <div className="flex flex-col w-32 max-w-[120px] overflow-hidden pointer-events-none">
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors duration-700">{currentSong.title}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate transition-colors duration-700">{currentLyric}</span>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-2 ml-1">
          <button
            type="button"
            aria-label={isPlaying ? "暂停浮动播放器" : "播放浮动播放器"}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
          >
            {isPlaying ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button
            type="button"
            aria-label="浮动播放器下一首"
            onClick={(e) => { e.stopPropagation(); nextSong(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
