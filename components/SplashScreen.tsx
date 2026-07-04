"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const SPLASH_DURATION = 5200;

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setShow(false), SPLASH_DURATION);
    return () => window.clearTimeout(exitTimer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          key="lithos-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(18px)" }}
          transition={{ duration: 0.72, ease: "easeInOut" }}
          className="fixed inset-0 z-[100000] isolate min-h-screen overflow-hidden bg-[#05040b] text-white"
          aria-label="站点加载中"
        >
          <ReferenceBase />
          <PhoenixMotion />

          <motion.div
            aria-hidden="true"
            className="absolute inset-0 z-30 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.96)_0%,rgba(255,235,255,0.52)_13%,rgba(210,176,255,0.38)_30%,rgba(12,8,24,0.0)_58%)]"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.72, 0.08, 0] }}
            transition={{ duration: 2.8, times: [0, 0.28, 0.72, 1], ease: "easeOut" }}
          />

          <div className="absolute left-1/2 top-8 z-40 -translate-x-1/2 text-center">
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: [0, 1, 1, 0.72], y: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="text-[11px] font-black tracking-[0.42em] text-white/80"
            >
              LITHOS
            </motion.p>
          </div>

          <div className="absolute inset-x-0 bottom-8 z-40 mx-auto flex w-[min(82vw,520px)] flex-col items-center gap-4 px-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/25 px-4 py-2 text-[11px] font-black tracking-[0.28em] text-white/75 backdrop-blur-xl"
            >
              <Sparkles size={14} className="text-violet-200" aria-hidden="true" />
              LOADING
            </motion.div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/12">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-300 via-white to-violet-300 shadow-[0_0_24px_rgba(255,255,255,0.85)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.65, ease: [0.76, 0, 0.24, 1] }}
              />
            </div>
          </div>

          <style jsx global>{`
            .loader-wing-left {
              transform-origin: 50% 66%;
              animation: loaderLeftWing 2.45s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .loader-wing-right {
              transform-origin: 50% 66%;
              animation: loaderRightWing 2.45s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .loader-tail {
              animation: loaderTailDrift 1.55s ease-in-out infinite alternate;
            }
            .loader-smoke-a {
              animation: loaderSmokeA 4.4s ease-in-out both;
            }
            .loader-smoke-b {
              animation: loaderSmokeB 4.8s ease-in-out both;
            }
            .loader-spark {
              animation: loaderSpark 3.1s ease-out infinite;
            }
            @keyframes loaderLeftWing {
              0% {
                transform: translateY(118px) rotate(36deg) scaleX(0.18) scaleY(0.52);
                opacity: 0;
              }
              28% {
                opacity: 0.94;
              }
              58% {
                transform: translateY(22px) rotate(8deg) scaleX(0.86) scaleY(0.88);
                opacity: 1;
              }
              100% {
                transform: translateY(-8px) rotate(-2deg) scaleX(1.05) scaleY(1);
                opacity: 0.86;
              }
            }
            @keyframes loaderRightWing {
              0% {
                transform: translateY(118px) rotate(-36deg) scaleX(0.18) scaleY(0.52);
                opacity: 0;
              }
              28% {
                opacity: 0.94;
              }
              58% {
                transform: translateY(22px) rotate(-8deg) scaleX(0.86) scaleY(0.88);
                opacity: 1;
              }
              100% {
                transform: translateY(-8px) rotate(2deg) scaleX(1.05) scaleY(1);
                opacity: 0.86;
              }
            }
            @keyframes loaderTailDrift {
              from {
                transform: translateY(0) scaleY(0.92);
                opacity: 0.48;
              }
              to {
                transform: translateY(-15px) scaleY(1.08);
                opacity: 0.9;
              }
            }
            @keyframes loaderSmokeA {
              0% {
                transform: translate(-50%, -50%) rotate(-16deg) scale(0.35);
                opacity: 0;
              }
              38% {
                opacity: 0.3;
              }
              100% {
                transform: translate(-50%, -50%) rotate(7deg) scale(1.08);
                opacity: 0.58;
              }
            }
            @keyframes loaderSmokeB {
              0% {
                transform: translate(-50%, -50%) rotate(18deg) scale(0.2);
                opacity: 0;
              }
              44% {
                opacity: 0.34;
              }
              100% {
                transform: translate(-50%, -50%) rotate(-9deg) scale(1.15);
                opacity: 0.48;
              }
            }
            @keyframes loaderSpark {
              0% {
                transform: translate3d(0, 44px, 0) scale(0.5);
                opacity: 0;
              }
              24% {
                opacity: 0.9;
              }
              100% {
                transform: translate3d(var(--spark-x), -230px, 0) scale(1.15);
                opacity: 0;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .loader-wing-left,
              .loader-wing-right,
              .loader-tail,
              .loader-smoke-a,
              .loader-smoke-b,
              .loader-spark {
                animation: none !important;
              }
            }
          `}</style>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function ReferenceBase() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.img
        src="/lithos-loading-base.webp"
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 blur-[2px] saturate-125"
        initial={{ opacity: 0, scale: 1.18 }}
        animate={{ opacity: [0, 0, 0.88], scale: [1.18, 1.14, 1.08] }}
        transition={{ duration: 3.05, times: [0, 0.34, 1], ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(75,68,255,0.32)_0%,rgba(75,68,255,0.18)_20%,transparent_50%),linear-gradient(90deg,rgba(3,3,9,0.9)_0%,rgba(3,3,9,0.2)_50%,rgba(3,3,9,0.9)_100%)]" />
      <motion.div
        className="absolute left-1/2 top-[36%] h-[62vw] max-h-[720px] w-[62vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(195,182,255,0.08)_38%,transparent_72%)]"
        initial={{ scale: 0.25, opacity: 0 }}
        animate={{ scale: [0.25, 1.05, 0.94], opacity: [0, 0.92, 0.42] }}
        transition={{ duration: 2.6, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[43%] h-[74vh] w-12 -translate-x-1/2 -translate-y-1/2 bg-blue-600/45 blur-3xl"
        initial={{ opacity: 0, scaleY: 0.25 }}
        animate={{ opacity: [0, 0.9, 0.54], scaleY: [0.25, 1.05, 0.92] }}
        transition={{ delay: 1.3, duration: 2.15, ease: "easeOut" }}
      />
    </div>
  );
}

function PhoenixMotion() {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-[44%] aspect-[1.6/1] w-[min(122vw,1040px)] -translate-x-1/2 -translate-y-1/2"
        initial={{ y: "36vh", scale: 0.5, opacity: 0 }}
        animate={{
          y: ["36vh", "11vh", "-2vh", "-8vh"],
          scale: [0.5, 0.92, 1.06, 1.1],
          opacity: [0, 1, 0.86, 0],
        }}
        transition={{ duration: 4.1, times: [0, 0.42, 0.72, 1], ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="absolute left-1/2 top-[40%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,195,103,0.36)_26%,rgba(151,121,255,0.18)_52%,transparent_74%)] blur-sm"
          initial={{ scale: 0.12, opacity: 0 }}
          animate={{ scale: [0.12, 1.22, 0.86], opacity: [0, 1, 0.62] }}
          transition={{ duration: 2.7, ease: "easeOut" }}
        />

        <svg viewBox="0 0 980 610" className="relative h-full w-full overflow-visible drop-shadow-[0_0_46px_rgba(255,168,92,0.4)]">
          <defs>
            <linearGradient id="loaderWingGradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#fff8df" stopOpacity="0.98" />
              <stop offset="36%" stopColor="#ffad58" stopOpacity="0.92" />
              <stop offset="70%" stopColor="#ff5c7c" stopOpacity="0.74" />
              <stop offset="100%" stopColor="#8f78ff" stopOpacity="0.62" />
            </linearGradient>
            <linearGradient id="loaderBodyGradient" x1="50%" x2="50%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="36%" stopColor="#ffd36f" />
              <stop offset="100%" stopColor="#f16535" />
            </linearGradient>
            <filter id="loaderPhoenixGlow" x="-35%" y="-35%" width="170%" height="180%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 1 0 1 0 0 0.42 0 0 1 0 0.16 0 0 0 0.92 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#loaderPhoenixGlow)">
            <path
              className="loader-wing-left"
              d="M474 308 C356 150 198 104 30 143 C154 174 240 232 286 294 C198 269 114 291 40 364 C178 340 286 374 354 442 C264 454 188 512 144 592 C286 520 394 526 472 594 C446 486 438 390 474 308Z"
              fill="url(#loaderWingGradient)"
            />
            <path
              className="loader-wing-right"
              d="M506 308 C624 150 782 104 950 143 C826 174 740 232 694 294 C782 269 866 291 940 364 C802 340 694 374 626 442 C716 454 792 512 836 592 C694 520 586 526 508 594 C534 486 542 390 506 308Z"
              fill="url(#loaderWingGradient)"
            />
            <path
              className="loader-tail"
              d="M490 312 C446 386 456 475 394 610 C464 566 490 512 490 448 C498 512 526 566 596 610 C532 475 536 386 490 312Z"
              fill="url(#loaderWingGradient)"
              opacity="0.78"
            />
            <path
              d="M490 214 C545 278 546 374 510 442 C501 460 501 490 518 532 C496 518 489 492 490 466 C481 492 472 518 450 532 C469 490 470 460 462 442 C426 374 434 278 490 214Z"
              fill="url(#loaderBodyGradient)"
            />
            <path d="M490 216 C470 254 470 296 490 326 C510 296 510 254 490 216Z" fill="#fffbe8" />
          </g>
        </svg>
      </motion.div>

      <div className="loader-smoke-a absolute left-1/2 top-[45%] h-[32vh] w-[68vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-violet-200/18 bg-violet-300/8 blur-xl" />
      <div className="loader-smoke-b absolute left-1/2 top-[46%] h-[26vh] w-[54vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-orange-200/14 bg-orange-300/8 blur-2xl" />

      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className="loader-spark absolute bottom-[17%] h-1.5 w-1.5 rounded-full bg-orange-200 shadow-[0_0_20px_rgba(255,190,92,0.95)]"
          style={
            {
              "--spark-x": `${(index % 2 === 0 ? -1 : 1) * (34 + index * 9)}px`,
              animationDelay: `${index * 110}ms`,
              left: `${37 + (index % 7) * 4.4}%`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
