"use client"
import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 默认日间模式；用户手动切换后仍然尊重本地保存的偏好
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取真实状态
    const savedTheme = localStorage.getItem("blog-theme")
    // 如果没有记录，默认保持日间模式
    const isDarkMode = savedTheme === "dark"
    const timeoutId = window.setTimeout(() => setIsDark(isDarkMode), 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  // 极其重要：监听 isDark 状态，只要它变了，立刻强制更新 html 标签，防止路由切换丢失
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [isDark])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem("blog-theme", newDark ? "dark" : "light")
  }

  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
