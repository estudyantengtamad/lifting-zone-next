'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'
import { sound } from '../lib/audio'
import { useStore } from '../lib/store'

type StoryChapter = {
  id: string
  number: string
  title: string
  italicTitle: string
  caption: string
  quote: string
  author: string
  archSymbol: string
  accentColor: string
  image?: string
}

const CHAPTERS: StoryChapter[] = [
  {
    id: 'origin',
    number: '01',
    title: 'The Architectural',
    italicTitle: 'Iron Foundry',
    caption: 'Forged from the discipline of classical proportions and heavy compound loads.',
    quote: 'We approached gym supply not as a retail warehouse, but as an architectural institution where typography, heavy 11-gauge steel, and pure sports nutrition share the same pursuit of uncompromising perfection.',
    author: 'Founding Director — Lifting Zone Obrero',
    archSymbol: '🏛️',
    accentColor: '#16c45a',
    image: '/gym-facility.jpg'
  },
  {
    id: 'authenticity',
    number: '02',
    title: 'Tamper Sealed',
    italicTitle: 'Biological Purity',
    caption: 'Direct US & UK laboratory import pipelines verified by HPLC spectrometry.',
    quote: 'Every tub of CBUM Itholate and German Creapure arriving at Salvador Calo Street undergoes lot certificate verification. The lifter trusts their temple with our inventory.',
    author: 'Head of Quality & Import Control',
    archSymbol: '⚡',
    accentColor: '#22e56c'
  },
  {
    id: 'community',
    number: '03',
    title: 'The Butuan',
    italicTitle: 'Heavy Metal Order',
    caption: 'From early dawn squats to midnight hypertrophy sessions under the green glow.',
    quote: 'Under the green neon glow of Salvador Calo, the iron does not lie. Whether you are loading 140 kilograms onto the bar or recovering with pure clear whey, this is where champions are sculpted.',
    author: 'Lead Strength Coach',
    archSymbol: '🏋️',
    accentColor: '#16c45a',
    image: '/gym-facility.jpg'
  }
]

function ClipArchCard({ chapter }: { chapter: StoryChapter }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, isHover: false })

  const updatePosition = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: clientX - rect.left,
      y: clientY - rect.top,
      isHover: true
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX, e.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    // Keep revealed briefly for touch users so they can read specifications
    setTimeout(() => {
      setMousePos(p => ({ ...p, isHover: false }))
    }, 1400)
  }

  const bgImage = chapter.image || (chapter.number === '01' ? '/gym-facility.jpg' : undefined)

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setMousePos(p => ({ ...p, isHover: true }))}
      onMouseLeave={() => setMousePos(p => ({ ...p, isHover: false }))}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group relative h-[420px] sm:h-[480px] md:h-[500px] w-full max-w-lg mx-auto rounded-t-[9999px] rounded-b-[2rem] sm:rounded-b-[2.5rem] border-2 border-[#16c45a]/60 bg-black shadow-[0_0_50px_rgba(22,196,90,0.25)] overflow-hidden cursor-crosshair select-none touch-none"
    >
      {/* 1. Facility Photography Layer */}
      {bgImage ? (
        <img
          src={bgImage}
          alt={`${chapter.title} ${chapter.italicTitle}`}
          className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.72] contrast-[1.08] transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2716] via-[#06170c] to-[#050806]" />
      )}

      {/* 2. Text Legibility & Contrast Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 sm:h-44 bg-gradient-to-b from-black/90 via-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 sm:h-72 bg-gradient-to-t from-black via-black/85 to-transparent" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#16c45a]/30" />

      {/* 3. Base Layer: Overlaid Typography & Emblem */}
      <div className="relative z-10 flex h-full flex-col items-center justify-between p-6 sm:p-8 md:p-10 text-center text-white">
        {/* Chapter pill with frosted glass scrim */}
        <div className="mt-2 sm:mt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/80 px-3.5 sm:px-4 py-1.5 font-head text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.22em] text-[#22e56c] border border-[#16c45a]/50 backdrop-blur-md shadow-[0_0_20px_rgba(22,196,90,0.4)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16c45a] animate-pulse" />
            Chapter {chapter.number}
          </span>
        </div>

        {/* Center: Clean viewport for photo background (no blocking icon) */}
        {!bgImage && (
          <div className="my-auto text-7xl sm:text-8xl md:text-9xl drop-shadow-[0_15px_30px_rgba(22,196,90,0.35)] transition-transform duration-500 hover:scale-110">
            {chapter.archSymbol}
          </div>
        )}

        {/* Title, Subtitle & Description — heavy drop-shadows & contrast */}
        <div className="mb-2 max-w-sm">
          <h3 className="font-solare text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight [text-shadow:_0_3px_14px_rgba(0,0,0,0.95),_0_1px_4px_rgba(0,0,0,1)]">
            {chapter.title} <span className="italic text-[#16c45a] drop-shadow-[0_0_15px_rgba(22,196,90,0.6)]">{chapter.italicTitle}</span>
          </h3>
          <p className="font-sans text-xs sm:text-sm text-white/90 mt-2 leading-relaxed font-normal [text-shadow:_0_2px_8px_rgba(0,0,0,0.95)] max-w-xs mx-auto">
            {chapter.caption}
          </p>
        </div>

        {/* Interactive Indicator */}
        <div className="rounded-full bg-black/70 backdrop-blur-md px-3 sm:px-3.5 py-1 border border-white/15 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#22e56c]/90 shadow-sm">
          <span className="hidden sm:inline">Hover cursor</span>
          <span className="sm:hidden">Touch &amp; drag</span> to reveal circular x-ray mask
        </div>
      </div>

      {/* 4. REVEAL LAYER: Circular Clip-Path expanding under mouse / touch */}
      <div
        style={{
          clipPath: mousePos.isHover
            ? `circle(130px at ${mousePos.x}px ${mousePos.y}px)`
            : 'circle(0px at 50% 50%)',
          transition: 'clip-path 0.1s ease-out'
        }}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden border-2 border-[#22e56c]"
      >
        {bgImage && (
          <img
            src={bgImage}
            alt="X-ray view"
            className="absolute inset-0 h-full w-full object-cover object-center filter saturate-150 contrast-125 brightness-95"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#06240f]/85 to-[#16c45a]/35" />

        {/* Grid reticle overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,229,108,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,229,108,0.12)_1px,transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 sm:p-8 text-center text-white">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#22e56c] mb-1.5 bg-black/80 px-2.5 py-0.5 rounded border border-[#22e56c]/40 shadow-neon">
            Revealed Specifications
          </span>
          <div className="font-solare text-xl sm:text-2xl text-white font-bold tracking-tight drop-shadow mt-1">
            100% Commercial Grade
          </div>
          <p className="text-[11px] sm:text-xs text-white/90 mt-1 max-w-xs drop-shadow">
            Salvador Calo St. facility • 11-gauge heavy steel • Direct USA/UK verified nutrition.
          </p>
          <div className="mt-3 rounded-full bg-[#16c45a] px-3 py-1 text-[9px] sm:text-[10px] font-bold text-black uppercase shadow-neon">
            Certified Lot &amp; Iron Verified
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BrandStory() {
  const { soundEnabled } = useStore()
  const [currentIdx, setCurrentIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const active = CHAPTERS[currentIdx]

  const handlePrev = () => {
    if (soundEnabled) sound.playClick()
    setCurrentIdx((currentIdx - 1 + CHAPTERS.length) % CHAPTERS.length)
  }

  const handleNext = () => {
    if (soundEnabled) sound.playClick()
    setCurrentIdx((currentIdx + 1) % CHAPTERS.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 45) {
      if (diff > 0) handleNext()
      else handlePrev()
    }
    touchStartX.current = null
  }

  return (
    <section id="story" className="mx-auto max-w-7xl px-4 py-16 sm:py-20 text-[var(--color-text)] transition-colors duration-200">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="rounded-3xl md:rounded-[3rem] border border-line bg-card p-5 sm:p-8 md:p-14 shadow-xl relative overflow-hidden dark:border-[#1a3822] dark:bg-gradient-to-b dark:from-[#07130a] dark:via-[#050806] dark:to-[#0a1e11] dark:shadow-2xl"
      >
        {/* Radial glow */}
        <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

        {/* Section Tag */}
        <div className="relative z-10 flex items-center justify-between border-b border-line dark:border-white/10 pb-6 sm:pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-400">
            <span className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]" />
            Editorial Chronicle &amp; Monograph
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-line bg-elev text-[var(--color-text)] hover:bg-brand-500 hover:text-[var(--color-btn-text)] transition shadow-sm dark:border-white/20 dark:bg-black/60 dark:text-white dark:hover:bg-white dark:hover:text-black"
              title="Previous chapter"
              aria-label="Previous chapter"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-mono text-brand-400 px-1 font-bold">
              {currentIdx + 1}/{CHAPTERS.length}
            </span>
            <button
              onClick={handleNext}
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-line bg-elev text-[var(--color-text)] hover:bg-brand-500 hover:text-[var(--color-btn-text)] transition shadow-sm dark:border-white/20 dark:bg-black/60 dark:text-white dark:hover:bg-white dark:hover:text-black"
              title="Next chapter"
              aria-label="Next chapter"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Main Content Grid: Story Quote on Left, Arch Clip Card on Right */}
        <div className="relative z-10 mt-8 sm:mt-12 grid gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="font-solare text-5xl sm:text-6xl md:text-7xl font-light text-brand-400 leading-none drop-shadow-[0_0_20px_var(--color-shadow-neon)]">
                {active.number}
              </span>
              <div className="h-[1px] flex-1 bg-line dark:bg-white/20" />
            </div>

            <h3 className="font-solare text-3xl sm:text-4xl md:text-5xl text-[var(--color-text)] tracking-tight leading-[1.05]">
              {active.title} <span className="italic text-brand-500">{active.italicTitle}</span>
            </h3>

            {/* Editorial quote with iconic Solare large text-indent */}
            <blockquote className="my-6 sm:my-8 font-solare text-lg sm:text-xl md:text-2xl text-[var(--color-text)] leading-relaxed font-light pl-4 sm:pl-6 border-l-2 border-brand-500">
              &ldquo;{active.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-brand-500" />
              <cite className="font-sans text-xs font-bold uppercase tracking-wider text-brand-400 not-italic">
                {active.author}
              </cite>
            </div>

            <div className="mt-6 sm:mt-8 flex gap-3">
              <a
                href="#supplements"
                className="solare-pill-btn flex items-center gap-3 rounded-full bg-brand-500 px-6 py-3 text-xs font-bold text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition"
              >
                <span>Shop the Supplements</span>
                <div className="relative grid h-6 w-6 place-items-center rounded-full bg-black text-brand-400 overflow-hidden">
                  <ArrowRight size={13} className="btn-arrow-1" />
                  <ArrowRight size={13} className="btn-arrow-2" />
                </div>
              </a>
            </div>
          </div>

          {/* Interactive Arch Card with Circular Clip Hover/Touch Reveal */}
          <div className="w-full">
            <ClipArchCard chapter={active} />
          </div>
        </div>
      </div>
    </section>
  )
}
