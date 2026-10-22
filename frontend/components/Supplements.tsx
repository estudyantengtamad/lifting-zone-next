'use client'

import { useMemo, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Eye, Heart, ShoppingBag, Sparkles, Filter, X } from 'lucide-react'
import { peso, Product } from '../lib/data'
import { useStore } from '../lib/store'
import { sound } from '../lib/audio'

function Card({ p }: { p: Product }) {
  const { add, wishT, wish, setQuickViewProduct, soundEnabled } = useStore()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x)
  const sy = useSpring(y)
  const rY = useTransform(sx, [-0.5, 0.5], [-9, 9])
  const rX = useTransform(sy, [-0.5, 0.5], [9, -9])
  const off = p.o > p.p ? Math.round((1 - p.p / p.o) * 100) : 0
  const isWished = wish.includes(p.id)

  const handleAddToCart = () => {
    if (soundEnabled) sound.playSuccess()
    add(p.id)
  }

  const handleToggleWish = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (soundEnabled) sound.playClick()
    wishT(p.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 700 }}
      onMouseMove={e => {
        const b = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - b.left) / b.width - 0.5)
        y.set((e.clientY - b.top) / b.height - 0.5)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-brand-500 hover:shadow-neon"
    >
      {/* Product Visual & Quick Buttons */}
      <div
        onClick={() => setQuickViewProduct(p)}
        className="relative grid h-44 sm:h-48 cursor-pointer place-items-center overflow-hidden bg-gradient-to-br from-card via-elev to-brand-500/10 dark:via-[#06240f]/30 text-7xl select-none p-3"
      >
        {p.image ? (
          <img
            src={p.image}
            alt={p.t}
            className="max-h-full max-w-full object-contain filter drop-shadow transition duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="transition duration-300 group-hover:scale-125">{p.e}</span>
        )}

        {off > 0 && (
          <b className="absolute left-2.5 top-2.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-black text-[var(--color-btn-text)] shadow-neon">
            SAVE {off}%
          </b>
        )}

        {p.s === 0 ? (
          <b className="absolute bottom-2.5 left-2.5 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] text-white">
            Out of Stock
          </b>
        ) : (
          p.s <= 6 && (
            <b className="absolute bottom-2.5 left-2.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">
              Only {p.s} Left
            </b>
          )
        )}

        {/* Quick Actions — Always visible on touch screens, slide in on desktop hover */}
        <div
          onClick={e => e.stopPropagation()}
          className="absolute right-2.5 top-2.5 flex translate-x-0 sm:translate-x-3 flex-col gap-2 opacity-100 sm:opacity-0 transition duration-200 sm:group-hover:translate-x-0 sm:group-hover:opacity-100"
        >
          <button
            aria-label="Quick inspect"
            onClick={() => setQuickViewProduct(p)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-card/90 backdrop-blur-md text-[var(--color-text)] hover:border-brand-500 hover:text-brand-500 shadow-md transition"
            title="Inspect Specs & Authenticity"
          >
            <Eye size={15} />
          </button>
          <button
            aria-label="Wishlist"
            onClick={handleToggleWish}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-card/90 backdrop-blur-md text-[var(--color-text)] hover:border-brand-500 shadow-md transition"
            title="Save to Wishlist"
          >
            <Heart size={15} className={isWished ? 'fill-red-500 text-red-500' : ''} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <div className="flex items-center justify-between">
          <small className="font-head text-[10px] font-bold uppercase tracking-wider text-brand-500">
            {p.b}
          </small>
          <span className="text-[10px] text-[var(--color-text-subtle)] truncate max-w-[100px]">{p.c}</span>
        </div>

        <h3
          onClick={() => setQuickViewProduct(p)}
          className="cursor-pointer text-xs sm:text-sm font-semibold text-[var(--color-text)] hover:text-brand-500 transition line-clamp-1"
        >
          {p.t}
        </h3>

        <div className="text-xs text-amber-400 flex items-center gap-1">
          {'★'.repeat(Math.round(p.r))}{' '}
          <em className="not-italic text-[var(--color-text-subtle)] text-[11px] font-sans">
            {p.r} ({p.n})
          </em>
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <b className="font-head text-base sm:text-lg font-black text-[var(--color-text)]">{peso(p.p)}</b>
          {off > 0 && <s className="text-xs text-[var(--color-text-subtle)]">{peso(p.o)}</s>}
        </div>

        <div className="mt-auto pt-2 grid grid-cols-[1fr_auto] gap-2">
          <button
            disabled={p.s === 0}
            onClick={handleAddToCart}
            className="btn !py-2 !px-3 text-center !text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={14} /> {p.s === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
          <button
            onClick={() => setQuickViewProduct(p)}
            className="rounded-xl border border-line bg-elev px-2.5 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-brand-500/50 transition"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Supplements() {
  const { products, soundEnabled } = useStore()
  const [tab, setTab] = useState('all')
  const [cats, setC] = useState<string[]>([])
  const [max, setMax] = useState(100000)
  const [sort, setSort] = useState('f')
  const [pg, setPg] = useState(1)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const allCategories = useMemo(() => [...new Set(products.map(p => p.c))], [products])

  const filteredList = useMemo(() => {
    const list = products.filter(
      p =>
        (tab === 'all' || p.ty === tab) &&
        (!cats.length || cats.includes(p.c)) &&
        p.p <= max
    )

    const sorters: Record<string, (a: Product, b: Product) => number> = {
      pa: (a, b) => a.p - b.p,
      pd: (a, b) => b.p - a.p,
      r: (a, b) => b.r - a.r,
      n: (a, b) => b.id - a.id
    }

    return sorters[sort] ? [...list].sort(sorters[sort]) : list
  }, [tab, cats, max, sort, products])

  const pageSize = 8
  const pages = Math.max(1, Math.ceil(filteredList.length / pageSize))
  const reset = () => setPg(1)

  const activeFiltersCount = cats.length + (max < 100000 ? 1 : 0)

  return (
    <section id="supplements" className="mx-auto max-w-7xl px-4 py-14 text-[var(--color-text)]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <Sparkles size={13} className="text-brand-500" /> Sports Nutrition &amp; Gym Equipment
          </span>
          <h2 className="h text-2xl sm:text-3xl md:text-5xl mt-1 text-[var(--color-text)]">
            The <span className="neon">Supplements</span> &amp; Equipment
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-muted)]">
            Authentic tamper-sealed supplements and 11-gauge heavy steel equipment in Butuan City.
          </p>
        </div>

        {/* Division Tab Switcher */}
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'All Products'],
            ['S', '⚡ Supplements'],
            ['E', '🏗️ Heavy Equipment']
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => {
                if (soundEnabled) sound.playClick()
                setTab(k)
                reset()
              }}
              className={`rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 font-head text-[11px] sm:text-xs font-bold uppercase transition ${
                tab === k
                  ? 'border-brand-500 bg-brand-500 text-[var(--color-btn-text)] shadow-neon'
                  : 'border-line bg-card text-[var(--color-text-muted)] hover:border-brand-500/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE ONLY: Filter & Refine Toggle Banner */}
      <div className="md:hidden mb-4 flex items-center justify-between gap-2 rounded-2xl border border-line bg-card p-3 shadow-sm">
        <button
          onClick={() => {
            if (soundEnabled) sound.playClick()
            setMobileFilterOpen(!mobileFilterOpen)
          }}
          className="flex items-center gap-2 rounded-xl bg-elev px-3.5 py-2 text-xs font-bold text-[var(--color-text)] border border-line hover:border-brand-500/50 transition"
        >
          <Filter size={14} className="text-brand-500" />
          <span>{mobileFilterOpen ? 'Close Filters' : 'Filter & Refine'}</span>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-brand-500 px-1.5 text-[9px] font-black text-[var(--color-btn-text)]">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setC([])
                setMax(100000)
                reset()
              }}
              className="text-xs text-brand-400 font-bold hover:underline"
            >
              Reset
            </button>
          )}
          <span className="text-[11px] text-[var(--color-text-subtle)] font-mono">
            {filteredList.length} items
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Interactive Filters Aside — Collapsible on mobile, sticky on desktop */}
        <aside
          className={`h-fit rounded-2xl border border-line bg-card p-5 md:sticky md:top-24 space-y-5 transition-all ${
            mobileFilterOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line pb-3 md:hidden">
            <span className="font-head text-xs font-bold uppercase text-[var(--color-text)]">Filters</span>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <h4 className="eyebrow mb-3">Categories</h4>
            <div className="space-y-1.5 max-h-56 md:max-h-none overflow-y-auto pr-1">
              {allCategories.map(c => {
                const checked = cats.includes(c)
                return (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      className="accent-brand-500 h-4 w-4 rounded"
                      onChange={e => {
                        setC(e.target.checked ? [...cats, c] : cats.filter(x => x !== c))
                        reset()
                      }}
                    />
                    <span className="truncate">{c}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="border-t border-line/60 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="eyebrow">Price Cap</h4>
              <b className="font-head text-xs text-brand-400">{peso(max)}</b>
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={max}
              onChange={e => {
                setMax(+e.target.value)
                reset()
              }}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-[var(--color-text-subtle)] mt-1 font-mono">
              <span>₱1k</span>
              <span>₱50k</span>
              <span>₱100k</span>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setC([])
                setMax(100000)
                reset()
              }}
              className="text-xs text-brand-400 hover:underline block w-full text-center font-bold"
            >
              Reset Filters
            </button>
          )}
        </aside>

        {/* Catalog Grid Area */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <span>
              Showing <b className="text-[var(--color-text)]">{filteredList.length}</b> verified items
            </span>
            <div className="flex items-center gap-2">
              <span>Sort:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="rounded-xl border border-line bg-card px-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-brand-500"
              >
                <option value="f">Featured Highlights</option>
                <option value="pa">Price: Low to High</option>
                <option value="pd">Price: High to Low</option>
                <option value="r">Highest Rated First</option>
                <option value="n">Newest Releases</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {filteredList.slice((pg - 1) * pageSize, pg * pageSize).map(p => (
              <Card key={p.id} p={p} />
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPg(i + 1)}
                  className={`h-9 w-9 rounded-xl border font-head text-xs font-bold transition ${pg === i + 1
                      ? 'border-brand-500 bg-brand-500 text-[var(--color-btn-text)] shadow-neon'
                      : 'border-line bg-card text-[var(--color-text-muted)] hover:border-brand-500/50 hover:text-[var(--color-text)]'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
