"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';

type Chatter = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  content: string;
};

export default function ChatterBoard({ chatters }: { chatters: Chatter[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    chatters.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return ["全部", ...Array.from(tags)];
  }, [chatters]);

  const filteredChatters = useMemo(() => {
    if (searchQuery.length > 0 && searchQuery.trim() === "") return [];
    const query = searchQuery.trim().toLowerCase();

    return chatters.filter(chatter => {
      const matchSearch = chatter.title.toLowerCase().includes(query) ||
                          chatter.content.toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || chatter.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [chatters, searchQuery, activeTag]);

  return (
    // 🌟 核心修改：缩紧整体容器的左右边距 px-3 md:px-10
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-10 py-6 md:py-10 pt-24 md:pt-28 relative z-10">

      <div className="mb-8 md:mb-14 text-center">
        {/* 🌟 核心修改：标题字号响应式 */}
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tighter">
          {siteConfig.chatterTitle || "源石研究笔记"}
        </h1>
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium italic opacity-80">
          “ {siteConfig.chatterDescription || "日常碎片与灵感记录"} ”
        </p>
      </div>

      <div className="mb-8 md:mb-12 flex flex-col items-center gap-5 md:gap-8">
        <div className="relative w-full max-w-lg group px-2 md:px-0">
          {/* 🌟 核心修改：搜索框在手机端更扁凑 */}
          <input
            type="text"
            placeholder="搜寻被遗忘的思绪..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <svg className="w-4 h-4 md:w-6 md:h-6 absolute left-5 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 px-2 md:px-0">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-500 border ${
                activeTag === tag 
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-md md:shadow-lg md:shadow-indigo-500/30 scale-105' 
                : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {tag === "全部" ? tag : `# ${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 核心修改 1：瀑布流直接设定为 columns-2，减小间距 gap-3 */}
      <motion.div layout className="columns-2 lg:columns-3 gap-3 md:gap-6 space-y-3 md:space-y-6">
        <AnimatePresence mode='popLayout'>
          {filteredChatters.map((chatter) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={chatter.slug}
              className="break-inside-avoid"
            >
              {/* 🌟 核心修改 2：卡片圆角缩小 rounded-2xl */}
              <Link
                href={`/chatter/${chatter.slug}`}
                className="block rounded-2xl md:rounded-[32px] bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-md md:shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
              >
                {chatter.cover && (
                  // 🌟 核心修改 3：图片高度自适应 h-28 -> h-52
                  <div className="w-full h-28 md:h-52 overflow-hidden relative">
                    <img src={chatter.cover} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                    {/* 🌟 核心修改 4：心情徽章微缩 */}
                    {chatter.mood && (
                      <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/20 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm border border-white/20 uppercase tracking-widest">
                        ✨ {chatter.mood}
                      </span>
                    )}
                  </div>
                )}

                {/* 🌟 核心修改 5：内部 padding 极致压缩 p-3 md:p-7 */}
                <div className="p-3 md:p-7">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="text-[8px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider md:tracking-[0.2em] bg-indigo-500/5 dark:bg-indigo-400/10 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg border border-indigo-500/10">
                      {chatter.date}
                    </div>
                    {/* 心情展示 - 无封面版 */}
                    {!chatter.cover && chatter.mood && (
                      <div className="text-[8px] md:text-[10px] font-black text-pink-600 dark:text-pink-400 bg-pink-500/5 dark:bg-pink-400/10 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg border border-pink-500/10">
                        {chatter.mood}
                      </div>
                    )}
                  </div>

                  {chatter.title && (
                    // 🌟 核心修改 6：标题压缩 text-sm md:text-xl
                    <h3 className="text-sm md:text-xl font-bold text-slate-800 dark:text-white mb-1.5 md:mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 md:line-clamp-none">{chatter.title}</h3>
                  )}

                  {/* 🌟 核心修改 7：正文压缩，限制行数 */}
                  <div className="text-[10px] md:text-sm text-slate-600 dark:text-slate-300 leading-snug md:leading-relaxed line-clamp-4 md:line-clamp-5 opacity-90 font-medium italic">
                    {chatter.content}
                  </div>

                  {/* 🌟 核心修改 8：底部标签微缩 */}
                  {chatter.tags && chatter.tags.length > 0 && (
                    <div className="mt-3 md:mt-6 flex flex-wrap gap-1 md:gap-2">
                      {chatter.tags.map(t => (
                        <span key={t} className="text-[8px] md:text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-500/5 dark:bg-white/5 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md border border-slate-500/10 dark:border-white/5 transition-all group-hover:bg-indigo-500/10 group-hover:text-indigo-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}