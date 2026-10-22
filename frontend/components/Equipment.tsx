'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, ShieldCheck, ShoppingBag, Eye, Check, ChevronRight, Sparkles, Layers, Sliders } from 'lucide-react'
import { products, peso, Product } from '../lib/data'
import { useStore } from '../lib/store'
import { sound } from '../lib/audio'

export default function Equipment() {
  const { add, setQuickViewProduct, soundEnabled, cart } = useStore()

  // Filter only equipment products (ty === 'E')
  const equipmentProducts = products.filter(p => p.ty === 'E')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [selectedFlavorIdx, setSelectedFlavorIdx] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Machines' | 'Free Weights'>('all')

  const activeProduct = equipmentProducts[selectedIdx] || equipmentProducts[0]

  const handleSelectProduct = (idx: number) => {
    if (soundEnabled) sound.playClick()
    setSelectedIdx(idx)
    setSelectedFlavorIdx(0)
  }

  const handleAddToCart = (product: Product) => {
    if (soundEnabled) sound.playSuccess()
    add(product.id)
  }

  const filteredGallery = equipmentProducts.filter(p => {
    if (categoryFilter === 'all') return true
    if (categoryFilter === 'Machines') return p.c.includes('Machines')
    if (categoryFilter === 'Free Weights') return p.c.includes('Free Weights')
    return true
  })

  return (
    <section id="weights" className="relative mx-auto max-w-7xl px-4 py-24 text-[var(--color-text)] transition-colors duration-200">
      {/* Anchor alias for #equipment */}
      <div id="equipment" className="absolute -top-20 left-0" />

      {/* Main Container with Solare Dark Forest Gradient & Neon Highlights */}
      <div className="rounded-3xl md:rounded-[3rem] border border-line bg-card p-4 sm:p-8 md:p-14 shadow-xl relative overflow-hidden dark:border-[#1a3822] dark:bg-gradient-to-b dark:from-[#07120a] dark:via-[#050806] dark:to-[#0a1f11] dark:shadow-2xl">
        {/* Subtle radial neon glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-10 border-b border-line dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-400">
              <span className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]" />
              Commercial Iron &amp; Fitout Equipment
            </div>
            <h2 className="font-solare text-2xl sm:text-5xl md:text-6xl text-[var(--color-text)] tracking-[-0.04em] mt-2 font-normal">
              Heavy Weights &amp; <span className="italic font-normal text-brand-500">Equipments</span>
            </h2>
          </div>
          <div className="max-w-md text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
            <p>
              Heavy commercial 11-gauge steel machines, competition-calibrated cast plates, and Olympic Cerakote barbells available for nationwide cargo or immediate pickup at Salvador Calo St., Butuan City.
            </p>
          </div>
        </div>

        {/* Interactive Equipment Explorer Showcase */}
        <div className="relative z-10 mt-6 sm:mt-10 grid gap-6 lg:gap-8 lg:grid-cols-[360px_1fr] items-start">
          {/* MOBILE ONLY: Horizontal swipeable equipment pill cards */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
                Swipe &amp; Select Heavy Iron ({selectedIdx + 1}/{equipmentProducts.length}):
              </span>
              <span className="text-[10px] text-brand-400 font-mono">
                ← Swipe →
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
              {equipmentProducts.map((item, idx) => {
                const isSelected = selectedIdx === idx
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectProduct(idx)}
                    className={`shrink-0 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition border text-left ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/15 text-[var(--color-text)] shadow-sm'
                        : 'border-line bg-elev/60 text-[var(--color-text-muted)] hover:border-brand-500/40'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 transition-all ${
                        isSelected ? 'bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]' : 'bg-line'
                      }`}
                    />
                    {item.image ? (
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-card border border-line p-0.5 flex items-center justify-center overflow-hidden">
                        <img src={item.image} alt={item.t} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-base shrink-0">{item.e}</span>
                    )}
                    <div className="min-w-0 pr-1">
                      <span className="font-head text-xs font-bold block max-w-[120px] truncate text-[var(--color-text)]">
                        {item.t}
                      </span>
                      <span className="font-mono text-[10px] text-brand-400 font-bold block">
                        {peso(item.p)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* DESKTOP ONLY: Vertical Equipment Selector */}
          <div className="hidden lg:block space-y-2">
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-line dark:border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
                Select Heavy Iron:
              </span>
              <span className="text-[10px] text-brand-400 font-mono">
                {selectedIdx + 1} / {equipmentProducts.length} Items
              </span>
            </div>

            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {equipmentProducts.map((item, idx) => {
                const isSelected = selectedIdx === idx
                const inCart = (cart[item.id] || 0) > 0
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectProduct(idx)}
                    className={`group relative flex w-full items-center justify-between rounded-2xl py-3 px-4 text-left transition duration-300 border ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-[var(--color-text)] shadow-sm dark:bg-gradient-to-r dark:from-white/15 dark:to-[#16c45a]/10 dark:text-white dark:border-[#16c45a]/60 dark:shadow-neon'
                        : 'border-line bg-elev/60 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-card hover:border-brand-500/40 dark:border-white/5 dark:bg-black/40 dark:text-white/70 dark:hover:text-white dark:hover:border-white/20 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Solare gliding indicator dot in Neon Green */}
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 shrink-0 ${
                          isSelected ? 'bg-brand-500 scale-100 shadow-[0_0_10px_var(--color-brand-500)]' : 'bg-transparent scale-0'
                        }`}
                      />
                      {item.image ? (
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-card border border-line p-1 flex items-center justify-center overflow-hidden dark:bg-black/80 dark:border-white/10">
                          <img src={item.image} alt={item.t} className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <span className="text-xl shrink-0">{item.e}</span>
                      )}
                      <div className="min-w-0">
                        <span className="font-head text-xs md:text-sm font-bold block truncate text-[var(--color-text)] dark:text-white">
                          {item.t}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-subtle)] block font-mono">
                          {item.b} • {item.c}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-head text-xs font-black text-brand-400 block">
                        {peso(item.p)}
                      </span>
                      {inCart && (
                        <span className="text-[9px] text-brand-500 font-bold block">
                          In Cart ({cart[item.id]})
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Solare Architectural Stage & Spec Sheet */}
          <AnimatePresence mode="wait">
            {activeProduct && (
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col rounded-3xl md:rounded-[2.5rem] border border-line bg-elev/60 p-4 sm:p-8 md:p-10 shadow-sm relative overflow-hidden dark:border-[#1a3822] dark:bg-gradient-to-b dark:from-[#0a180e] dark:via-[#050806] dark:to-[#0c2213] dark:shadow-inner"
              >
                {/* Product Badge Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line dark:border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand-500 px-3 py-1 font-head text-[10px] font-black uppercase tracking-wider text-[var(--color-btn-text)] shadow-neon">
                      {activeProduct.b}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] font-head tracking-wider uppercase">
                      {activeProduct.c}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400">★ {activeProduct.r.toFixed(1)}</span>
                    <span className="text-[11px] text-[var(--color-text-subtle)]">({activeProduct.n} reviews)</span>
                  </div>
                </div>

                {/* Hero Showcase Title & Graphic */}
                <div className="my-6 grid gap-6 md:grid-cols-[1fr_260px] items-center">
                  <div>
                    <h3 className="font-solare text-3xl sm:text-4xl md:text-5xl text-[var(--color-text)] font-normal leading-[1.08] tracking-tight">
                      {activeProduct.t}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed font-light">
                      {activeProduct.desc}
                    </p>
                  </div>

                  {/* High Resolution Product Visual */}
                  <div className="flex justify-center">
                    {activeProduct.image ? (
                      <div className="relative h-60 w-60 sm:h-64 sm:w-64 rounded-3xl border border-brand-500/50 bg-gradient-to-br from-card via-elev to-brand-500/10 p-4 shadow-sm flex items-center justify-center overflow-hidden group dark:from-white/10 dark:via-black dark:to-[#06240f]/70 dark:shadow-neon">
                        <img
                          src={activeProduct.image}
                          alt={activeProduct.t}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] transition-all duration-500 group-hover:scale-105"
                        />
                        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-mono text-brand-400 border border-line shadow-sm dark:bg-black/80 dark:border-white/10">
                          HD Heavy Steel
                        </span>
                      </div>
                    ) : (
                      <div className="grid h-48 w-48 place-items-center rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-500/20 via-card to-elev text-7xl shadow-sm select-none dark:via-black dark:to-[#06240f]/50 dark:shadow-neon">
                        <span className="hover:scale-110 transition duration-300">{activeProduct.e}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Commercial Engineering Specs */}
                <div className="my-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 block mb-2.5">
                    Engineering Specifications:
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeProduct.specs.map((spec, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-2.5 rounded-xl border border-line bg-card p-2.5 text-xs text-[var(--color-text)] dark:border-white/10 dark:bg-black/50 dark:text-white/90"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                        <span className="font-mono text-[11px]">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colorway / Finish Variation Selector */}
                {activeProduct.flavors && activeProduct.flavors.length > 0 && (
                  <div className="my-4 border-t border-line dark:border-white/10 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)] block mb-2">
                      Available Finish / Coating:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeProduct.flavors.map((flavor, fIdx) => (
                        <button
                          key={flavor}
                          onClick={() => {
                            if (soundEnabled) sound.playClick()
                            setSelectedFlavorIdx(fIdx)
                          }}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-head font-bold transition border ${
                            selectedFlavorIdx === fIdx
                              ? 'border-brand-500 bg-brand-500 text-[var(--color-btn-text)] shadow-neon'
                              : 'border-line bg-card text-[var(--color-text-muted)] hover:border-brand-500/50 dark:border-white/15 dark:bg-black/60 dark:text-white/70 dark:hover:border-white/40'
                          }`}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price, Stock & Dispatch Controls */}
                <div className="mt-6 border-t border-line dark:border-white/10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-solare text-3xl sm:text-4xl font-normal text-brand-400">
                        {peso(activeProduct.p)}
                      </span>
                      {activeProduct.o > activeProduct.p && (
                        <span className="text-sm line-through text-[var(--color-text-subtle)] font-mono">
                          {peso(activeProduct.o)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--color-text-subtle)] block mt-1">
                      {activeProduct.s > 0 ? (
                        <span className="text-brand-500 font-bold">● In Stock ({activeProduct.s} Units Available in Butuan)</span>
                      ) : (
                        <span className="text-red-500 font-bold">● Out of Stock (Special Order Available)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setQuickViewProduct(activeProduct)}
                      className="rounded-full border border-line bg-card px-4 py-3 text-xs font-bold text-[var(--color-text)] hover:border-brand-500/50 hover:bg-elev transition flex items-center justify-center gap-2 dark:border-white/20 dark:bg-black/60 dark:text-white dark:hover:border-white/50 dark:hover:bg-white/10"
                      title="Quick Specs Modal"
                    >
                      <Eye size={14} />
                      <span>Inspect Specs</span>
                    </button>

                    <button
                      onClick={() => handleAddToCart(activeProduct)}
                      className="solare-pill-btn flex items-center justify-center gap-2.5 rounded-full bg-brand-500 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition"
                    >
                      <ShoppingBag size={14} />
                      <span>Add Equipment to Cart</span>
                    </button>
                  </div>
                </div>

                {/* Authenticity Certificate Footer */}
                <div className="mt-6 pt-4 border-t border-line dark:border-white/5 flex items-center gap-2 text-[11px] text-[var(--color-text-subtle)]">
                  <ShieldCheck size={14} className="text-brand-500 shrink-0" />
                  <span className="truncate">{activeProduct.authenticity}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Secondary Grid: All Commercial Equipment at a Glance */}
        <div className="relative z-10 mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-line dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="eyebrow">Complete Heavy Inventory</span>
              <h3 className="font-solare text-2xl md:text-3xl text-[var(--color-text)] mt-1">
                Browse All <span className="neon">Heavy Iron</span> Equipments
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full">
              {(['all', 'Machines', 'Free Weights'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    if (soundEnabled) sound.playClick()
                    setCategoryFilter(cat)
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-head font-bold uppercase transition whitespace-nowrap border shrink-0 ${
                    categoryFilter === cat
                      ? 'border-brand-500 bg-brand-500 text-[var(--color-btn-text)] shadow-neon'
                      : 'border-line bg-card text-[var(--color-text-muted)] hover:border-brand-500/50 dark:border-white/15 dark:bg-black/60 dark:text-white/70 dark:hover:border-white/40'
                  }`}
                >
                  {cat === 'all' ? 'All Equipment' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredGallery.map(eq => (
              <div
                key={eq.id}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-elev/60 p-4 transition-all hover:border-brand-500/60 hover:shadow-neon dark:border-white/10 dark:bg-black/60"
              >
                <div>
                  <div
                    onClick={() => setQuickViewProduct(eq)}
                    className="relative grid h-44 cursor-pointer place-items-center rounded-xl bg-gradient-to-br from-card to-brand-500/10 p-3 overflow-hidden select-none border border-line group-hover:border-brand-500/40 transition dark:from-white/5 dark:to-[#06240f]/40 dark:border-white/5"
                  >
                    {eq.image ? (
                      <img
                        src={eq.image}
                        alt={eq.t}
                        className="max-h-full max-w-full object-contain filter drop-shadow transition duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-5xl transition duration-300 group-hover:scale-125">{eq.e}</span>
                    )}
                    <span className="absolute top-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-mono font-bold text-brand-400 border border-line shadow-sm dark:bg-black/80 dark:border-white/10">
                      {eq.b}
                    </span>
                  </div>

                  <h4
                    onClick={() => setQuickViewProduct(eq)}
                    className="font-head text-sm font-bold text-[var(--color-text)] mt-3 hover:text-brand-500 cursor-pointer truncate dark:text-white"
                  >
                    {eq.t}
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-subtle)] line-clamp-2 mt-1">
                    {eq.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line dark:border-white/10 flex items-center justify-between">
                  <span className="font-head text-sm font-black text-brand-400">
                    {peso(eq.p)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(eq)}
                    className="rounded-full bg-brand-500 p-2 text-[var(--color-btn-text)] hover:bg-brand-400 shadow-neon transition"
                    title="Add to Cart"
                  >
                    <ShoppingBag size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
