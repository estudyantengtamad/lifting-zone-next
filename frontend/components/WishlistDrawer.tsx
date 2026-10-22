'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { products, peso } from '../lib/data'
import { sound } from '../lib/audio'

export default function WishlistDrawer() {
  const { wishOpen, setWishOpen, wish, wishT, add, soundEnabled } = useStore()

  const wishProducts = wish.map(id => products[id]).filter(Boolean)

  const handleAddAll = () => {
    if (soundEnabled) sound.playSuccess()
    wishProducts.forEach(p => add(p.id))
    setWishOpen(false)
  }

  return (
    <AnimatePresence>
      {wishOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWishOpen(false)}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 right-0 top-0 z-[70] flex w-[min(420px,100%)] flex-col border-l border-brand-500/40 bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line p-4">
              <div className="flex items-center gap-2">
                <Heart size={20} className="fill-red-500 text-red-500" />
                <h3 className="h text-base text-[var(--color-text)]">Saved Wishlist ({wish.length})</h3>
              </div>
              <button
                aria-label="Close Wishlist"
                onClick={() => setWishOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-elev text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 space-y-3">
              {wishProducts.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-elev p-3.5 hover:border-brand-500/50 transition"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-700/30 text-2xl overflow-hidden p-1">
                    {p.image ? (
                      <img src={p.image} alt={p.t} className="h-full w-full object-contain" />
                    ) : (
                      p.e
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-brand-400 block">{p.b}</span>
                    <h4 className="text-xs font-bold text-[var(--color-text)] truncate">{p.t}</h4>
                    <span className="font-head text-xs font-black text-[var(--color-text)]">{peso(p.p)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (soundEnabled) sound.playSuccess()
                        add(p.id)
                      }}
                      className="rounded-lg bg-brand-500 p-2 text-[var(--color-btn-text)] hover:bg-brand-400 shadow-neon"
                      title="Add to cart"
                      aria-label="Add to cart"
                    >
                      <ShoppingBag size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (soundEnabled) sound.playClick()
                        wishT(p.id)
                      }}
                      className="rounded-lg p-2 text-[var(--color-text-subtle)] hover:text-red-500"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {!wishProducts.length && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-elev text-[var(--color-text-subtle)] mb-3">
                    <Heart size={32} />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">No saved items yet.</p>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1 max-w-xs">
                    Click the heart icon on any supplement or gym equipment to save it for your next cycle.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {wishProducts.length > 0 && (
              <div className="border-t border-line p-4 pb-7 sm:pb-4 space-y-2">
                <button
                  onClick={handleAddAll}
                  className="btn w-full !py-3 flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-wider"
                >
                  Move All ({wishProducts.length}) to Cart <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
