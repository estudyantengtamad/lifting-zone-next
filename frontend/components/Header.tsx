'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Search, ArrowRight, X, Menu, Heart, Volume2, VolumeX, MapPin } from 'lucide-react'
import { products, peso } from '../lib/data'
import { useStore, subtotal } from '../lib/store'
import { useAuthStore } from '../lib/authStore'
import { sound } from '../lib/audio'
import ThemeToggle from './ThemeToggle'
import AuthMenu from './AuthMenu'

const BASE_NAV_LINKS = [
  { id: '#intro', label: 'Intro' },
  { id: '#equipment', label: 'Equipment' },
  { id: '#story', label: 'Story' },
  { id: '#supplements', label: 'Supplements' },
  { id: '#inventory-admin', label: 'Inventory', adminOnly: true },
  { id: '#iron-lab', label: 'Iron Lab' }
]

export default function Header() {
  const {
    products,
    cart,
    wish,
    setOpen,
    wishOpen,
    setWishOpen,
    setCheckoutOpen,
    setQuickViewProduct,
    soundEnabled,
    toggleSound
  } = useStore()

  const { role } = useAuthStore()

  const [activeNav, setActiveNav] = useState('#intro')
  const [q, setQ] = useState('')
  const [d, setD] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  // Filter out admin-only nav links for non-admins
  const visibleNavLinks = BASE_NAV_LINKS.filter(link => !link.adminOnly || role === 'admin')

  useEffect(() => {
    const t = setTimeout(() => setD(q.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        document.getElementById('q')?.focus()
      }
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        setMobileSearchOpen(false)
      }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])

  const res = d
    ? products.filter(p => (p.t + p.b + p.c).toLowerCase().includes(d)).slice(0, 5)
    : []

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartSubtotal = subtotal(cart)

  const handleNavClick = (id: string) => {
    if (soundEnabled) sound.playClick()
    setActiveNav(id)
    setMobileMenuOpen(false)
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
    <header className="sticky top-0 z-50 border-b border-line bg-[var(--color-bg)]/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-4">
        {/* Brand Logo */}
        <a
          href="#intro"
          onClick={() => handleNavClick('#intro')}
          className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap font-head text-xs sm:text-sm font-black shrink-0 group"
        >
          <img
            src="/logo.png"
            alt="Lifting Zone Logo"
            className="h-8 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]"
          />
          <span className="text-[var(--color-text)] tracking-tight hidden xs:inline sm:inline">
            LIFTING <span className="neon font-solare italic font-bold">ZONE</span>
          </span>
        </a>

        {/* Desktop Sliding Dot Nav Links */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 ml-2 xl:ml-4 text-xs font-bold uppercase tracking-wider shrink-0">
          {visibleNavLinks.map(link => {
            const isActive = activeNav === link.id
            return (
              <a
                key={link.id}
                href={link.id}
                onClick={e => {
                  e.preventDefault()
                  handleNavClick(link.id)
                }}
                className={`relative flex items-center gap-1.5 py-1 transition duration-300 ${
                  isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-brand-500 scale-100 shadow-[0_0_8px_var(--color-brand-500)]' : 'bg-transparent scale-0'
                  }`}
                />
                <span className={isActive ? 'font-black text-brand-400' : 'font-medium'}>{link.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Interactive Search Bar — Responsive on desktop & mobile */}
        <div className="relative flex-1 min-w-[70px] sm:min-w-[140px] max-w-2xl mx-1 sm:mx-2">
          <Search size={14} className="absolute left-3 top-2.5 text-[var(--color-text-subtle)] pointer-events-none" />
          <input
            id="q"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-line bg-card py-1.5 sm:py-2 pl-8 sm:pl-9 pr-7 text-[11px] sm:text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition shadow-sm"
          />

          {q ? (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2.5 top-2 sm:top-2.5 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <span className="pointer-events-none absolute right-2.5 top-1.5 sm:top-2 hidden sm:inline-flex items-center rounded border border-line bg-elev/60 px-1 py-0.2 text-[9px] font-mono text-[var(--color-text-subtle)]">
              /
            </span>
          )}

          {/* Search Dropdown Results */}
          {d && (
            <div className="absolute left-0 right-0 top-10 sm:top-11 z-50 overflow-hidden rounded-2xl border border-brand-500/50 bg-card shadow-2xl">
              {res.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setQuickViewProduct(p)
                    setQ('')
                  }}
                  className="flex cursor-pointer items-center gap-3 p-2.5 sm:p-3 hover:bg-elev border-b border-line/40 last:border-0 transition"
                >
                  <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg bg-brand-700/30 text-base sm:text-lg shrink-0">
                    {p.e}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-[var(--color-text)] block truncate">{p.t}</span>
                    <small className="text-[10px] text-[var(--color-text-subtle)]">{p.b} • {p.c}</small>
                  </div>
                  <b className="font-head text-xs text-brand-400 shrink-0">{peso(p.p)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Icons Group */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Wishlist Trigger (Desktop) */}
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick()
              setWishOpen(true)
            }}
            className="hidden sm:flex relative items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-line bg-card text-[var(--color-text-muted)] hover:text-red-500 hover:border-brand-500/50 transition"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart size={15} className={wish.length > 0 ? 'text-red-500 fill-red-500' : ''} />
            {wish.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {wish.length}
              </span>
            )}
          </button>

          {/* Dark / Light / System Theme Toggle */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick()
              setOpen(true)
            }}
            className="shrink-0 relative flex items-center gap-1.5 sm:gap-2 rounded-full border border-line bg-card px-2.5 sm:px-3 py-1.5 text-[var(--color-text)] hover:border-brand-500 transition"
            title="Open Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={15} className="text-brand-400 shrink-0" />
            <span className="font-head text-[11px] sm:text-xs font-bold text-[var(--color-text)] hidden xs:inline sm:inline">
              {peso(cartSubtotal)}
            </span>
            {cartCount > 0 && (
              <span className="rounded-full bg-brand-500 px-1.5 text-[9px] font-black text-[var(--color-btn-text)] shadow-neon">
                {cartCount}
              </span>
            )}
          </button>

          {/* Google Auth Menu */}
          <div className="shrink-0">
            <AuthMenu />
          </div>

          {/* Desktop Solare Pill Checkout Button */}
          <div className="hidden xl:block shrink-0">
            <button
              onClick={() => {
                if (soundEnabled) sound.playClick()
                setCheckoutOpen(true)
              }}
              className="solare-pill-btn flex items-center gap-2.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition"
            >
              <span>Dispatch</span>
              <div className="relative grid h-5 w-5 place-items-center rounded-full bg-black text-white overflow-hidden">
                <ArrowRight size={12} className="btn-arrow-1 text-brand-400" />
                <ArrowRight size={12} className="btn-arrow-2 text-brand-400" />
              </div>
            </button>
          </div>

          {/* Mobile Navigation Menu Toggle Button (Hamburger / Close) */}
          <button
            id="mobile-menu-btn"
            onClick={() => {
              if (soundEnabled) sound.playClick()
              setMobileMenuOpen(!mobileMenuOpen)
            }}
            className="lg:hidden shrink-0 grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-[var(--color-text)] hover:border-brand-500 hover:text-brand-400 transition"
            aria-label="Toggle mobile menu"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER & EXPANDED MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-line bg-card/95 backdrop-blur-xl px-4 py-5 shadow-2xl animate-in slide-in-from-top-3 duration-200">
          {/* Quick Section Nav Links */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {visibleNavLinks.map(link => {
              const isActive = activeNav === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold uppercase tracking-wider transition ${
                    isActive
                      ? 'border-brand-500 bg-brand-500/15 text-brand-400 shadow-sm'
                      : 'border-line bg-elev/70 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-brand-500/40'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isActive ? 'bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]' : 'bg-line'
                    }`}
                  />
                  <span className="truncate">{link.label}</span>
                </button>
              )
            })}
          </div>

          {/* Utility Row: Sound toggle, Wishlist, Checkout */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line">
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={() => toggleSound()}
                className="flex items-center gap-1.5 rounded-full border border-line bg-elev px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-brand-500/40 transition"
                title={soundEnabled ? 'Mute Audio Effects' : 'Enable Audio Effects'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 size={13} className="text-brand-500" />
                    <span className="text-[11px] font-semibold">Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={13} className="text-[var(--color-text-subtle)]" />
                    <span className="text-[11px]">Muted</span>
                  </>
                )}
              </button>

              {/* Wishlist Link */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setWishOpen(true)
                }}
                className="flex items-center gap-1.5 rounded-full border border-line bg-elev px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-red-500 hover:border-brand-500/40 transition"
              >
                <Heart size={13} className={wish.length > 0 ? 'fill-red-500 text-red-500' : ''} />
                <span className="text-[11px] font-semibold">Saved ({wish.length})</span>
              </button>
            </div>

            {/* Mobile Dispatch Button */}
            <button
              onClick={() => {
                if (soundEnabled) sound.playClick()
                setMobileMenuOpen(false)
                setCheckoutOpen(true)
              }}
              className="solare-pill-btn flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-[var(--color-btn-text)] shadow-neon"
            >
              <span>Dispatch Order</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Location Badge */}
          <div className="mt-3 pt-2 text-[10px] text-[var(--color-text-subtle)] flex items-center gap-1.5">
            <MapPin size={12} className="text-brand-500 shrink-0" />
            <span>Salvador Calo St., Obrero, Butuan City • Same-Day Cargo</span>
          </div>
        </div>
      )}
    </header>
  )
}
