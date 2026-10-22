'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogIn, LogOut, Shield, ShoppingBag, ChevronDown, Loader2 } from 'lucide-react'
import { useAuthStore } from '../lib/authStore'

export default function AuthMenu() {
  const { user, profile, role, loading, initialized, signInWithGoogle, signOut, init } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    init()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const authErr = params.get('auth_error')
      if (authErr) {
        console.warn('Authentication callback message:', authErr)
        alert(`Google Sign-In Notice: ${authErr === 'missing_code' ? 'No authorization code received from Google. Please ensure your Supabase Redirect URLs match your Vercel deployment.' : authErr}`)
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }
    }
  }, [init])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!initialized && loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--color-text-subtle)]">
        <Loader2 size={14} className="animate-spin text-brand-500" />
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return (
      <button
        onClick={() => signInWithGoogle()}
        disabled={loading}
        className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-brand-500/60 bg-brand-500/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-brand-500 dark:text-brand-400 hover:bg-brand-500 hover:text-white dark:hover:text-black hover:shadow-neon transition duration-200"
        title="Sign In with Google"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <LogIn size={14} />
        )}
        <span className="hidden sm:inline">Sign In</span>
      </button>
    )
  }

  // Signed in user
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Lifter'
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture
  const isAdmin = role === 'admin'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setDropdownOpen(prev => !prev)}
        className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-line bg-card py-1 px-1.5 sm:pl-1.5 sm:pr-2.5 text-xs text-[var(--color-text)] hover:border-brand-500/50 transition"
        title={displayName}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-6 w-6 rounded-full object-cover border border-brand-500/40 shrink-0"
          />
        ) : (
          <div className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-white dark:text-black shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="max-w-[80px] sm:max-w-[120px] truncate font-medium hidden md:inline">
          {displayName}
        </span>

        {isAdmin && (
          <span className="rounded bg-brand-500/20 px-1 py-0.2 text-[9px] font-black uppercase text-brand-600 dark:text-brand-400 border border-brand-500/40 hidden md:inline">
            Admin
          </span>
        )}

        <ChevronDown size={12} className={`hidden sm:inline transition duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-2xl z-[100] backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="border-b border-line px-3 py-2">
            <p className="font-semibold text-xs text-[var(--color-text)] truncate">{displayName}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-brand-500'}`} />
              <span className="text-[10px] uppercase tracking-wider font-head font-bold text-brand-600 dark:text-brand-400">
                {isAdmin ? 'Store Administrator' : 'Verified Lifter'}
              </span>
            </div>
          </div>

          <div className="py-1">
            <a
              href="/account"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-elev hover:text-[var(--color-text)] transition"
            >
              <ShoppingBag size={14} className="text-brand-500" />
              <span>My Orders &amp; Receipts</span>
            </a>

            {isAdmin && (
              <>
                <a
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-amber-300 hover:bg-elev transition"
                >
                  <Shield size={14} />
                  <span>Admin Operations</span>
                </a>
                <a
                  href="/connect-gmail"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-emerald-400 hover:bg-elev transition"
                >
                  <span className="text-[10px]">✉️</span>
                  <span>Connect Gmail API</span>
                </a>
                <a
                  href="#inventory-admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-brand-400 hover:bg-elev transition"
                >
                  <span className="text-[10px]">📦</span>
                  <span>Inventory Manager</span>
                </a>
              </>
            )}
          </div>

          <div className="border-t border-line pt-1">
            <button
              onClick={() => {
                setDropdownOpen(false)
                signOut()
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
