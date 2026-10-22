'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, RotateCcw, Flame, Sparkles, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { sound } from '../lib/audio'
import { products, peso } from '../lib/data'

type Plate = {
  weight: number
  color: string
  colorLight: string
  colorDark: string
  border: string
  textColor: string
  height: number
  width: number
}

const AVAILABLE_PLATES: Plate[] = [
  {
    weight: 25,
    color: '#e11d48',
    colorLight: '#fb7185',
    colorDark: '#9f1239',
    border: '#881337',
    textColor: '#ffffff',
    height: 136,
    width: 32
  },
  {
    weight: 20,
    color: '#2563eb',
    colorLight: '#60a5fa',
    colorDark: '#1e40af',
    border: '#172554',
    textColor: '#ffffff',
    height: 136,
    width: 26
  },
  {
    weight: 15,
    color: '#eab308',
    colorLight: '#fde047',
    colorDark: '#a16207',
    border: '#713f12',
    textColor: '#000000',
    height: 136,
    width: 20
  },
  {
    weight: 10,
    color: '#16a34a',
    colorLight: '#4ade80',
    colorDark: '#166534',
    border: '#14532d',
    textColor: '#ffffff',
    height: 136,
    width: 15
  },
  {
    weight: 5,
    color: '#f1f5f9',
    colorLight: '#ffffff',
    colorDark: '#94a3b8',
    border: '#64748b',
    textColor: '#0f172a',
    height: 100,
    width: 11
  },
  {
    weight: 2.5,
    color: '#1e293b',
    colorLight: '#334155',
    colorDark: '#0f172a',
    border: '#020617',
    textColor: '#ffffff',
    height: 82,
    width: 9
  },
  {
    weight: 1.25,
    color: '#94a3b8',
    colorLight: '#cbd5e1',
    colorDark: '#475569',
    border: '#334155',
    textColor: '#0f172a',
    height: 68,
    width: 7
  }
]

function RealisticPlateDisc({ plate, size = 48 }: { plate: Plate; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${plate.colorLight} 0%, ${plate.color} 55%, ${plate.colorDark} 100%)`,
        boxShadow: `0 4px 10px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -3px 5px rgba(0,0,0,0.7), 0 0 15px ${plate.color}30`
      }}
      className="relative rounded-full flex items-center justify-center border border-black/40 p-1 transition-transform group-hover:scale-105 select-none"
    >
      {/* Outer Raised Bumper Rim Groove */}
      <div className="absolute inset-[3px] rounded-full border border-black/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.2)]" />

      {/* Recessed Inner Channel matching reference photo */}
      <div
        style={{
          background: `radial-gradient(circle at 40% 35%, ${plate.color} 0%, ${plate.colorDark} 85%, #050505 100%)`
        }}
        className="absolute inset-[6px] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.7),0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center"
      >
        {/* Stainless Steel Olympic 50mm Collar Bushing */}
        <div className="relative h-4 w-4 rounded-full bg-gradient-to-tr from-zinc-500 via-zinc-100 to-zinc-400 p-[1.5px] shadow-[0_1px_3px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-black shadow-inner" />
        </div>
      </div>

      {/* Top curved brand styling */}
      <div
        style={{ color: plate.textColor }}
        className="absolute top-[6px] text-[7px] font-black uppercase tracking-wider opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
      >
        ZONE
      </div>

      {/* Bottom Weight Numeral */}
      <div
        style={{ color: plate.textColor }}
        className="absolute bottom-[6px] font-head text-[9px] font-black leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
      >
        {plate.weight}
      </div>

      {/* Urethane Surface Gloss Reflection */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
    </div>
  )
}

export default function BarbellCalculator() {
  const { soundEnabled, add } = useStore()
  const [tab, setTab] = useState<'plates' | 'onerm'>('plates')
  const [barWeight, setBarWeight] = useState(20) // 20kg standard bar
  const [platesPerSide, setPlatesPerSide] = useState<number[]>([20, 20, 10]) // default: 120kg
  const [targetInput, setTargetInput] = useState('')

  // 1RM state
  const [liftWeight, setLiftWeight] = useState(100)
  const [liftReps, setLiftReps] = useState(5)

  // Auto-fit responsive barbell engine for all mobile aspect ratios
  const barContainerRef = useRef<HTMLDivElement>(null)
  const [barScale, setBarScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (barContainerRef.current) {
        const availableWidth = barContainerRef.current.clientWidth - 12
        const baseWidth = 640
        if (availableWidth < baseWidth) {
          const nextScale = Math.max(0.30, Math.min(1, availableWidth / baseWidth))
          setBarScale(nextScale)
        } else {
          setBarScale(1)
        }
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Calculate total barbell weight
  const totalWeight = barWeight + platesPerSide.reduce((a, b) => a + b, 0) * 2

  const handleAddPlate = (w: number) => {
    if (platesPerSide.length >= 10) return
    if (soundEnabled) sound.playIronClank()
    setPlatesPerSide(prev => [...prev, w])
  }

  const handleRemovePlate = (index: number) => {
    if (soundEnabled) sound.playClick()
    setPlatesPerSide(prev => prev.filter((_, i) => i !== index))
  }

  const handleClear = () => {
    if (soundEnabled) sound.playClick()
    setPlatesPerSide([])
  }

  // Auto calculate plates for desired weight
  const calculatePlatesForWeight = (desired: number) => {
    if (desired < barWeight) return
    let rem = (desired - barWeight) / 2
    const result: number[] = []
    const sorted = [...AVAILABLE_PLATES].sort((a, b) => b.weight - a.weight)

    for (const p of sorted) {
      while (rem >= p.weight && result.length < 10) {
        result.push(p.weight)
        rem = Math.round((rem - p.weight) * 100) / 100
      }
    }
    if (soundEnabled) sound.playIronClank()
    setPlatesPerSide(result)
  }

  // 1RM calculations (Epley formula: 1RM = W * (1 + r/30))
  const oneRM = Math.round(liftWeight * (1 + liftReps / 30))
  const zones = [
    { label: 'Max Effort (1RM)', pct: 100, w: oneRM, reps: '1 rep' },
    { label: 'Heavy Strength', pct: 90, w: Math.round(oneRM * 0.9), reps: '3-4 reps' },
    { label: 'Hypertrophy Zone', pct: 80, w: Math.round(oneRM * 0.8), reps: '6-8 reps' },
    { label: 'Volume & Pump', pct: 70, w: Math.round(oneRM * 0.7), reps: '10-12 reps' }
  ]

  // Suggested gear for powerlifters
  const beltProduct = products[11] // Inzer belt
  const cbumPre = products[0] // CBUM pre

  return (
    <section id="iron-lab" className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <Dumbbell size={14} className="text-brand-500" /> Interactive Gym Utility
          </span>
          <h2 className="h mt-1 text-3xl md:text-5xl text-[var(--color-text)]">
            The <span className="neon">Iron Lab</span> &amp; Plate Math
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Interactive barbell visualizer, Olympic plate loader, and instant 1RM strength calculator.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl border border-line bg-card p-1">
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick()
              setTab('plates')
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-head text-xs font-bold uppercase transition ${
              tab === 'plates' ? 'bg-brand-500 text-[var(--color-btn-text)] shadow-neon' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Dumbbell size={14} /> Barbell Loader
          </button>
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick()
              setTab('onerm')
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-head text-xs font-bold uppercase transition ${
              tab === 'onerm' ? 'bg-brand-500 text-[var(--color-btn-text)] shadow-neon' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Flame size={14} /> 1RM Calculator
          </button>
        </div>
      </div>

      {tab === 'plates' ? (
        <div className="rounded-3xl border border-line bg-card p-3 sm:p-6 md:p-8 shadow-sm overflow-hidden">
          {/* Header Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)] font-bold">Total Loaded Weight</span>
              <div className="flex items-baseline gap-2">
                <span className="font-head text-4xl sm:text-5xl font-black text-[var(--color-text)]">{totalWeight}</span>
                <span className="font-head text-lg sm:text-xl font-bold text-brand-500">KG</span>
                <span className="text-xs sm:text-sm text-[var(--color-text-subtle)]">({Math.round(totalWeight * 2.20462)} LBS)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Bar Weight Selector */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-elev p-1 text-xs">
                <span className="px-1.5 text-[var(--color-text-subtle)] font-bold">Bar:</span>
                {[20, 15].map(b => (
                  <button
                    key={b}
                    onClick={() => {
                      if (soundEnabled) sound.playClick()
                      setBarWeight(b)
                    }}
                    className={`rounded-lg px-2.5 py-1 font-bold transition ${
                      barWeight === b ? 'bg-brand-500 text-[var(--color-btn-text)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {b}kg
                  </button>
                ))}
              </div>

              {/* Quick auto-target input */}
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const n = parseFloat(targetInput)
                  if (!isNaN(n)) calculatePlatesForWeight(n)
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="number"
                  placeholder="Target KG (e.g. 140)"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  className="w-28 sm:w-36 rounded-xl border border-line bg-card px-2.5 py-1.5 sm:py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] outline-none focus:border-brand-500"
                />
                <button type="submit" className="btn !py-1.5 !px-3 !text-xs">
                  Load
                </button>
              </form>

              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1.5 sm:py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-brand-500/50 transition"
              >
                <RotateCcw size={12} /> Clear
              </button>
            </div>
          </div>

          {/* VISUAL BARBELL RENDER (Auto-fits every mobile aspect ratio with fluid scaling) */}
          <div
            ref={barContainerRef}
            className="relative my-3 sm:my-6 flex items-center justify-center w-full overflow-hidden select-none py-2"
            style={{
              height: `${Math.round(200 * barScale)}px`,
              minHeight: '96px'
            }}
          >
            <div
              style={{
                transform: `scale(${barScale})`,
                transformOrigin: 'center center'
              }}
              className="relative flex items-center justify-center w-[640px] h-[200px] shrink-0"
            >
              {/* Center Bar Shaft (High-Polish Chrome Olympic Steel) */}
              <div className="relative h-4 w-[320px] rounded-full bg-gradient-to-b from-white via-[#e2e8f0] to-[#64748b] shadow-[0_8px_20px_rgba(0,0,0,0.9)] border-y border-zinc-400/80">
                {/* Specular White Reflection Line running along the top */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-white/90 rounded-t-full shadow-[0_0_4px_#ffffff]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-[#334155]/80 rounded-b-full" />

                {/* Grip Knurling Sections (Left & Right Grip Zones with Dual Rings) */}
                {/* Left Knurling Zone */}
                <div className="absolute left-[38px] w-[90px] h-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f172a]/20 opacity-60 bg-[repeating-linear-gradient(45deg,#000,#000_1px,transparent_1px,transparent_2.5px)]" />
                  {/* Knurl Ring Mark (IPF/IWF smooth ring) */}
                  <div className="absolute right-5 h-full w-[2.5px] bg-gradient-to-b from-white to-zinc-300 border-x border-zinc-500 shadow-sm" />
                </div>

                {/* Smooth Center Shaft Section (Reflective Mirror Chrome - As seen in photo) */}
                <div className="absolute left-1/2 -translate-x-1/2 w-[60px] h-full bg-gradient-to-b from-white via-[#f1f5f9] to-[#64748b] border-x border-zinc-400/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />

                {/* Right Knurling Zone */}
                <div className="absolute right-[38px] w-[90px] h-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f172a]/20 opacity-60 bg-[repeating-linear-gradient(45deg,#000,#000_1px,transparent_1px,transparent_2.5px)]" />
                  {/* Knurl Ring Mark (IPF/IWF smooth ring) */}
                  <div className="absolute left-5 h-full w-[2.5px] bg-gradient-to-b from-white to-zinc-300 border-x border-zinc-500 shadow-sm" />
                </div>

                {/* Barbell Weight Badge */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-bold text-[#22e56c] uppercase tracking-widest whitespace-nowrap bg-black/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#16c45a]/40 shadow-neon select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16c45a] animate-pulse" />
                  Hard Chrome Olympic Bar ({barWeight}kg)
                </div>
              </div>

              {/* Left Sleeve & Collar Assembly */}
              <div className="absolute right-1/2 mr-[160px] flex items-center flex-row-reverse">
                {/* Precision Stepped Collar Flange (as in photo) */}
                <div className="relative flex items-center flex-row-reverse shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                  {/* Bushing Rotation Seam */}
                  <div className="h-6 w-[2px] bg-black/80" />
                  {/* Outer Flange Ring */}
                  <div className="h-12 w-4 rounded-l-[3px] bg-gradient-to-b from-white via-[#cbd5e1] to-[#475569] border-y border-l border-zinc-400 relative shadow-md">
                    <div className="absolute inset-y-1 right-1 w-[2px] bg-zinc-600/70" />
                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white" />
                  </div>
                  {/* Inner Flange Step */}
                  <div className="h-10 w-2 bg-gradient-to-b from-white via-[#cbd5e1] to-[#334155] border-y border-l border-zinc-500" />
                </div>

                {/* Chrome Loading Sleeve Cylinder */}
                <div className="relative flex items-center flex-row-reverse h-[30px] min-w-[145px] bg-gradient-to-b from-white via-[#e2e8f0] to-[#475569] rounded-l-[4px] border-y border-l border-zinc-400 px-1 gap-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.6)]">
                  {/* Top Specular Reflection Highlight */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white rounded-t-[3px] shadow-[0_0_3px_#ffffff]" />
                  {/* Micro-ribbing lines */}
                  <div className="pointer-events-none absolute inset-0 opacity-15 bg-[repeating-linear-gradient(90deg,#000,#000_1px,transparent_1px,transparent_4px)]" />

                  {/* Outer Sleeve Tip Endcap Bevel with Snap Ring */}
                  <div className="pointer-events-none absolute -left-[5px] h-[26px] w-[5px] rounded-l-full bg-gradient-to-b from-white via-zinc-300 to-zinc-600 border border-zinc-500 shadow-sm" />

                  {/* Olympic Quick-Clamp Collar when plates are loaded */}
                  {platesPerSide.length > 0 && (
                    <div
                      title="Olympic Quick-Release Collar"
                      className="relative h-11 w-3.5 rounded-[3px] bg-gradient-to-b from-white via-[#cbd5e1] to-[#334155] border border-zinc-500 shadow-[0_2px_6px_rgba(0,0,0,0.8)] flex items-center justify-center mr-0.5 select-none"
                    >
                      <div className="h-5 w-1.5 bg-black/85 rounded-full border border-white/20" />
                    </div>
                  )}

                  <AnimatePresence>
                    {platesPerSide.map((pWeight, idx) => {
                      const plate = AVAILABLE_PLATES.find(p => p.weight === pWeight) || AVAILABLE_PLATES[0]
                      return (
                        <motion.div
                          key={`left-${idx}`}
                          initial={{ scale: 0.8, opacity: 0, x: 20 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          onClick={() => handleRemovePlate(idx)}
                          style={{
                            height: plate.height,
                            width: plate.width
                          }}
                          title={`Click to remove ${plate.weight}kg plate`}
                          className="relative cursor-pointer select-none rounded-[4px] shadow-[3px_0_10px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.7)] flex items-center justify-center transition hover:scale-105 hover:brightness-110 group/plate"
                        >
                          {/* Cylindrical Bumper Gradient */}
                          <div
                            style={{
                              background: `linear-gradient(180deg, ${plate.colorLight} 0%, ${plate.color} 20%, ${plate.colorDark} 80%, #030303 100%)`,
                              borderColor: plate.border
                            }}
                            className="absolute inset-0 rounded-[4px] border-[1.5px]"
                          />

                          {/* Beveled Rubber Rim Highlights */}
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/45 rounded-t-[3px]" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-black/70 rounded-b-[3px]" />

                          {/* Recessed Bumper Center Ridge */}
                          <div className="pointer-events-none absolute inset-y-2 inset-x-[2px] border-x border-black/30 opacity-70" />

                          {/* Center Stainless Steel Collar Bushing segment */}
                          <div className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-t from-zinc-500 via-zinc-100 to-zinc-400 opacity-35 mix-blend-overlay border-y border-zinc-700/80" />

                          {/* Urethane Vertical Gloss Sheen */}
                          <div className="pointer-events-none absolute inset-y-0 left-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                          {/* Embossed Numeral */}
                          <span
                            style={{ color: plate.textColor }}
                            className="relative z-10 font-head text-[10px] font-black -rotate-90 select-none whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                          >
                            {plate.weight}
                          </span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Sleeve & Collar Assembly */}
              <div className="absolute left-1/2 ml-[160px] flex items-center">
                {/* Precision Stepped Collar Flange */}
                <div className="relative flex items-center shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                  {/* Bushing Rotation Seam */}
                  <div className="h-6 w-[2px] bg-black/80" />
                  {/* Outer Flange Ring */}
                  <div className="h-12 w-4 rounded-r-[3px] bg-gradient-to-b from-white via-[#cbd5e1] to-[#475569] border-y border-r border-zinc-400 relative shadow-md">
                    <div className="absolute inset-y-1 left-1 w-[2px] bg-zinc-600/70" />
                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white" />
                  </div>
                  {/* Inner Flange Step */}
                  <div className="h-10 w-2 bg-gradient-to-b from-white via-[#cbd5e1] to-[#334155] border-y border-r border-zinc-500" />
                </div>

                {/* Chrome Loading Sleeve Cylinder */}
                <div className="relative flex items-center h-[30px] min-w-[145px] bg-gradient-to-b from-white via-[#e2e8f0] to-[#475569] rounded-r-[4px] border-y border-r border-zinc-400 px-1 gap-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.6)]">
                  {/* Top Specular Reflection Highlight */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white rounded-t-[3px] shadow-[0_0_3px_#ffffff]" />
                  {/* Micro-ribbing lines */}
                  <div className="pointer-events-none absolute inset-0 opacity-15 bg-[repeating-linear-gradient(90deg,#000,#000_1px,transparent_1px,transparent_4px)]" />

                  {/* Outer Sleeve Tip Endcap Bevel with Snap Ring */}
                  <div className="pointer-events-none absolute -right-[5px] h-[26px] w-[5px] rounded-r-full bg-gradient-to-b from-white via-zinc-300 to-zinc-600 border border-zinc-500 shadow-sm" />

                  <AnimatePresence>
                    {platesPerSide.map((pWeight, idx) => {
                      const plate = AVAILABLE_PLATES.find(p => p.weight === pWeight) || AVAILABLE_PLATES[0]
                      return (
                        <motion.div
                          key={`right-${idx}`}
                          initial={{ scale: 0.8, opacity: 0, x: -20 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          onClick={() => handleRemovePlate(idx)}
                          style={{
                            height: plate.height,
                            width: plate.width
                          }}
                          title={`Click to remove ${plate.weight}kg plate`}
                          className="relative cursor-pointer select-none rounded-[4px] shadow-[3px_0_10px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.7)] flex items-center justify-center transition hover:scale-105 hover:brightness-110 group/plate"
                        >
                          {/* Cylindrical Bumper Gradient */}
                          <div
                            style={{
                              background: `linear-gradient(180deg, ${plate.colorLight} 0%, ${plate.color} 20%, ${plate.colorDark} 80%, #030303 100%)`,
                              borderColor: plate.border
                            }}
                            className="absolute inset-0 rounded-[4px] border-[1.5px]"
                          />

                          {/* Beveled Rubber Rim Highlights */}
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/45 rounded-t-[3px]" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-black/70 rounded-b-[3px]" />

                          {/* Recessed Bumper Center Ridge */}
                          <div className="pointer-events-none absolute inset-y-2 inset-x-[2px] border-x border-black/30 opacity-70" />

                          {/* Center Stainless Steel Collar Bushing segment */}
                          <div className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-t from-zinc-500 via-zinc-100 to-zinc-400 opacity-35 mix-blend-overlay border-y border-zinc-700/80" />

                          {/* Urethane Vertical Gloss Sheen */}
                          <div className="pointer-events-none absolute inset-y-0 left-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                          {/* Embossed Numeral */}
                          <span
                            style={{ color: plate.textColor }}
                            className="relative z-10 font-head text-[10px] font-black -rotate-90 select-none whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                          >
                            {plate.weight}
                          </span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {/* Olympic Quick-Clamp Collar when plates are loaded */}
                  {platesPerSide.length > 0 && (
                    <div
                      title="Olympic Quick-Release Collar"
                      className="relative h-11 w-3.5 rounded-[3px] bg-gradient-to-b from-white via-[#cbd5e1] to-[#334155] border border-zinc-500 shadow-[0_2px_6px_rgba(0,0,0,0.8)] flex items-center justify-center ml-0.5 select-none"
                    >
                      <div className="h-5 w-1.5 bg-black/85 rounded-full border border-white/20" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Loaded Plates Quick-Access Strip */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-2 sm:my-3">
            {platesPerSide.length > 0 ? (
              <>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)] mr-1">
                  Each Sleeve:
                </span>
                {platesPerSide.map((weight, idx) => {
                  const p = AVAILABLE_PLATES.find(plate => plate.weight === weight) || AVAILABLE_PLATES[0]
                  return (
                    <button
                      key={`pill-${idx}`}
                      onClick={() => handleRemovePlate(idx)}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white border transition hover:scale-105 active:scale-95 shadow-sm"
                      style={{
                        backgroundColor: p.colorDark,
                        borderColor: p.border
                      }}
                      title={`Tap to remove ${weight}kg plate`}
                    >
                      <span>{weight}kg</span>
                      <X size={10} className="opacity-80 hover:opacity-100" />
                    </button>
                  )
                })}
                <button
                  onClick={handleClear}
                  className="text-[10px] text-red-400 font-bold hover:underline ml-1.5 flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Unload
                </button>
              </>
            ) : (
              <p className="text-center text-xs text-[var(--color-text-subtle)]">
                Barbell is unloaded ({barWeight}kg bar). Tap any bumper plate below to load both sleeves.
              </p>
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--color-text-subtle)] mb-4">
            💡 Click any plate on the bar or pills above to remove it. Plates mirror on both sleeves.
          </p>

          {/* Interactive Plate Rack - Click to Add */}
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]" />
              Load Olympic Bumper Plates to Bar:
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
              {AVAILABLE_PLATES.map(p => (
                <button
                  key={p.weight}
                  onClick={() => handleAddPlate(p.weight)}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border border-line bg-card p-2 sm:p-3 transition hover:border-brand-500 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <div className="mb-1 sm:mb-2">
                    <RealisticPlateDisc plate={p} size={40} />
                  </div>
                  <span className="font-head text-[11px] sm:text-xs font-black text-[var(--color-text)] group-hover:text-brand-500 transition">
                    +{p.weight} KG
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[var(--color-text-subtle)] font-mono">({p.weight * 2}k pair)</span>
                </button>
              ))}

              {/* 8th Slot: Clear / Unload All */}
              <button
                onClick={handleClear}
                disabled={platesPerSide.length === 0}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-line bg-card p-2 sm:p-3 transition hover:border-red-500/50 hover:scale-105 active:scale-95 shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                title="Unload all plates from bar"
              >
                <div className="mb-1 sm:mb-2 grid h-[40px] w-[40px] place-items-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 group-hover:bg-red-500/20 group-hover:rotate-180 transition duration-300">
                  <RotateCcw size={18} />
                </div>
                <span className="font-head text-[11px] sm:text-xs font-black text-red-400 group-hover:text-red-300 transition">
                  CLEAR
                </span>
                <span className="text-[9px] sm:text-[10px] text-[var(--color-text-subtle)] font-mono">Unload All</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 1RM CALCULATOR */
        <div className="grid gap-6 md:grid-cols-[1fr_320px] rounded-3xl border border-line bg-card p-4 sm:p-6 md:p-8 shadow-sm">
          <div>
            <h3 className="h text-xl md:text-2xl mb-1 text-[var(--color-text)]">One Rep Max (1RM) Estimator</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Calculate your theoretical single rep maximum and target training percentages.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-elev/60 p-4">
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] block mb-2 font-bold">
                  Weight Lifted (KG): <span className="neon text-base">{liftWeight} kg</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={350}
                  step={2.5}
                  value={liftWeight}
                  onChange={e => setLiftWeight(parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-[11px] text-[var(--color-text-subtle)] mt-1">
                  <span>20kg</span>
                  <span>180kg</span>
                  <span>350kg</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-elev/60 p-4">
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] block mb-2 font-bold">
                  Repetitions Performed: <span className="neon text-base">{liftReps} reps</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={liftReps}
                  onChange={e => setLiftReps(parseInt(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-[11px] text-[var(--color-text-subtle)] mt-1">
                  <span>1 rep</span>
                  <span>6 reps</span>
                  <span>12 reps</span>
                </div>
              </div>
            </div>

            {/* Estimated 1RM Big Badge */}
            <div className="my-6 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-brand-400 font-bold">Calculated 1RM</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-head text-4xl font-black text-[var(--color-text)]">{oneRM}</span>
                  <span className="font-head text-lg font-bold text-brand-500">KG</span>
                  <span className="text-sm text-[var(--color-text-subtle)]">({Math.round(oneRM * 2.20462)} LBS)</span>
                </div>
              </div>
              <button
                onClick={() => {
                  calculatePlatesForWeight(oneRM)
                  setTab('plates')
                }}
                className="btn !py-2 !px-3 !text-xs flex items-center gap-1.5"
              >
                <Sparkles size={14} /> Load on Barbell
              </button>
            </div>

            {/* Strength Training Percentages Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {zones.map(z => (
                <div key={z.pct} className="rounded-xl border border-line bg-elev/70 p-3">
                  <div className="text-[10px] uppercase font-bold text-brand-400">{z.label}</div>
                  <div className="font-head text-2xl font-black text-[var(--color-text)] mt-1">{z.w} <span className="text-xs font-normal text-[var(--color-text-muted)]">kg</span></div>
                  <div className="text-[11px] text-[var(--color-text-subtle)]">{z.pct}% • {z.reps}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Heavy Lifting Gear */}
          <div className="flex flex-col rounded-2xl border border-brand-500/30 bg-card p-4">
            <span className="eyebrow text-[10px]">Strength Armoury</span>
            <h4 className="font-head text-sm font-bold text-[var(--color-text)] mt-1 mb-3">Recommended for Heavy PRs</h4>

            <div className="space-y-3 flex-1">
              {/* Belt */}
              <div className="rounded-xl border border-line bg-elev p-3 flex items-center gap-3">
                <span className="text-3xl">{beltProduct.e}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate text-[var(--color-text)]">{beltProduct.t}</div>
                  <div className="text-[11px] text-brand-400 font-bold">{peso(beltProduct.p)}</div>
                </div>
                <button
                  onClick={() => add(beltProduct.id)}
                  className="rounded-lg bg-brand-500 p-2 text-[var(--color-btn-text)] hover:bg-brand-400 shadow-neon"
                  title="Add to cart"
                >
                  <Dumbbell size={14} />
                </button>
              </div>

              {/* Pre-workout */}
              <div className="rounded-xl border border-line bg-elev p-3 flex items-center gap-3">
                <span className="text-3xl">{cbumPre.e}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate text-[var(--color-text)]">{cbumPre.t}</div>
                  <div className="text-[11px] text-brand-400 font-bold">{peso(cbumPre.p)}</div>
                </div>
                <button
                  onClick={() => add(cbumPre.id)}
                  className="rounded-lg bg-brand-500 p-2 text-[var(--color-btn-text)] hover:bg-brand-400 shadow-neon"
                  title="Add to cart"
                >
                  <Dumbbell size={14} />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[var(--color-text-subtle)] mt-4">
              🛡️ All lifting gear stocked at Salvador Calo St. is competition certified and authentic.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
