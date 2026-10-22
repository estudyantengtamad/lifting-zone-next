'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { sound } from '../lib/audio'
import { useStore } from '../lib/store'

export type ThemeMode = 'dark' | 'light' | 'system'

export default function ThemeToggle() {
  const { soundEnabled } = useStore()
  const [mode, setMode] = useState<ThemeMode>('dark')
  const [mounted, setMounted] = useState(false)

  const applyTheme = (targetMode: ThemeMode) => {
    let resolvedTheme: 'dark' | 'light' = 'dark'

    if (targetMode === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      localStorage.removeItem('lz-theme')
    } else {
      resolvedTheme = targetMode
      localStorage.setItem('lz-theme', targetMode)
    }

    document.documentElement.setAttribute('data-theme', resolvedTheme)
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Notify canvas components and subscribers
    window.dispatchEvent(
      new CustomEvent('lz-theme-change', {
        detail: { mode: targetMode, resolvedTheme }
      })
    )
  }

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('lz-theme') as ThemeMode | null
    if (stored === 'light' || stored === 'dark') {
      setMode(stored)
      applyTheme(stored)
    } else {
      setMode('dark')
      applyTheme('dark')
    }

    // Listen to OS theme changes if on system mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('lz-theme') === null) {
        applyTheme('system')
      }
    }
    mql.addEventListener('change', handleSystemChange)
    return () => mql.removeEventListener('change', handleSystemChange)
  }, [])

  const cycleTheme = () => {
    if (soundEnabled) sound.playClick()
    const next: ThemeMode = mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark'
    setMode(next)
    applyTheme(next)
  }

  if (!mounted) {
    return (
      <div className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-white/40">
        <Moon size={15} />
      </div>
    )
  }

  return (
    <button
      onClick={cycleTheme}
      className="group relative grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-white/80 hover:border-brand-500/60 hover:text-white transition duration-200"
      title={`Theme: ${mode.toUpperCase()} (Click to cycle Dark / Light / System)`}
      aria-label="Toggle Dark, Light, or System Theme"
    >
      {mode === 'dark' && <Moon size={15} className="text-brand-400 group-hover:scale-110 transition" />}
      {mode === 'light' && <Sun size={15} className="text-amber-500 group-hover:rotate-45 transition" />}
      {mode === 'system' && <Monitor size={15} className="text-blue-400 group-hover:scale-110 transition" />}

      {/* Tiny active mode indicator dot */}
      <span
        className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${
          mode === 'dark' ? 'bg-brand-500' : mode === 'light' ? 'bg-amber-400' : 'bg-blue-400'
        }`}
      />
    </button>
  )
}
