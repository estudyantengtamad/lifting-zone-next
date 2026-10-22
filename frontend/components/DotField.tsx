'use client'

import { useEffect, useRef } from 'react'

export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return

    let W = 0, H = 0, mx = -999, my = -999, raf = 0
    let dotBaseColor = 'rgba(22,196,90,0.2)'
    let activeColor = 'rgba(34,229,108,0.85)'

    const readTheme = () => {
      try {
        const computed = getComputedStyle(document.documentElement)
        const dot = computed.getPropertyValue('--color-dot').trim()
        const active = computed.getPropertyValue('--color-dot-active').trim()
        if (dot) dotBaseColor = dot
        if (active) activeColor = active
      } catch (e) {
        // fallback
      }
    }
    readTheme()

    const rs = () => {
      const d = window.devicePixelRatio || 1
      W = window.innerWidth
      H = window.innerHeight
      cv.width = W * d
      cv.height = H * d
      cx.setTransform(d, 0, 0, d, 0, 0)
    }
    rs()

    const mm = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
    }

    const tm = (e: TouchEvent) => {
      if (e.touches[0]) {
        mx = e.touches[0].clientX
        my = e.touches[0].clientY
      }
    }

    const te = () => {
      mx = -999
      my = -999
    }

    const onThemeChange = () => readTheme()

    window.addEventListener('resize', rs)
    window.addEventListener('mousemove', mm)
    window.addEventListener('touchstart', tm, { passive: true })
    window.addEventListener('touchmove', tm, { passive: true })
    window.addEventListener('touchend', te, { passive: true })
    window.addEventListener('touchcancel', te, { passive: true })
    window.addEventListener('lz-theme-change', onThemeChange)

    const observer = new MutationObserver(() => readTheme())
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    const f = () => {
      cx.clearRect(0, 0, W, H)
      const o = (window.scrollY * 0.15) % 24
      for (let x = 12; x < W; x += 24) {
        for (let y = 12 - o; y < H; y += 24) {
          const dx = x - mx
          const dy = y - my
          const d = Math.hypot(dx, dy)
          const n = d < 140 ? 1 - d / 140 : 0

          cx.fillStyle = n > 0.3 ? activeColor : dotBaseColor
          cx.beginPath()
          cx.arc(x + (d ? dx / d : 0) * n * 14, y + (d ? dy / d : 0) * n * 14, 1 + n * 2, 0, 6.3)
          cx.fill()
        }
      }
      raf = requestAnimationFrame(f)
    }
    f()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', rs)
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('touchstart', tm)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', te)
      window.removeEventListener('touchcancel', te)
      window.removeEventListener('lz-theme-change', onThemeChange)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 w-full h-full max-w-full -z-10" />
}
