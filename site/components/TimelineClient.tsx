"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import TimelineNode from './TimelineNode';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, LayoutGrid, ListTree, Calendar, Hash, ArrowUp } from 'lucide-react';
import Link from 'next/link';

export default function TimelineClient({ posts: initialPosts, tags }: { posts: any[], tags: { name: string, count: number }[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 🌟 默认视图模式 ('timeline' | 'card')
  const [viewMode, setViewMode] = useState<'timeline' | 'card'>('timeline');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // 🌟 核心魔法 1：强制移动端为矩阵模式
  useEffect(() => {
    const enforceMobileView = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
      }
    };

    // 初始化检测
    enforceMobileView();
    // 监听窗口大小变化
    window.addEventListener('resize', enforceMobileView);
    return () => window.removeEventListener('resize', enforceMobileView);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.title.toLowerCase().includes(query) ||
      (post.description && post.description.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  const timelinePosts = useMemo(() => {
    return posts.filter(post => {
      return selectedTag === 'All' || post.tags?.includes(selectedTag);
    });
  }, [posts, selectedTag]);

  const handleGridScroll = () => {
    if (gridScrollRef.current) {
      setShowScrollTop(gridScrollRef.current.scrollTop > 200);
    }
  };

  const scrollToTop = () => {
    if (gridScrollRef.current) {
      try {
        gridScrollRef.current.scroll({ top: 0, left: 0, behavior: 'smooth' });
      } catch (error) {
        gridScrollRef.current.scrollTo(0, 0);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-28 px-4 sm:px-10 relative z-10">

      <div className="text-center mb-12 relative z-20">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">归档与探索</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2 italic">
          <Sparkles size={16} className="text-indigo-500" /> 总计 {posts.length} 篇研究记录
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 mb-16 relative z-[99]">

        <div className="relative w-full max-w-lg group" ref={searchContainerRef}>
          <input
            type="text"
            placeholder="搜寻被封存的知识..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl px-6 py-4 pl-14 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium relative z-20"
          />
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-20" />

          <AnimatePresence>
            {isDropdownOpen && searchQuery.trim() !== '' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-h-[360px] overflow-y-auto z-[100]"
              >
                {searchResults.length > 0 ? (
                  <div className="flex flex-col py-2">
                    {searchResults.map((post) => (
                      <Link
                        href={`/posts/${post.slug}`}
                        key={post.slug}
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-6 py-4 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 pr-4">
                            {post.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                            {post.date.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {post.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                    赛博空间里找不到这个印记 🌌
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md p-4 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 flex-1">
            <button onClick={() => setSelectedTag('All')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedTag === 'All' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white'}`}>
              全部档案
            </button>
            {tags.map(tag => (
              <button key={tag.name} onClick={() => setSelectedTag(tag.name)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedTag === tag.name ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white'}`}>
                {tag.name} <span className="opacity-50 ml-1">{tag.count}</span>
              </button>
            ))}
          </div>

          {/* 🌟 核心魔法 2：隐藏手机端的视图切换按钮 (hidden md:flex) */}
          <div className="hidden md:flex bg-white/50 dark:bg-slate-900/50 p-1 rounded-2xl shadow-inner shrink-0">
            <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <ListTree size={16} />
              <span>中枢链路</span>
            </button>
            <button onClick={() => setViewMode('card')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <LayoutGrid size={16} />
              <span>矩阵网格</span>
            </button>
          </div>
        </div>

      </div>

      <AnimatePresence mode="wait">

        {/* ================= 模式 1：网格卡片流 (手机端强制此模式) ================= */}
        {viewMode === 'card' && (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full"
          >
            <style dangerouslySetInnerHTML={{ __html: `
              .cyber-scrollbar::-webkit-scrollbar { width: 8px; md:width: 12px; }
              .cyber-scrollbar::-webkit-scrollbar-track { background: rgba(99, 102, 241, 0.05); border-radius: 12px; margin-top: 20px; margin-bottom: 56px; }
              .cyber-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #818cf8 0%, #c084fc 100%); border-radius: 12px; border: 2px solid transparent; background-clip: padding-box; }
              .fade-edges { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); }
            `}} />

            <div
              ref={gridScrollRef}
              onScroll={handleGridScroll}
              className="h-[75vh] overflow-y-auto cyber-scrollbar pr-2 sm:pr-5 pb-10 fade-edges"
            >
              {/* 🌟 核心魔法 3：强制手机端 grid-cols-2 双列显示，减小 gap */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 pt-4 pb-10">
                {timelinePosts.map((post, idx) => (
                  <motion.div key={post.slug} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: idx * 0.05 }}>
                    <div className="bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg flex flex-col h-full group relative hover:-translate-y-1 transition-transform duration-300">

                      <Link href={`/posts/${post.slug}`} className="block flex-1 flex flex-col cursor-pointer">
                        {/* 🌟 图片高度自适应：手机变矮，电脑变高 */}
                        <div className="relative h-28 sm:h-36 md:h-40 overflow-hidden">
                          <img src={post.cover} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          {/* 🌟 日期标签微缩 */}
                          <span className="absolute bottom-2 left-2 md:bottom-3 md:left-4 text-white/90 text-[9px] md:text-xs font-mono font-bold bg-black/40 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded flex items-center gap-1">
                            <Calendar size={10} className="md:w-3 md:h-3"/> {post.date.split(' ')[0]}
                          </span>
                        </div>

                        {/* 🌟 文本边距和字号全方位缩放 */}
                        <div className="p-3 md:p-5 flex-1 flex flex-col">
                          <h3 className="text-xs sm:text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 md:mb-2 line-clamp-2 transition-colors group-hover:text-indigo-500">{post.title}</h3>
                          <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-2 md:mb-4 line-clamp-2 flex-1 leading-snug">{post.description || "暂时没有描述喵..."}</p>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-auto">
                            {post.tags.map((tag: string) => (
                              <span key={tag} className="text-[8px] md:text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </Link>

                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 火箭按钮 */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                  onClick={scrollToTop}
                  className="absolute bottom-4 -right-3 w-9 h-9 flex items-center justify-center bg-gradient-to-t from-purple-500 to-indigo-500 text-white rounded-full shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-1 transition-all z-50 group pointer-events-auto"
                  title="回到顶部"
                >
                  <ArrowUp size={18} className="group-hover:-translate-y-1 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* ================= 模式 2：传统时间线 (前台纯净版) ================= */}
        {viewMode === 'timeline' && (
          <motion.div
            key="timeline-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden p-2 md:p-10 min-h-[500px]"
          >
            <div className="absolute border-opacity-20 border-indigo-500 dark:border-indigo-400/20 h-full border-2 left-1/2 transform -translate-x-1/2 rounded-full transition-colors duration-1000"></div>

            <div className="relative z-10 flex flex-col gap-16">
              <AnimatePresence mode='popLayout'>
                {timelinePosts.map((post, index) => (
                  <TimelineNode
                    key={post.slug}
                    post={post}
                    index={index + 1}
                  />
                ))}
              </AnimatePresence>

              {timelinePosts.length === 0 && (
                 <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">
                    这个频段没有接收到任何信号 📡
                 </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}