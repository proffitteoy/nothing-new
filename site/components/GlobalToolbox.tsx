"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 【引入你的独立工具模块】
import CalculatorTool from './toolbox/CalculatorTool';
// import TomatoClock from './toolbox/TomatoClock'; // 未来扩展预留

// 【核心架构：插件注册表】
// 以后加新工具，只需要往这个数组里添加对象即可，完全解耦！
const TOOL_REGISTRY = [
  { id: 'calc', name: '计算器', icon: '🧮', component: <CalculatorTool /> },
  // { id: 'tomato', name: '番茄钟', icon: '🍅', component: <TomatoClock /> },
];

export default function GlobalToolbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // 获取当前激活的工具对象
  const activeTool = TOOL_REGISTRY.find(t => t.id === activeToolId);

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-3">

      {/* 展开的面板区域 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom left" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className="mb-2 bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-4 w-64 flex flex-col gap-4 overflow-hidden"
          >
            {/* 动态渲染：工具箱导航栏 */}
            <div className="flex flex-wrap gap-2 border-b border-slate-300/50 dark:border-slate-700/50 pb-3">
              {TOOL_REGISTRY.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveToolId(activeToolId === tool.id ? null : tool.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${activeToolId === tool.id ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  {tool.icon} {tool.name}
                </button>
              ))}
            </div>

            {/* 动态渲染：激活的工具组件 */}
            <AnimatePresence mode="wait">
              {activeTool ? (
                // 直接渲染注册表里绑定的独立组件
                <div key={activeTool.id}>
                  {activeTool.component}
                </div>
              ) : (
                // 空状态提醒
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs font-serif text-center px-4"
                >
                  <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1z" /></svg>
                  点击上方模块<br/>激活工具
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮主开关按钮 */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen && !activeToolId) setActiveToolId(TOOL_REGISTRY[0].id); }}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all duration-500 hover:scale-110 active:scale-95 z-50
          ${isOpen ? 'bg-indigo-500 text-white rotate-45' : 'bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-white'}
        `}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M12 4v16m8-8H4" : "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"} />
        </svg>
      </button>

    </div>
  );
}