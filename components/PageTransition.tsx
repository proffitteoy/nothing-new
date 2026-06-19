"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      // 刚加载页面时：往下偏 20px，完全透明
      initial={{ y: 20, opacity: 0 }}
      // 加载完毕后：回到原位，完全不透明
      animate={{ y: 0, opacity: 1 }}
      // 动画怎么演：用优雅的弹性物理动画，持续 0.8 秒
      transition={{ ease: "easeOut", duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}