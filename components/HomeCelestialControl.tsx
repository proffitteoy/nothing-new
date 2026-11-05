"use client"

import { useId } from "react"
import { useTheme } from "./ThemeProvider"
import styles from "./HomeCelestialControl.module.css"

// Audited background: 1672 × 941, diffuse light, no drawn solar disc.
// (1390, 145) is a proposed art anchor in the unoccupied upper-right light.
export default function HomeCelestialControl() {
  const { isDark, toggleTheme } = useTheme()
  const id = useId()
  return (
    <button
      type="button"
      className={styles.control}
      onClick={toggleTheme}
      data-home-celestial
      data-dark={isDark}
      aria-pressed={isDark}
      aria-label={isDark ? "当前夜间，切换到日间" : "当前日间，切换到夜间"}
      title={isDark ? "切换到日间" : "切换到夜间"}
    >
      <svg viewBox="0 0 128 128" fill="none" aria-hidden="true" data-celestial-art>
        <defs>
          <radialGradient id={`${id}-warm`} cx=".42" cy=".36" r=".66">
            <stop stopColor="#FFFCEB" />
            <stop offset=".55" stopColor="#F7E5B8" />
            <stop offset=".88" stopColor="#DFB88A" />
            <stop offset="1" stopColor="#AE8773" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset=".35" stopColor="#F4D39F" stopOpacity=".34" />
            <stop offset=".7" stopColor="#E8C29A" stopOpacity=".12" />
            <stop offset="1" stopColor="#E8C29A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-lunar`} cx=".32" cy=".28" r=".85">
            <stop stopColor="#F1EFF4" />
            <stop offset=".58" stopColor="#D4CDDF" />
            <stop offset="1" stopColor="#8D86AA" />
          </radialGradient>
          <radialGradient id={`${id}-night-halo`}>
            <stop offset=".3" stopColor="#777090" stopOpacity=".25" />
            <stop offset="1" stopColor="#777090" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".16" numOctaves="3" seed="8" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope=".13" />
            </feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <mask id={`${id}-phase`}>
            <circle cx="64" cy="64" r="34" fill="white" />
            <circle cx="81" cy="51" r="34" fill="black" />
          </mask>
        </defs>
        <g className={styles.sun}>
          <path
            d="M66 3c23 5 48 12 53 39 5 25-4 55-25 70-23 14-56 12-74-7C2 86 2 54 15 31 26 12 45 1 66 3Z"
            fill={`url(#${id}-halo)`}
          />
          <g className={styles.corona} stroke="#D9B58D" strokeWidth=".65" strokeLinecap="round">
            <path
              d="M30 42c-8 10-10 26-5 40m70-54c14 11 17 26 15 37M37 105c15 8 34 9 47 2"
              opacity=".48"
            />
            <path d="m49 17 1 7m45 69 5 5M15 64l8 1m53-50-2 6m32 60 6 2" opacity=".46" />
          </g>
          <circle cx="64" cy="64" r="34" fill={`url(#${id}-warm)`} />
          <path
            d="M41 46c5-9 16-13 26-12m20 43c-3 10-9 15-19 17"
            stroke="#FFF8E0"
            strokeWidth="1.2"
            opacity=".55"
            strokeLinecap="round"
          />
          <path
            d="M40 68c7-8 12-4 19-8 10-5 15-2 24 1 4 1 7-1 10-4-1 15-10 29-23 32-15 3-26-4-30-21Z"
            fill="#DBBD9D"
            opacity=".18"
          />
          <circle cx="64" cy="64" r="33" fill="#766157" filter={`url(#${id}-grain)`} />
          <circle cx="64" cy="64" r="33.5" stroke="#B18A72" strokeOpacity=".3" />
        </g>
        <g className={styles.moon}>
          <circle cx="64" cy="64" r="61" fill={`url(#${id}-night-halo)`} />
          <g mask={`url(#${id}-phase)`}>
            <circle cx="64" cy="64" r="34" fill={`url(#${id}-lunar)`} />
            <g fill="#8D85A2" opacity=".3">
              <path d="M41 65c-7 3-5 13 1 14 8 1 12-10 5-14-2-1-4-1-6 0Z" />
              <circle cx="55" cy="88" r="5.5" />
              <circle cx="62" cy="77" r="2.5" />
              <path d="M35 49c4-6 13-5 14 1 1 7-8 11-12 7-2-2-3-5-2-8Z" />
            </g>
            <path d="M40 44a31 31 0 0 0 27 51" stroke="#F5F0F6" strokeWidth="1" opacity=".7" />
            <circle cx="64" cy="64" r="33" fill="#766157" filter={`url(#${id}-grain)`} />
          </g>
          <path
            d="M89 25c13 8 22 22 23 36M25 93c8 11 21 17 35 18"
            stroke="#A89BB8"
            strokeOpacity=".45"
            strokeWidth=".65"
          />
          <g fill="#C8BDD4">
            <circle cx="99" cy="38" r="1.2" />
            <circle cx="103" cy="86" r=".8" />
            <circle cx="36" cy="26" r=".8" />
          </g>
        </g>
      </svg>
    </button>
  )
}
