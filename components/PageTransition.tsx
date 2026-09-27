"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ReactNode } from "react"

export default function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { y: 6, opacity: 0.85 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeOut", duration: reduced ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  )
}
