"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { siteConfig } from '../siteConfig';

const SPLASH_DURATION_MS = 2200;
const REVEAL_DELAY_MS = 500;

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  const exitSplash = useCallback(() => {
    setShow(false);

    try {
      sessionStorage.setItem('hasSeenSplash', 'true');
    } catch {
      // Ignore storage failures in restricted browser modes.
    }

    window.setTimeout(() => {
      document.documentElement.classList.add('splash-seen');
    }, REVEAL_DELAY_MS);
  }, []);

  useEffect(() => {
    let hasSeenSplash = false;

    try {
      hasSeenSplash = sessionStorage.getItem('hasSeenSplash') === 'true';
    } catch {
      hasSeenSplash = true;
    }

    if (hasSeenSplash) {
      document.documentElement.classList.add('splash-seen');
      return;
    }

    const showTimer = window.setTimeout(() => {
      setShow(true);
    }, 0);
    const exitTimer = window.setTimeout(exitSplash, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(exitTimer);
    };
  }, [exitSplash]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash-screen-container"
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
        >
          <div className="relative z-10 flex flex-col items-center">
            {/* 头像光环 */}
            <div className="relative w-24 h-24 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]"
              />
              <div className="relative w-full h-full rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl">
                <Image
                  src={siteConfig.avatarUrl}
                  alt="头像"
                  width={96}
                  height={96}
                  priority
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-[0.2em] uppercase">
              {siteConfig.authorName}
            </h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] mb-12">正在初始化站点</p>

            <div className="w-40 h-[1.5px] bg-slate-200 dark:bg-slate-800 relative">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
