'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Trash2, X, ArrowRight, ShieldCheck, Tag } from 'lucide-react'
import { products, peso } from '../lib/data'
import { useStore, subtotal, total } from '../lib/store'
import { sound } from '../lib/audio'

export default function Cart() {
  const {
    cart,
    open,
    setOpen,
    qty,
    toast,
    coupon,
    removeCoupon,
    setCheckoutOpen,
    soundEnabled
  } = useStore()

  const sub = subtotal(cart)
  const grandTotal = total(cart, coupon)
  const hasItems = Object.keys(cart).length > 0
  const freeShippingThreshold = 3000
  const diff = freeShippingThreshold - grandTotal

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => useStore.setState({ toast: '' }), 2400)
    return () => clearTimeout(id)
  }, [toast])

  const handleCheckoutClick = () => {
    if (soundEnabled) sound.playClick()
    setOpen(false)
    setCheckoutOpen(true)
  }

  const handleQtyChange = (id: number, delta: number) => {
    if (soundEnabled) sound.playClick()
    qty(id, delta)
  }

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-[150] flex items-center gap-2 rounded-full border border-brand-500 bg-elev/95 px-5 py-2.5 text-xs font-bold text-white shadow-neon backdrop-blur-md max-w-[90vw] text-center"
          >
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse shrink-0" />
            <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
            />

            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed bottom-0 right-0 top-0 z-[70] flex w-[min(420px,100%)] flex-col border-l border-brand-500/40 bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line p-4">
                <div className="flex items-center gap-2">
                  <h3 className="h text-base text-[var(--color-text)]">Your Cart</h3>
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-400">
                    {Object.values(cart).reduce((a, b) => a + b, 0)} items
                  </span>
                </div>
                <button
                  aria-label="Close cart"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-elev text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Free Shipping Progress */}
              <div className="border-b border-line/60 bg-elev/50 p-4 text-xs">
                {diff <= 0 ? (
                  <div className="flex items-center gap-1.5 text-brand-400 font-bold">
                    <ShieldCheck size={16} /> 🎉 You unlocked FREE Express shipping in Butuan!
                  </div>
                ) : (
                  <div className="text-[var(--color-text-muted)]">
                    Add <b className="neon font-head">{peso(diff)}</b> more for Free Express Shipping!
                  </div>
                )}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-card border border-line">
                  <motion.div
                    animate={{ width: `${Math.min(100, (grandTotal / freeShippingThreshold) * 100)}%` }}
                    className="h-full bg-brand-500 shadow-neon"
                  />
                </div>
              </div>

              {/* Item List */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.entries(cart).map(([idStr, q]) => {
                  const p = products[+idStr]
                  if (!p) return null
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-elev p-3.5"
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-700/30 text-2xl overflow-hidden p-1 shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.t} className="h-full w-full object-contain" />
                        ) : (
                          p.e
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-brand-400 block">{p.b}</span>
                        <h4 className="text-xs font-bold text-[var(--color-text)] truncate">{p.t}</h4>
                        <div className="font-head text-xs font-black text-[var(--color-text)]">{peso(p.p * q)}</div>

                        {/* Quantity Controls */}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleQtyChange(p.id, -1)}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-line border border-line text-[var(--color-text)] transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-[var(--color-text)]">{q}</span>
                          <button
                            onClick={() => handleQtyChange(p.id, 1)}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-line border border-line text-[var(--color-text)] transition"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQtyChange(p.id, -q)}
                        className="rounded-lg p-2 text-[var(--color-text-subtle)] hover:text-red-500 transition"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}

                {!hasItems && (
                  <div className="py-16 text-center text-[var(--color-text-muted)] text-sm">
                    <p>Your cart is empty.</p>
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1">Explore our supplements or machines below.</p>
                  </div>
                )}
              </div>

              {/* Footer Checkout Area */}
              {hasItems && (
                <div className="border-t border-line p-4 pb-7 sm:pb-4 space-y-3 bg-card">
                  {coupon && (
                    <div className="flex items-center justify-between text-xs text-brand-400">
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> Coupon ({coupon.code})
                      </span>
                      <div className="flex items-center gap-2">
                        <span>-{coupon.percent}%</span>
                        <button onClick={removeCoupon} className="text-red-400 hover:underline">
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Subtotal</span>
                    <span>{peso(sub)}</span>
                  </div>

                  <div className="flex justify-between items-baseline border-t border-line/60 pt-2">
                    <span className="font-head text-sm font-bold text-[var(--color-text)]">Total</span>
                    <b className="font-head text-2xl font-black text-brand-400">{peso(grandTotal)}</b>
                  </div>

                  <button
                    onClick={handleCheckoutClick}
                    className="btn w-full !py-3 flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-wider"
                  >
                    Proceed to Dispatch <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
