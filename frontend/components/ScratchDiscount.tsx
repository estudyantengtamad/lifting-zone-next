'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Check, Gift } from 'lucide-react'
import { sound } from '../lib/audio'
import { useStore } from '../lib/store'

export default function ScratchDiscount() {
  const { soundEnabled, applyCoupon } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratched, setIsScratched] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pctRevealed, setPctRevealed] = useState(0)
  const isDrawing = useRef(false)
  const code = 'CHALK15'

  const drawChalkSurface = useCallback(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const w = cvs.width
    const h = cvs.height

    // Read computed theme variables
    let base = '#262626'
    let mid = '#404040'
    let end = '#171717'
    let brandText = '#16c45a'
    let subText = '#a3a3a3'

    try {
      const computed = getComputedStyle(document.documentElement)
      base = computed.getPropertyValue('--color-chalk-base').trim() || base
      mid = computed.getPropertyValue('--color-chalk-mid').trim() || mid
      end = computed.getPropertyValue('--color-chalk-end').trim() || end
      brandText = computed.getPropertyValue('--color-chalk-text').trim() || brandText
      subText = computed.getPropertyValue('--color-text-subtle').trim() || subText
    } catch (e) {
      // fallback
    }

    // Draw textured chalk / metallic coating
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, base)
    grad.addColorStop(0.5, mid)
    grad.addColorStop(1, end)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Add chalk speckled texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    for (let i = 0; i < 400; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Callout text on the scratch surface
    ctx.fillStyle = brandText
    ctx.font = 'bold 13px Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚡ SCRATCH TO REVEAL VIP CODE', w / 2, h / 2 - 8)

    ctx.fillStyle = subText
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText('Rub chalk to unlock 15% OFF', w / 2, h / 2 + 12)
  }, [])

  useEffect(() => {
    if (!isScratched) {
      drawChalkSurface()
    }

    const onThemeChange = () => {
      if (!isScratched) {
        drawChalkSurface()
      }
    }

    window.addEventListener('lz-theme-change', onThemeChange)
    const observer = new MutationObserver(onThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => {
      window.removeEventListener('lz-theme-change', onThemeChange)
      observer.disconnect()
    }
  }, [drawChalkSurface, isScratched])

  const checkScratchPercentage = () => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const { data } = ctx.getImageData(0, 0, cvs.width, cvs.height)
    let transparent = 0
    const totalPixels = data.length / 4

    for (let i = 3; i < data.length; i += 4 * 8) {
      if (data[i] === 0) transparent++
    }

    const pct = Math.round((transparent / (totalPixels / 8)) * 100)
    setPctRevealed(pct)

    if (pct > 35 && !isScratched) {
      setIsScratched(true)
      if (soundEnabled) sound.playSuccess()
    }
  }

  const scratch = (clientX: number, clientY: number) => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const rect = cvs.getBoundingClientRect()
    const scaleX = cvs.width / (rect.width || 1)
    const scaleY = cvs.height / (rect.height || 1)
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()

    if (soundEnabled && Math.random() > 0.4) {
      sound.playScratch()
    }

    checkScratchPercentage()
  }

  const handleApply = async () => {
    if (soundEnabled) sound.playClick()
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (data.valid) {
        applyCoupon(code, data.percent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      applyCoupon(code, 15)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative mx-auto my-6 max-w-xl rounded-3xl border border-brand-500/40 bg-card p-4 sm:p-6 shadow-neon text-center transition-colors">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Gift className="text-brand-500" size={18} />
        <span className="eyebrow text-xs">Secret Lifter Chalk Loot</span>
      </div>
      <h3 className="h text-xl md:text-2xl mb-1 text-[var(--color-text)]">
        Scratch For Instant <span className="neon">15% VIP Discount</span>
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Interactive chalk card. Drag your mouse or finger across the chalk coating to reveal your code.
      </p>

      {/* Container holding underlying secret code and overlay canvas */}
      <div className="relative mx-auto h-24 w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-brand-500/50 bg-[var(--color-chalk-bg)] flex items-center justify-center select-none shadow-inner">
        {/* Underlying secret reward */}
        <div className="flex flex-col items-center justify-center">
          <span className="font-head text-2xl font-black tracking-widest text-brand-400">
            {code}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)] font-bold">15% OFF ENTIRE BUTUAN ORDER</span>
        </div>

        {/* Scratch Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={320}
          height={96}
          onMouseDown={e => {
            isDrawing.current = true
            scratch(e.clientX, e.clientY)
          }}
          onMouseUp={() => (isDrawing.current = false)}
          onMouseLeave={() => (isDrawing.current = false)}
          onMouseMove={e => {
            if (isDrawing.current) scratch(e.clientX, e.clientY)
          }}
          onTouchStart={e => {
            isDrawing.current = true
            if (e.touches[0]) {
              scratch(e.touches[0].clientX, e.touches[0].clientY)
            }
          }}
          onTouchEnd={() => (isDrawing.current = false)}
          onTouchCancel={() => (isDrawing.current = false)}
          onTouchMove={e => {
            if (isDrawing.current && e.touches[0]) {
              scratch(e.touches[0].clientX, e.touches[0].clientY)
            }
          }}
          style={{ touchAction: 'none' }}
          className={`absolute inset-0 cursor-crosshair touch-none select-none transition-opacity duration-700 ${
            isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {isScratched ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-[var(--color-text)] font-bold">
              🎉 Unlocked Code: <span className="neon font-mono text-sm">{code}</span>
            </span>
            <button
              onClick={handleApply}
              className="btn !py-2 !px-4 !text-xs flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check size={14} /> Applied to Cart!
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Apply 15% to Cart
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <span className="text-[11px] text-[var(--color-text-subtle)]">
            {pctRevealed > 0 ? `Scratched ${pctRevealed}%... keep going!` : 'Click & drag across the grey box to rub off chalk'}
          </span>
        )}
      </div>
    </div>
  )
}
