'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ShieldCheck, Flame, Plus, Check, Dumbbell, Shield, Activity, Package, type LucideIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import { sound } from '../lib/audio'
import { products, peso, Product } from '../lib/data'

type GoalKey = 'hypertrophy' | 'cut' | 'strength' | 'endurance'

interface GoalConfig {
  label: string
  icon: LucideIcon
  sub: string
  proteinMultiplier: number
  creatineGrams: number
  recommendedIds: number[]
}

const GOALS: Record<GoalKey, GoalConfig> = {
  hypertrophy: {
    label: 'Mass & Hypertrophy',
    icon: Dumbbell,
    sub: 'Maximum lean muscle synthesis and cell volumization',
    proteinMultiplier: 2.0,
    creatineGrams: 5,
    recommendedIds: [3, 4, 1] // Ghost Whey, RAW Creatine, Thavage Pre
  },
  cut: {
    label: 'Chiseled Shred & Cut',
    icon: Zap,
    sub: 'Retain dense muscle while stripping stubborn body fat',
    proteinMultiplier: 2.2,
    creatineGrams: 5,
    recommendedIds: [2, 0, 4] // Clear Whey Isolate, CBUM Pre, RAW Creatine
  },
  strength: {
    label: 'Max Power & Strength',
    icon: Shield,
    sub: 'Heavy neural drive, joint stability, and PR shattering',
    proteinMultiplier: 1.8,
    creatineGrams: 7,
    recommendedIds: [0, 5, 11] // CBUM Pre, Creapure Creatine, Inzer Lever Belt
  },
  endurance: {
    label: 'Engine & Recovery',
    icon: Activity,
    sub: 'High work capacity, rapid hydration and repair',
    proteinMultiplier: 1.6,
    creatineGrams: 3,
    recommendedIds: [2, 4, 1] // Clear Whey, RAW Creatine, Thavage
  }
}

export default function StackBuilder() {
  const { soundEnabled, addMultiple, applyCoupon } = useStore()
  const [goal, setGoal] = useState<GoalKey>('hypertrophy')
  const [weightKg, setWeightKg] = useState<number>(75)
  const [stimLevel, setStimLevel] = useState<'high' | 'med' | 'zero'>('high')
  const [added, setAdded] = useState(false)

  const activeGoal = GOALS[goal]
  const proteinTarget = Math.round(weightKg * activeGoal.proteinMultiplier)
  const hydrationTarget = (weightKg * 0.045).toFixed(1)

  // Assembled products
  const stackProducts: Product[] = activeGoal.recommendedIds
    .map(id => products[id])
    .filter(Boolean)

  const rawTotal = stackProducts.reduce((sum, p) => sum + p.p, 0)
  const bundleDiscountPercent = 15
  const bundleTotal = Math.round(rawTotal * (1 - bundleDiscountPercent / 100))
  const savings = rawTotal - bundleTotal

  const handleAddBundle = () => {
    if (soundEnabled) sound.playSuccess()
    addMultiple(stackProducts.map(p => p.id))
    applyCoupon('CHALK15', 15)
    setAdded(true)
    setTimeout(() => setAdded(false), 2400)
  }

  return (
    <section id="stack-builder" className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-8">
        <span className="eyebrow flex items-center gap-1.5">
          <Zap size={14} className="text-brand-500" /> Interactive AI Fuel Lab
        </span>
        <h2 className="h mt-1 text-3xl md:text-5xl">
          Custom <span className="neon">Stack Configurator</span>
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Dial in your body metrics, training goals, and stim tolerance to generate your bespoke supplement stack.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* CONFIGURATION CONTROLS */}
        <div className="space-y-6">
          {/* Goal Selector */}
          <div>
            <label className="text-xs uppercase tracking-wider text-brand-400 font-bold block mb-3">
              1. Select Primary Training Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(GOALS) as GoalKey[]).map(key => {
                const g = GOALS[key]
                const isSelected = goal === key
                const GoalIcon = g.icon
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (soundEnabled) sound.playClick()
                      setGoal(key)
                    }}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 shadow-neon'
                        : 'border-line bg-card hover:border-brand-500/50'
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                        isSelected
                          ? 'bg-brand-500 text-black shadow-neon'
                          : 'bg-elev text-brand-400 border border-line'
                      }`}
                    >
                      <GoalIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-head text-sm font-bold text-[var(--color-text)] flex items-center justify-between">
                        {g.label}
                        {isSelected && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{g.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bodyweight Metric Slider */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase tracking-wider text-brand-400 font-bold">
                2. Current Bodyweight:
              </label>
              <div className="font-head text-lg font-black text-[var(--color-text)]">
                <span className="neon">{weightKg}</span> KG{' '}
                <span className="text-xs font-normal text-[var(--color-text-subtle)]">({Math.round(weightKg * 2.20462)} lbs)</span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={120}
              step={1}
              value={weightKg}
              onChange={e => setWeightKg(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[11px] text-[var(--color-text-subtle)] mt-1">
              <span>50 kg</span>
              <span>85 kg</span>
              <span>120 kg</span>
            </div>

            {/* Calculated Biomarkers */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3 border-t border-line/60 pt-4">
              <div className="rounded-xl bg-elev p-2 sm:p-2.5 text-center">
                <span className="text-[9px] sm:text-[10px] uppercase text-[var(--color-text-subtle)] block truncate">Daily Protein</span>
                <b className="font-head text-sm sm:text-lg text-[var(--color-text)] font-extrabold">{proteinTarget}g</b>
              </div>
              <div className="rounded-xl bg-elev p-2 sm:p-2.5 text-center">
                <span className="text-[9px] sm:text-[10px] uppercase text-[var(--color-text-subtle)] block truncate">Creatine Dose</span>
                <b className="font-head text-sm sm:text-lg text-brand-400 font-extrabold">{activeGoal.creatineGrams}g</b>
              </div>
              <div className="rounded-xl bg-elev p-2 sm:p-2.5 text-center">
                <span className="text-[9px] sm:text-[10px] uppercase text-[var(--color-text-subtle)] block truncate">Hydration</span>
                <b className="font-head text-sm sm:text-lg text-[var(--color-text)] font-extrabold">{hydrationTarget}L</b>
              </div>
            </div>
          </div>

          {/* Stimulant Tolerance */}
          <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <label className="text-xs uppercase tracking-wider text-brand-400 font-bold block mb-3">
              3. Caffeine &amp; Stimulant Preference
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
              {[
                { id: 'high', label: 'High Stim', desc: '300-350mg' },
                { id: 'med', label: 'Moderate', desc: '150-200mg' },
                { id: 'zero', label: 'Pump Only', desc: 'Non-Stim' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (soundEnabled) sound.playClick()
                    setStimLevel(s.id as 'high' | 'med' | 'zero')
                  }}
                  className={`rounded-xl border p-2.5 sm:p-3 text-center transition ${
                    stimLevel === s.id
                      ? 'border-brand-500 bg-brand-500/15 text-[var(--color-text)] shadow-sm'
                      : 'border-line bg-elev text-[var(--color-text-muted)] hover:border-brand-500/50'
                  }`}
                >
                  <div className="font-head text-[11px] sm:text-xs font-bold truncate">{s.label}</div>
                  <div className="text-[9px] sm:text-[10px] text-[var(--color-text-subtle)] mt-0.5 truncate">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BESPOKE ASSEMBLED BUNDLE CARD */}
        <div className="flex flex-col justify-between rounded-3xl border border-brand-500/40 bg-card p-4 sm:p-6 shadow-xl relative overflow-hidden dark:bg-gradient-to-b dark:from-card dark:via-[#06240f]/40 dark:to-elev dark:shadow-neon">
          {/* Subtle glow badge */}
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <span className="rounded-full bg-brand-500/20 px-3 py-1 font-head text-[10px] font-bold text-brand-400 border border-brand-500/40 uppercase">
                Optimized Stack Bundle • -15% Off
              </span>
              <h3 className="h text-2xl text-[var(--color-text)] mt-2">
                {activeGoal.label} Stack
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--color-text-subtle)] line-through block">{peso(rawTotal)}</span>
              <b className="font-head text-3xl font-black text-brand-400">{peso(bundleTotal)}</b>
            </div>
          </div>

          {/* Stack item list */}
          <div className="my-5 space-y-3">
            {stackProducts.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 rounded-2xl border border-line bg-elev/70 p-3 hover:border-brand-500/50 transition dark:bg-black/40"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-card p-1.5 overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.t} className="h-full w-full object-contain" />
                  ) : (
                    <Package size={20} className="text-brand-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--color-text)] truncate">{p.t}</div>
                  <div className="text-[11px] text-[var(--color-text-subtle)]">{p.b} • {p.c}</div>
                </div>
                <div className="text-right font-head text-sm font-bold text-[var(--color-text)]">
                  {peso(p.p)}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Free perks bar */}
          <div className="mb-6 rounded-2xl bg-elev p-3 border border-brand-500/30 flex items-center justify-between text-xs dark:bg-black/60">
            <div className="flex items-center gap-2 text-brand-400 font-bold">
              <ShieldCheck size={16} /> Free Stainless Shaker Included
            </div>
            <div className="text-[var(--color-text-muted)]">
              Save <span className="text-brand-400 font-bold">{peso(savings)}</span>
            </div>
          </div>

          {/* 1-Click Load Entire Stack */}
          <button
            onClick={handleAddBundle}
            className={`btn w-full !py-3.5 flex items-center justify-center gap-2 text-center text-sm font-extrabold uppercase tracking-wider transition ${
              added ? '!bg-white !text-black shadow-neon' : ''
            }`}
          >
            {added ? (
              <>
                <Check size={18} /> Stack Loaded Into Cart!
              </>
            ) : (
              <>
                <Flame size={18} /> One-Click Add Full Stack ({peso(bundleTotal)})
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
