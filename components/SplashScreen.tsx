"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gem, Layers3, Mountain, Sparkles } from "lucide-react";

const stats = [
  { label: "CORE", value: "Basalt" },
  { label: "VEIN", value: "Quartz" },
  { label: "RISE", value: "7.6s" },
];

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setShow(false);
    }, 3900);

    return () => window.clearTimeout(exitTimer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          key="lithos-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(18px)" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[100000] isolate flex min-h-screen overflow-hidden bg-[#070604] text-stone-100"
          aria-label="Lithos loading hero"
        >
          <GeologyPlate />

          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(7,6,4,0.94)_0%,rgba(7,6,4,0.58)_38%,rgba(7,6,4,0.28)_58%,rgba(7,6,4,0.82)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-[2] opacity-40 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:56px_56px]" />

          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-[3] h-[72%] bg-[linear-gradient(0deg,rgba(233,166,74,0.2)_0%,rgba(184,149,255,0.14)_42%,transparent_100%)]"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            transition={{ duration: 2.55, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-10 lg:px-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="order-2 max-w-xl md:order-1"
            >
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-stone-950/55 px-4 py-2 text-xs font-black text-amber-100 shadow-2xl shadow-black/25 backdrop-blur-xl">
                <Mountain size={15} aria-hidden="true" />
                Lithos geological atelier
              </div>

              <h1 className="text-5xl font-black leading-none text-stone-50 sm:text-6xl lg:text-7xl">
                LITHOS
              </h1>
              <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-stone-300 sm:text-base">
                A dark mineral field forms first. Then the phoenix rises through the strata,
                opening its wings above the core sample.
              </p>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 backdrop-blur-xl"
                  >
                    <p className="text-[10px] font-black text-stone-500">{item.label}</p>
                    <p className="mt-1 text-sm font-black text-stone-100">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex items-center gap-4">
                <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-violet-300"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.35, ease: "easeInOut" }}
                  />
                </div>
                <span className="text-xs font-black text-stone-400">INITIALIZING</span>
              </div>
            </motion.div>

            <div className="order-1 flex min-h-[460px] items-center justify-center md:order-2 md:min-h-[680px]">
              <PhoenixStage />
            </div>
          </div>

          <style jsx global>{`
            .lithos-wing-left {
              transform-origin: 51% 58%;
              animation: lithosLeftWing 3.15s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .lithos-wing-right {
              transform-origin: 49% 58%;
              animation: lithosRightWing 3.15s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .lithos-feather {
              animation: lithosFeatherGlow 2.4s ease-in-out infinite alternate;
            }
            .lithos-ash {
              animation: lithosAshRise 3.4s ease-out infinite;
            }
            @keyframes lithosLeftWing {
              0% {
                transform: translateY(72px) rotate(18deg) scaleX(0.42) scaleY(0.72);
                opacity: 0;
              }
              38% {
                opacity: 0.85;
              }
              100% {
                transform: translateY(0) rotate(0deg) scaleX(1) scaleY(1);
                opacity: 1;
              }
            }
            @keyframes lithosRightWing {
              0% {
                transform: translateY(72px) rotate(-18deg) scaleX(0.42) scaleY(0.72);
                opacity: 0;
              }
              38% {
                opacity: 0.85;
              }
              100% {
                transform: translateY(0) rotate(0deg) scaleX(1) scaleY(1);
                opacity: 1;
              }
            }
            @keyframes lithosFeatherGlow {
              from {
                opacity: 0.44;
              }
              to {
                opacity: 0.95;
              }
            }
            @keyframes lithosAshRise {
              0% {
                transform: translate3d(0, 36px, 0) scale(0.6);
                opacity: 0;
              }
              28% {
                opacity: 0.9;
              }
              100% {
                transform: translate3d(var(--ash-x), -190px, 0) scale(1.1);
                opacity: 0;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .lithos-wing-left,
              .lithos-wing-right,
              .lithos-feather,
              .lithos-ash {
                animation: none !important;
              }
            }
          `}</style>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function PhoenixStage() {
  return (
    <div className="relative aspect-[1.08/1] w-full max-w-[720px]">
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[50%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/20 bg-amber-100/10 blur-[1px]"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.08, 0.9], opacity: [0, 0.85, 0.48] }}
        transition={{ duration: 2.8, ease: "easeOut" }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[52%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,244,204,0.48)_0%,rgba(233,166,74,0.18)_32%,rgba(184,149,255,0.09)_56%,transparent_72%)]"
        initial={{ scale: 0.35, opacity: 0 }}
        animate={{ scale: [0.35, 1.2, 1.02], opacity: [0, 0.95, 0.62] }}
        transition={{ duration: 3, ease: "easeOut" }}
      />

      <motion.div
        className="absolute inset-x-0 bottom-[3%] mx-auto h-[88%] w-full"
        initial={{ y: 190, opacity: 0, scale: 0.78 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 2.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 720 660" className="h-full w-full overflow-visible" role="img" aria-label="Rising phoenix">
          <defs>
            <linearGradient id="lithosWing" x1="0%" x2="100%" y1="20%" y2="80%">
              <stop offset="0%" stopColor="#f7d487" stopOpacity="0.96" />
              <stop offset="46%" stopColor="#df693d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8d5bff" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient id="lithosBody" x1="45%" x2="55%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#fff4c7" />
              <stop offset="42%" stopColor="#f0a24b" />
              <stop offset="100%" stopColor="#7c3f23" />
            </linearGradient>
            <filter id="lithosGlow" x="-30%" y="-30%" width="160%" height="170%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0.98 0 1 0 0 0.47 0 0 1 0 0.14 0 0 0 0.82 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#lithosGlow)">
            <path
              className="lithos-wing-left"
              d="M346 337 C260 200 148 148 36 142 C122 184 172 237 198 293 C132 276 83 293 33 331 C126 327 188 360 236 411 C164 421 115 455 75 514 C180 476 270 489 334 558 C319 475 315 403 346 337Z"
              fill="url(#lithosWing)"
              opacity="0.92"
            />
            <path
              className="lithos-wing-right"
              d="M374 337 C460 200 572 148 684 142 C598 184 548 237 522 293 C588 276 637 293 687 331 C594 327 532 360 484 411 C556 421 605 455 645 514 C540 476 450 489 386 558 C401 475 405 403 374 337Z"
              fill="url(#lithosWing)"
              opacity="0.92"
            />
            <path
              className="lithos-feather"
              d="M350 318 C313 214 318 125 361 50 C401 126 407 218 370 318Z"
              fill="#fff0ba"
              opacity="0.86"
            />
            <path
              d="M360 248 C398 286 408 363 382 430 C372 457 374 501 408 585 C375 565 358 528 360 486 C350 528 331 565 302 590 C335 504 340 459 332 432 C307 363 321 286 360 248Z"
              fill="url(#lithosBody)"
            />
            <path
              d="M360 251 C349 282 347 313 360 337 C374 313 373 282 360 251Z"
              fill="#fff8d9"
            />
          </g>
        </svg>
      </motion.div>

      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="lithos-ash absolute bottom-[16%] left-1/2 h-1.5 w-1.5 rounded-full bg-amber-200/80 shadow-[0_0_18px_rgba(251,191,36,0.9)]"
          style={
            {
              "--ash-x": `${(index % 2 === 0 ? -1 : 1) * (42 + index * 9)}px`,
              animationDelay: `${index * 120}ms`,
              left: `${40 + (index % 6) * 4}%`,
            } as CSSProperties
          }
        />
      ))}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-stone-950/55 px-4 py-2 text-xs font-black text-stone-300 backdrop-blur-xl">
        <Sparkles size={14} className="text-amber-200" aria-hidden="true" />
        Phoenix reveal
      </div>
    </div>
  );
}

function GeologyPlate() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rockBase" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#050403" />
            <stop offset="38%" stopColor="#16100c" />
            <stop offset="68%" stopColor="#241812" />
            <stop offset="100%" stopColor="#070604" />
          </linearGradient>
          <linearGradient id="oreVein" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#66d2c2" stopOpacity="0" />
            <stop offset="42%" stopColor="#e9a64a" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#b895ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#rockBase)" />
        <path
          d="M-70 638 C204 570 360 666 572 608 C780 552 918 458 1154 488 C1320 510 1424 454 1510 404 L1510 940 L-70 940Z"
          fill="#110b08"
        />
        <path
          d="M-42 714 C160 646 306 719 492 681 C732 632 905 698 1116 645 C1282 603 1370 620 1502 560"
          fill="none"
          stroke="#6f4a2a"
          strokeOpacity="0.34"
          strokeWidth="22"
        />
        <path
          d="M-32 718 C165 650 308 724 493 686 C731 637 906 704 1116 651 C1282 609 1370 626 1502 566"
          fill="none"
          stroke="url(#oreVein)"
          strokeWidth="3"
        />
        <path
          d="M-20 248 C170 200 275 273 417 240 C607 196 704 105 904 138 C1092 169 1195 88 1464 115"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.08"
          strokeWidth="2"
        />
        <path
          d="M-18 312 C170 268 288 324 458 300 C660 270 783 202 986 230 C1162 254 1283 204 1468 218"
          fill="none"
          stroke="#f2bd73"
          strokeOpacity="0.1"
          strokeWidth="2"
        />
        <path
          d="M-12 380 C165 340 344 386 520 365 C726 340 822 316 1024 344 C1202 369 1304 336 1462 350"
          fill="none"
          stroke="#8f79ff"
          strokeOpacity="0.12"
          strokeWidth="2"
        />
        {Array.from({ length: 34 }).map((_, index) => (
          <circle
            key={index}
            cx={90 + ((index * 131) % 1280)}
            cy={70 + ((index * 83) % 760)}
            r={index % 5 === 0 ? 2.2 : 1.1}
            fill={index % 4 === 0 ? "#e9a64a" : "#d9c7a1"}
            opacity={index % 3 === 0 ? 0.24 : 0.1}
          />
        ))}
      </svg>

      <div className="absolute bottom-8 right-8 hidden items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-black text-stone-400 backdrop-blur-xl md:flex">
        <Layers3 size={16} className="text-amber-200" aria-hidden="true" />
        Stratigraphic render
      </div>
      <div className="absolute right-[14%] top-[14%] hidden items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-black text-stone-400 backdrop-blur-xl md:flex">
        <Gem size={16} className="text-teal-200" aria-hidden="true" />
        Mineral signal
      </div>
    </div>
  );
}
