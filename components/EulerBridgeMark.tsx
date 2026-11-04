"use client"

import { useEffect, useRef } from "react"
import styles from "./EulerBridgeMark.module.css"

// Ported from gduf-community/ai-data-competitions-ui:
// src/components/shared/euler-bridge-loader.tsx.
// The original animation credits Paidax01/math-curve-loaders (main.js,
// 70f4e00a6d452532039ff7c2ccb4c379ec90c772).
// Four node-aligned particle streams traverse one continuous closed curve.
const curves = [
  {
    name: "bridge",
    color: "var(--euler-bridge-ink)",
    path: "M 49.606 8.503 C 95.494 8.503 85.527 39.345 49.600 54.600 C 13.673 69.855 15.100 91.000 49.609 91.000",
  },
  {
    name: "lower-arc",
    color: "var(--euler-bridge-ink)",
    path: "M 49.609 91.000 C 26.550 91.000 7.856 72.412 7.856 49.482",
  },
  {
    name: "bronze",
    color: "var(--euler-bridge-bronze)",
    path: "M 7.856 49.482 C 14.000 74.000 39.000 85.000 53.000 76.000 C 67.000 67.000 44.000 47.000 59.000 32.000 C 74.000 17.000 92.066 22.000 92.066 49.483",
  },
  {
    name: "upper-arc",
    color: "var(--euler-bridge-bronze)",
    path: "M 92.066 49.483 C 92.066 26.850 73.056 8.503 49.606 8.503",
  },
] as const

const nodes = [
  { x: 49.606, y: 8.503, color: "var(--euler-bridge-bronze)" },
  { x: 92.066, y: 49.483, color: "var(--euler-bridge-bronze)" },
  { x: 49.609, y: 91, color: "var(--euler-bridge-ink)" },
  { x: 7.856, y: 49.482, color: "var(--euler-bridge-ink)" },
]

const durationMs = 4600
const rotationDurationMs = 20000
const trailSpan = 0.16

export default function EulerBridgeMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  // Navigation icons are 26–32px; keep the upstream compact particle budget.
  const compact = size <= 32
  const particleCount = compact ? 8 : 32
  const svgRef = useRef<SVGSVGElement>(null)
  const rotorRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const rotor = rotorRef.current
    if (!svg || !rotor) return

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let totalLength = 0
    const sections = Array.from(
      svg.querySelectorAll<SVGGElement>("[data-curve]"),
      (group, index) => {
        const path = group.querySelector<SVGPathElement>("path")!
        const sectionLength = path.getTotalLength()
        const offset = totalLength
        totalLength += sectionLength
        const samples = Array.from({ length: 257 }, (_, i) =>
          path.getPointAtLength((sectionLength * i) / 256),
        )
        const color = curves[index].color
        const particles = Array.from(group.querySelectorAll("circle"), (node, particleIndex) => {
          const tail = particleIndex / (particleCount - 1)
          const fade = Math.pow(1 - tail, 0.56)
          node.setAttribute("cx", samples[0].x.toFixed(3))
          node.setAttribute("cy", samples[0].y.toFixed(3))
          node.setAttribute("r", (0.35 + fade * (compact ? 2.4 : 1.2)).toFixed(3))
          node.setAttribute("opacity", (0.04 + fade * 0.96).toFixed(3))
          node.setAttribute("fill", color)
          return { node, tailOffset: tail * trailSpan, color }
        })
        return { group, samples, length: sectionLength, offset, particles }
      },
    )

    let frame = 0
    let previousTime: number | undefined
    let elapsed = 0
    let visible = false

    function render(now: number) {
      if (previousTime !== undefined) elapsed += now - previousTime
      previousTime = now
      rotor!.setAttribute(
        "transform",
        `rotate(${((elapsed % rotationDurationMs) / rotationDurationMs) * 360} 50 50)`,
      )
      for (const trail of sections) {
        const progress = elapsed / durationMs + trail.offset / totalLength
        trail.particles.forEach((particle) => {
          const position = (((progress - particle.tailOffset) % 1) + 1) % 1
          const distance = position * totalLength
          const section =
            sections.find((item) => distance < item.offset + item.length) ??
            sections[sections.length - 1]
          const sample = Math.max(
            0,
            Math.min(256, ((distance - section.offset) / section.length) * 256),
          )
          const start = Math.min(255, Math.floor(sample))
          const weight = sample - start
          const a = section.samples[start]
          const b = section.samples[start + 1]
          particle.node.setAttribute("cx", (a.x + (b.x - a.x) * weight).toFixed(3))
          particle.node.setAttribute("cy", (a.y + (b.y - a.y) * weight).toFixed(3))
          const color = curves[sections.indexOf(section)].color
          if (particle.color !== color) {
            particle.node.setAttribute("fill", color)
            particle.color = color
          }
        })
      }
      frame = requestAnimationFrame(render)
    }

    function syncAnimation() {
      cancelAnimationFrame(frame)
      previousTime = undefined
      const paused = motion.matches || document.hidden || !visible
      if (motion.matches) {
        elapsed = 0
        rotor!.setAttribute("transform", "rotate(0 50 50)")
      }
      for (const { group } of sections) {
        group.querySelector("[data-particles]")!.setAttribute(
          "visibility",
          paused ? "hidden" : "visible",
        )
      }
      if (!paused) frame = requestAnimationFrame(render)
    }

    // Hidden mobile/desktop navigation instances should consume no animation frames.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            syncAnimation()
          })
    if (observer) observer.observe(svg)
    else visible = true

    motion.addEventListener("change", syncAnimation)
    document.addEventListener("visibilitychange", syncAnimation)
    syncAnimation()
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      motion.removeEventListener("change", syncAnimation)
      document.removeEventListener("visibilitychange", syncAnimation)
    }
  }, [compact, particleCount])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${styles.mark} ${className ?? ""}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <g ref={rotorRef} data-rotor="" transform="rotate(0 50 50)">
        {curves.map((curve) => (
          <g key={curve.name} data-curve={curve.name} fill={curve.color}>
            <path
              d={curve.path}
              fill="none"
              stroke={curve.color}
              strokeWidth={compact ? 3.2 : 2.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={compact ? 0.5 : 0.35}
            />
            <g data-particles="">
              {Array.from({ length: particleCount }, (_, i) => (
                <circle key={i} cx={0} cy={0} r={0} opacity={0} />
              ))}
            </g>
          </g>
        ))}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r={compact ? 4 : 3.1}
            fill={node.color}
          />
        ))}
      </g>
    </svg>
  )
}
