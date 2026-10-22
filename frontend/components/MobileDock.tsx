'use client'

import { Dumbbell, Zap, Flame, Heart, ShoppingCart } from 'lucide-react'
import { useStore } from '../lib/store'
import { sound } from '../lib/audio'

export default function MobileDock() {
  const { cart, wish, setOpen, setWishOpen, soundEnabled } = useStore()

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const wishCount = wish.length

  const handleScroll = (id: string) => {
    if (soundEnabled) sound.playClick()
    const el = document.querySelector(id)
    if (el) {
      if (typeof window !== 'undefined' && (window as any).__lz_lenis) {
        ;(window as any).__lz_lenis.scrollTo(el, { offset: -68, duration: 1.2 })
      } else {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-3 inset-x-3 z-40 mx-auto max-w-md rounded-full border border-brand-500/40 bg-[var(--color-bg)]/90 backdrop-blur-xl px-2 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_var(--color-shadow-neon)] transition-colors duration-200"
    >
      <div className="flex items-center justify-around">
        {/* Equipment */}
        <button
          onClick={() => handleScroll('#equipment')}
          className="flex flex-col items-center gap-0.5 rounded-full py-1 px-2.5 text-[var(--color-text-muted)] hover:text-brand-400 active:scale-95 transition"
        >
          <Dumbbell size={18} />
          <span className="font-head text-[9px] font-bold uppercase tracking-wider">Iron</span>
        </button>

        {/* Supplements */}
        <button
          onClick={() => handleScroll('#supplements')}
          className="flex flex-col items-center gap-0.5 rounded-full py-1 px-2.5 text-[var(--color-text-muted)] hover:text-brand-400 active:scale-95 transition"
        >
          <Zap size={18} />
          <span className="font-head text-[9px] font-bold uppercase tracking-wider">Fuel</span>
        </button>

        {/* Iron Lab / Plates */}
        <button
          onClick={() => handleScroll('#iron-lab')}
          className="flex flex-col items-center gap-0.5 rounded-full py-1 px-2.5 text-[var(--color-text-muted)] hover:text-brand-400 active:scale-95 transition"
        >
          <Flame size={18} />
          <span className="font-head text-[9px] font-bold uppercase tracking-wider">Lab</span>
        </button>

        {/* Wishlist */}
        <button
          onClick={() => {
            if (soundEnabled) sound.playClick()
            setWishOpen(true)
          }}
          className="relative flex flex-col items-center gap-0.5 rounded-full py-1 px-2.5 text-[var(--color-text-muted)] hover:text-red-500 active:scale-95 transition"
        >
          <Heart size={18} className={wishCount > 0 ? 'fill-red-500 text-red-500' : ''} />
          <span className="font-head text-[9px] font-bold uppercase tracking-wider">Saved</span>
          {wishCount > 0 && (
            <span className="absolute top-0 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
              {wishCount}
            </span>
          )}
        </button>

        {/* Cart */}
        <button
          onClick={() => {
            if (soundEnabled) sound.playClick()
            setOpen(true)
          }}
          className="relative flex flex-col items-center gap-0.5 rounded-full py-1 px-3 text-brand-400 active:scale-95 transition"
        >
          <div className="relative">
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[8px] font-black text-[var(--color-btn-text)] shadow-neon">
                {cartCount}
              </span>
            )}
          </div>
          <span className="font-head text-[9px] font-bold uppercase tracking-wider text-[var(--color-text)]">Cart</span>
        </button>
      </div>
    </nav>
  )
}
