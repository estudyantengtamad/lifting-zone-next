'use client'

import { ReactNode, useEffect, useRef } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProps {
  children: ReactNode
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Initialize Lenis smooth scroll engine
    const lenis = new Lenis({
      lerp: 0.08, // Buttery smooth interpolation factor
      duration: 1.25, // Momentum duration
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.6,
      infinite: false,
      syncTouch: false,
      anchors: true,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })

    lenisRef.current = lenis
    if (typeof window !== 'undefined') {
      ;(window as any).__lz_lenis = lenis
    }

    // High performance RAF loop
    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Global anchor click interceptor for silky-smooth section navigation
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (href && href.startsWith('#') && href.length > 1) {
        if (href === '#intro') {
          e.preventDefault()
          lenis.scrollTo(0, {
            duration: 1.3,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          })
          window.history.pushState(null, '', href)
          return
        }

        const element = document.querySelector(href)
        if (element) {
          e.preventDefault()
          lenis.scrollTo(element as HTMLElement, {
            offset: -68,
            duration: 1.3,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          })
          window.history.pushState(null, '', href)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', handleAnchorClick)
      lenis.destroy()
      lenisRef.current = null
      if (typeof window !== 'undefined') {
        delete (window as any).__lz_lenis
      }
    }
  }, [])

  return <>{children}</>
}
