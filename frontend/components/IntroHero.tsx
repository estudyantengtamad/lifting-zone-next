'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowDown, Dumbbell, ShieldCheck, Sparkles } from 'lucide-react'

const LETTERS = ['L', 'I', 'F', 'T', 'I', 'N', 'G', ' ', 'Z', 'O', 'N', 'E']

export default function IntroHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // Silky responsive spring for 3D typography & portal expansion (instant tactile thumb response)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    mass: 0.05,
    restDelta: 0.0001
  })

  // 1. Center Circle Disc Scale (grows from 1 to 9, creating the expanding radial portal glow)
  const circleScale = useTransform(smoothProgress, [0, 0.40], [1, 9])
  const circleOpacity = useTransform(smoothProgress, [0, 0.25, 0.65, 1], [0.9, 0.85, 0.7, 0.45])

  // 2. Letters Stage 1: Disperse outward smoothly without wrapping or clipping
  const lettersScale = useTransform(smoothProgress, [0, 0.30], [1, 1.6])
  const lettersOpacity = useTransform(smoothProgress, [0.12, 0.28], [1, 0])
  const lettersZ = useTransform(smoothProgress, [0, 0.30], [0, 200])

  // 3. Subtitle & Scroll Indicator Fade Out
  const introFade = useTransform(smoothProgress, [0, 0.15], [1, 0])

  // 4. Perspective Reveal Lines (Lines 1 to 5 rotate and reveal on scroll from 0.30 to 0.74)
  const lineRotateX1 = useTransform(smoothProgress, [0.30, 0.42], [30, 0])
  const lineOpacity1 = useTransform(smoothProgress, [0.30, 0.42], [0, 1])

  const lineRotateX2 = useTransform(smoothProgress, [0.38, 0.50], [30, 0])
  const lineOpacity2 = useTransform(smoothProgress, [0.38, 0.50], [0, 1])

  const lineRotateX3 = useTransform(smoothProgress, [0.46, 0.58], [30, 0])
  const lineOpacity3 = useTransform(smoothProgress, [0.46, 0.58], [0, 1])

  const lineRotateX4 = useTransform(smoothProgress, [0.54, 0.66], [30, 0])
  const lineOpacity4 = useTransform(smoothProgress, [0.54, 0.66], [0, 1])

  const lineRotateX5 = useTransform(smoothProgress, [0.62, 0.74], [30, 0])
  const lineOpacity5 = useTransform(smoothProgress, [0.62, 0.74], [0, 1])

  return (
    <div ref={containerRef} className="relative h-[250vh] sm:h-[280vh] md:h-[300vh] bg-[var(--color-bg)] transition-colors duration-200">
      {/* Sticky Fullscreen 3D Stage - Stays persistent and is smoothly covered by Equipment */}
      <div className="sticky top-0 h-[100dvh] w-full max-w-full overflow-hidden flex items-center justify-center">
        {/* Background Gradient of Black, Deep Forest, and Neon Green */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-brand-500/10 dark:via-[#06240f]/60 to-[var(--color-bg)] pointer-events-none transition-colors duration-200" />

        {/* Central Expanding Portal Disc */}
        <motion.div
          style={{
            scale: circleScale,
            opacity: circleOpacity
          }}
          className="absolute h-[230px] w-[230px] xs:h-[280px] xs:w-[280px] sm:h-[380px] sm:w-[380px] rounded-full bg-gradient-to-t from-brand-500 via-brand-400 to-white/90 shadow-[0_0_90px_var(--color-shadow-neon)] filter blur-[1px] pointer-events-none opacity-80"
        />

        {/* Secondary Inner Pulse Ring */}
        <motion.div
          style={{
            scale: circleScale,
            opacity: useTransform(smoothProgress, [0, 0.4], [0.6, 0])
          }}
          className="absolute h-[260px] w-[260px] xs:h-[320px] xs:w-[320px] sm:h-[420px] sm:w-[420px] rounded-full border border-brand-500/40 dark:border-white/50 pointer-events-none"
        />

        {/* STAGE 1: Giant 3D Perspective Title "LIFTING ZONE" (Scrolls outward into camera) */}
        <motion.div
          style={{
            scale: lettersScale,
            opacity: lettersOpacity,
            z: lettersZ
          }}
          className="relative z-20 flex flex-col items-center justify-center text-center select-none perspective-stage px-2 w-full max-w-full"
        >
          {/* Subtle eyebrow above title */}
          <motion.div style={{ opacity: introFade }} className="mb-2 sm:mb-4">
            <span className="rounded-full border border-line bg-card/90 px-3 sm:px-4 py-1 font-head text-[9px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.25em] text-[var(--color-text)] backdrop-blur-md shadow-sm dark:border-white/30 dark:bg-black/60 dark:text-white">
              Butuan City • Salvador Calo St.
            </span>
          </motion.div>

          <h1 className="font-solare text-[1.9rem] xs:text-3xl sm:text-6xl md:text-[9rem] lg:text-[12rem] xl:text-[13rem] font-black italic tracking-[-0.03em] sm:tracking-[-0.05em] leading-none text-[var(--color-text)] drop-shadow-[0_10px_25px_rgba(0,0,0,0.12)] dark:text-white dark:drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] max-w-full whitespace-nowrap">
            {LETTERS.map((char, idx) => {
              return (
                <motion.span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre'
                  }}
                  className="transition-transform"
                >
                  {char}
                </motion.span>
              )
            })}
          </h1>

          {/* Subtitle during initial view */}
          <motion.p
            style={{ opacity: introFade }}
            className="font-solare italic font-light text-xs sm:text-base md:text-2xl text-[var(--color-text-muted)] dark:text-white/90 mt-3 sm:mt-4 max-w-xl drop-shadow px-4"
          >
            A quintessential fusion of architectural typography and heavy commercial iron.
          </motion.p>

          {/* Scroll Indicator Pill */}
          <motion.button
            type="button"
            style={{ opacity: introFade }}
            onClick={() => {
              const el = document.getElementById('equipment')
              if (el) {
                if (typeof window !== 'undefined' && (window as any).__lz_lenis) {
                  (window as any).__lz_lenis.scrollTo(el, { offset: -68, duration: 1.4 })
                } else {
                  el.scrollIntoView({ behavior: 'smooth' })
                }
              }
            }}
            className="mt-6 sm:mt-8 flex flex-col items-center gap-2 cursor-pointer group focus:outline-none pointer-events-auto select-none"
            title="Scroll to discover equipment"
            aria-label="Scroll to discover equipment"
          >
            <span className="font-head text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-brand-500 group-hover:text-brand-400 transition-colors">
              Scroll to discover
            </span>
            <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-brand-500 text-[var(--color-btn-text)] shadow-neon group-hover:scale-110 group-hover:bg-brand-400 transition-all animate-bounce">
              <ArrowDown size={14} />
            </div>
          </motion.button>
        </motion.div>

        {/* STAGE 2: Monumental Perspective Typography Reveal (Rotates from 30deg on scroll) */}
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none px-4 w-full max-w-full overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center text-[var(--color-text)] dark:text-white perspective-stage leading-[0.95] max-w-full gap-1.5 xs:gap-2 sm:gap-3">
            {/* Line 1 */}
            <motion.div
              style={{
                rotateX: lineRotateX1,
                opacity: lineOpacity1,
                transformOrigin: 'top center'
              }}
              className="font-solare italic text-xl xs:text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight text-[var(--color-text)] dark:text-white"
            >
              A timeless
            </motion.div>

            {/* Line 2 */}
            <motion.div
              style={{
                rotateX: lineRotateX2,
                opacity: lineOpacity2,
                transformOrigin: 'top center'
              }}
              className="font-solare text-xl xs:text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight text-[var(--color-text)] dark:text-white flex items-center gap-1.5 xs:gap-2 sm:gap-4"
            >
              <span className="italic font-light">iron —</span>
              <span className="font-black text-brand-500 dark:text-[#22e56c] drop-shadow-[0_0_25px_var(--color-brand-500)]">Forged</span>
            </motion.div>

            {/* Line 3 */}
            <motion.div
              style={{
                rotateX: lineRotateX3,
                opacity: lineOpacity3,
                transformOrigin: 'top center'
              }}
              className="font-solare text-xl xs:text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight text-[var(--color-text)] dark:text-white flex items-center gap-1.5 xs:gap-2 sm:gap-3"
            >
              <span className="text-[0.55em] italic font-light lowercase">by the</span>
              <span className="font-extrabold uppercase text-[var(--color-text)] dark:text-white">GLOW</span>
            </motion.div>

            {/* Line 4 */}
            <motion.div
              style={{
                rotateX: lineRotateX4,
                opacity: lineOpacity4,
                transformOrigin: 'top center'
              }}
              className="font-solare text-xl xs:text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight uppercase text-[var(--color-text-muted)] dark:text-white/90"
            >
              OF BUTUAN
            </motion.div>

            {/* Line 5 */}
            <motion.div
              style={{
                rotateX: lineRotateX5,
                opacity: lineOpacity5,
                transformOrigin: 'top center'
              }}
              className="font-solare text-2xl xs:text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight uppercase font-black text-brand-500 dark:text-[#16c45a] drop-shadow-[0_0_35px_var(--color-brand-500)]"
            >
              GRIT*
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
