"use client";
import { useEffect, useState } from 'react';

type TocItem = {
  level: number;
  text: string;
  id: string;
};

// 🌟 核心增幅：终极 Markdown 净化器！
// 专门用来扒掉诸如 [链接名字](https://...) 的外壳，只留下 "链接名字"
const cleanMarkdownHeading = (rawText: string) => {
  if (!rawText) return '';
  return rawText
    // 1. 提取超链接中的文本内容：[我的标题](https://...) -> 我的标题
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 2. 去除 Markdown 图片：![图片](URL) -> 图片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 3. 兜底防御：去除可能混入的 HTML 标签
    .replace(/<\/?[^>]+(>|$)/g, '')
    // 4. 去除加粗、斜体、删除线、行内代码符号等
    .replace(/[*_~`#]/g, '')
    .trim();
};

// 🌟 底层 ID 净化器
const getSafeId = (rawText: string) => {
  // 先把超链接外壳扒掉，得到纯文本
  const cleanText = cleanMarkdownHeading(rawText);
  // 再杀掉所有标点、空格，只保留汉字、字母和数字生成绝对安全的 ID
  return 'toc-' + cleanText
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
    .toLowerCase();
};

// 🌟 侧边栏视觉净化器
const getDisplayText = (rawText: string) => {
  // 直接调用终极净化器，展示纯洁无瑕的标题名！
  return cleanMarkdownHeading(rawText);
};

export default function ClientTOC({ toc }: { toc: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const contentDiv = document.getElementById('article-content');
    if (!contentDiv) return;

    const headings = Array.from(contentDiv.querySelectorAll('h1, h2, h3'));

    // 🌟 强制统一正文 ID
    headings.forEach((heading) => {
      // heading.textContent 拿到的是渲染后的纯文字（已经没有超链接语法了）
      // 再过一遍 getSafeId，确保正文和侧边栏的 ID 100% 对齐！
      heading.id = getSafeId(heading.textContent || '');
    });

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offset = 150;

      let currentActiveId = "";

      for (const heading of headings) {
        const elementTop = heading.getBoundingClientRect().top + scrollY;
        if (scrollY >= elementTop - offset) {
          currentActiveId = heading.id;
        } else {
          break;
        }
      }

      if (currentActiveId) setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (e: React.MouseEvent, id: string) => {
    // 🌟 防止任何超链接的意外默认行为
    e.preventDefault();

    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    const offset = 100;
    const targetY = targetElement.getBoundingClientRect().top + window.scrollY - offset;
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 600;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;

      const nextY = easeInOutCubic(timeElapsed, startY, distance, duration);
      window.scrollTo(0, nextY);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        window.scrollTo(0, targetY);
      }
    };

    requestAnimationFrame(animation);
    setActiveId(id);
  };

  if (!toc || toc.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl sticky top-28 transition-colors duration-700 max-h-[75vh] overflow-y-auto custom-scrollbar">
      <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm uppercase tracking-widest">
        Table of Contents
      </h3>
      <nav className="flex flex-col gap-2 relative">
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-700/50 rounded-full"></div>

        {toc.map((item, index) => {
          // 视觉上：扒掉超链接，完美展示 "3.万度"
          const displayText = getDisplayText(item.text);

          // 底层跳转：生成纯净版的 ID "toc-3万度"，绝对不会找错目标！
          const safeId = getSafeId(item.text);
          const isActive = activeId === safeId;

          return (
            <button
              key={index}
              onClick={(e) => scrollToHeading(e, safeId)}
              className={`text-left text-sm transition-all duration-300 line-clamp-2 cursor-pointer relative pl-4
                ${item.level === 1 ? 'font-bold mt-2' : ''}
                ${item.level === 2 ? 'ml-2' : ''}
                ${item.level === 3 ? 'ml-4 text-xs' : ''}
                ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105 origin-left' : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400'}
              `}
            >
              {isActive && (
                <span className="absolute left-[-5px] top-[50%] -translate-y-[50%] w-[6px] h-[6px] rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
              )}
              {displayText}
            </button>
          );
        })}
      </nav>
    </div>
  );
}