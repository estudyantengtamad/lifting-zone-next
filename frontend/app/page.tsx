'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll } from 'framer-motion'
import { ArrowUp, MapPin, ShieldCheck, Dumbbell } from 'lucide-react'
import DotField from '../components/DotField'
import Ticker from '../components/Ticker'
import Header from '../components/Header'
import IntroHero from '../components/IntroHero'
import Equipment from '../components/Equipment'
import BrandStory from '../components/BrandStory'
import Supplements from '../components/Supplements'
import InventoryManager from '../components/InventoryManager'
import StackBuilder from '../components/StackBuilder'
import BarbellCalculator from '../components/BarbellCalculator'
import ScratchDiscount from '../components/ScratchDiscount'
import QuickViewModal from '../components/QuickViewModal'
import CheckoutModal from '../components/CheckoutModal'
import Cart from '../components/Cart'
import AdminGate from '../components/AdminGate'
import MobileDock from '../components/MobileDock'

function Flash() {
  const [t, setT] = useState(0)

  useEffect(() => {
    const end = Date.now() + 3.2 * 864e5
    const f = () => setT(Math.max(0, end - Date.now()))
    f()
    const i = setInterval(f, 1000)
    return () => clearInterval(i)
  }, [])

  const s = Math.floor(t / 1000)
  const u: [string, number][] = [
    ['Days', Math.floor(s / 86400)],
    ['Hours', Math.floor((s % 86400) / 3600)],
    ['Minutes', Math.floor((s % 3600) / 60)],
    ['Seconds', s % 60]
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl md:rounded-[3rem] border border-brand-500/50 bg-card p-4 sm:p-8 md:p-14 text-center shadow-neon relative overflow-hidden transition-colors"
      >
        <div className="flex justify-center mb-3">
          <span className="rounded-full bg-brand-500 px-3.5 sm:px-4 py-1 font-head text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[var(--color-btn-text)] shadow-neon">
            LIMITED TIME FLASH DROP
          </span>
        </div>

        <h2 className="font-solare text-2xl sm:text-4xl md:text-6xl text-[var(--color-text)] tracking-tight my-3 sm:my-4">
          Midnight Muscle Flash Sale — <span className="neon italic font-normal">25% off</span>
        </h2>
        <p className="mx-auto max-w-xl text-xs md:text-sm text-[var(--color-text-muted)] px-2">
          Direct USA &amp; UK imports on flash markdown. Same-day delivery across Butuan City or nationwide doorstep cargo.
        </p>

        <div className="my-6 sm:my-8 flex flex-wrap justify-center gap-2 sm:gap-3">
          {u.map(([l, v]) => (
            <div
              key={l}
              className="min-w-[68px] sm:min-w-[84px] rounded-2xl border border-line bg-elev p-2 sm:p-3 shadow-inner"
            >
              <b className="block font-head text-2xl sm:text-3xl font-black text-[var(--color-text)]">
                {String(v).padStart(2, '0')}
              </b>
              <small className="text-[9px] sm:text-[10px] tracking-widest font-head font-bold text-brand-400">
                {l.toUpperCase()}
              </small>
            </div>
          ))}
        </div>

        {/* Embedded Interactive Scratch Card */}
        <ScratchDiscount />

        <div className="mt-6 flex justify-center">
          <a
            href="#supplements"
            className="solare-pill-btn flex items-center gap-2 sm:gap-3 rounded-full bg-brand-500 px-6 sm:px-8 py-3 sm:py-3.5 text-xs font-bold text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition"
          >
            <span>Shop Flash Deals in Supplements</span>
            <span className="font-bold">→</span>
          </a>
        </div>
      </motion.div>
    </section>
  )
}

export default function Page() {
  const { scrollYProgress } = useScroll()
  const [top, setTop] = useState(false)

  useEffect(() => {
    const f = () => setTop(window.scrollY > 600)
    window.addEventListener('scroll', f)
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <main className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-brand-500 selection:text-[var(--color-btn-text)] transition-colors duration-200">
      <DotField />

      {/* Neon green scroll progress indicator */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed left-0 top-0 z-[95] h-[3px] w-full origin-left bg-brand-500 shadow-neon"
      />

      <Ticker />
      <Header />

      {/* 1. 3D Perspective Scroll & Portal Hero */}
      <div id="intro">
        <IntroHero />
      </div>

      {/* 2. Commercial Heavy Iron & Equipment We Sell */}
      <Equipment />

      {/* 3. Brand Story Chapter Monograph with Arch Reveal */}
      <BrandStory />

      {/* 4. The Core Supplements & Equipment Catalog */}
      <Supplements />

      {/* 6. Live Supabase CRUD Inventory & SKU Management Engine (Admin Only) */}
      <AdminGate>
        <InventoryManager />
      </AdminGate>

      {/* 7. Interactive AI Fuel Lab & Stack Configurator */}
      <StackBuilder />

      {/* 8. Interactive Barbell Plate Math & 1RM Lab */}
      <BarbellCalculator />

      {/* 9. Midnight Flash & Secret Chalk Scratch Voucher */}
      <Flash />

      {/* Interactive Modals & Drawers */}
      <QuickViewModal />
      <Cart />
      <CheckoutModal />
      <MobileDock />

      {/* Footer */}
      <footer className="mt-16 border-t border-line bg-card/90 px-4 py-14 pb-24 md:pb-14 text-sm text-[var(--color-text-muted)] transition-colors">
        <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-3">
          <div>
            <b className="font-head text-lg text-[var(--color-text)] flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Lifting Zone Logo"
                className="h-8 w-auto object-contain"
              />
              LIFTING <span className="font-solare italic text-brand-400 font-bold">ZONE</span>
            </b>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              Where high-end architectural editorial typography meets raw commercial gym iron and verifiable sports nutrition.
            </p>
          </div>

          <div>
            <span className="eyebrow block mb-2 text-brand-400">Location &amp; Dispatch</span>
            <p className="flex items-center gap-2 text-xs text-[var(--color-text)]">
              <MapPin size={14} className="text-brand-500" /> Salvador Calo St., Obrero, Butuan City, Agusan del Norte
            </p>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1">Open Daily: 8:00 AM – 9:00 PM</p>
          </div>

          <div>
            <span className="eyebrow block mb-2 text-brand-400">Verified Channels</span>
            <p className="text-xs text-[var(--color-text)] flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand-500" /> GCash · Maya · PayMongo QR Ph · COD · Cards
            </p>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1">
              Tamper-evident verification certified across all active lots.
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      {top && (
        <button
          aria-label="Back to top"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).__lz_lenis) {
              ;(window as any).__lz_lenis.scrollTo(0, { duration: 1.4 })
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
          className="fixed bottom-20 md:bottom-5 right-4 md:right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-brand-500 text-[var(--color-btn-text)] shadow-neon transition hover:scale-110 active:scale-95"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </main>
  )
}
