'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  CheckCircle,
  Truck,
  CreditCard,
  ShieldCheck,
  Tag,
  Loader2,
  Sparkles,
  MapPin,
  QrCode,
  Download,
  AlertCircle,
  Clock,
  LogIn,
  Send
} from 'lucide-react'
import { useStore, subtotal, total } from '../lib/store'
import { useAuthStore } from '../lib/authStore'
import { peso } from '../lib/data'
import { sound } from '../lib/audio'

export default function CheckoutModal() {
  const {
    cart,
    checkoutOpen,
    setCheckoutOpen,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    soundEnabled
  } = useStore()

  const { user, profile, signInWithGoogle } = useAuthStore()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'butuan-express' | 'nationwide'>('butuan-express')
  const [paymentMethod, setPaymentMethod] = useState<'qrph' | 'cod'>('qrph')
  const [couponInput, setCouponInput] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendingReceipt, setSendingReceipt] = useState(false)
  const [receiptSentNotice, setReceiptSentNotice] = useState<string | null>(null)

  // QR Payment & Confirmation State
  const [activeQrOrder, setActiveQrOrder] = useState<any | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCountdown, setQrCountdown] = useState<number>(1800) // 30 minutes in seconds
  const [isQrExpired, setIsQrExpired] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null)
  const [refreshingQr, setRefreshingQr] = useState(false)

  // Pre-fill user data when authenticated
  useEffect(() => {
    if (user && !name) {
      setName(profile?.full_name || user.user_metadata?.full_name || '')
    }
  }, [user, profile, name])

  // Polling for QR Ph payment confirmation
  useEffect(() => {
    if (!activeQrOrder || !activeQrOrder.orderId || confirmedOrder) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?orderId=${activeQrOrder.orderId}`)
        const data = await res.json()

        if (data.success) {
          if (data.paymentStatus === 'paid') {
            clearInterval(pollInterval)
            if (soundEnabled) sound.playSuccess()
            setConfirmedOrder({
              ...activeQrOrder,
              paymentStatus: 'paid',
              status: 'Paid & Queued for Priority Packing'
            })
            clearCart()
          } else if (data.paymentStatus === 'expired') {
            setIsQrExpired(true)
          }
        }
      } catch (err) {
        console.warn('Status poll warning:', err)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [activeQrOrder, confirmedOrder, clearCart, soundEnabled])

  // Countdown timer for active QR code
  useEffect(() => {
    if (!activeQrOrder || !activeQrOrder.qrExpiresAt || confirmedOrder) return

    const updateTimer = () => {
      const remainingMs = new Date(activeQrOrder.qrExpiresAt).getTime() - Date.now()
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000))
      setQrCountdown(remainingSec)
      if (remainingSec === 0) {
        setIsQrExpired(true)
      }
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [activeQrOrder, confirmedOrder])

  if (!checkoutOpen) return null

  const sub = subtotal(cart)
  const grandTotal = total(cart, coupon)
  const freeShipping = grandTotal >= 3000
  const shippingFee = freeShipping ? 0 : deliveryMethod === 'butuan-express' ? 120 : 250
  const finalAmount = grandTotal + shippingFee

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return
    setValidatingCoupon(true)
    setCouponError('')

    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput })
      })
      const data = await res.json()
      if (data.valid) {
        applyCoupon(data.code, data.percent)
        setCouponInput('')
      } else {
        setCouponError(data.message || 'Invalid promo code')
      }
    } catch {
      setCouponError('Network error checking coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in with Google before placing your order.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customer: { name, phone, address },
          deliveryMethod,
          paymentMethod,
          coupon
        })
      })
      const data = await res.json()

      if (data.success) {
        if (paymentMethod === 'qrph') {
          // Launch QR Ph Payment flow
          setActiveQrOrder({
            ...data,
            qrCodeUrl: data.qrCodeUrl || '/qr-ph.png'
          })
          setShowQrModal(true)
          setIsQrExpired(false)
          if (soundEnabled) sound.playClick()
        } else {
          // COD or instant checkout
          if (soundEnabled) sound.playSuccess()
          setConfirmedOrder(data)
          clearCart()
        }
      } else {
        alert(data.message || 'Checkout failed. Please review your order.')
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefreshQr = async () => {
    if (!activeQrOrder) return
    setRefreshingQr(true)
    try {
      const res = await fetch('/api/payments/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeQrOrder.orderId })
      })
      const data = await res.json()
      if (data.success && data.qrCodeUrl) {
        setActiveQrOrder((prev: any) => ({
          ...prev,
          qrCodeUrl: data.qrCodeUrl,
          qrExpiresAt: data.expiresAt
        }))
        setIsQrExpired(false)
        if (soundEnabled) sound.playSuccess()
      } else {
        alert(data.message || 'Failed to refresh QR code')
      }
    } catch {
      alert('Network error requesting new QR')
    } finally {
      setRefreshingQr(false)
    }
  }

  const handleResendReceipt = async (orderId: string) => {
    if (!orderId) return
    setSendingReceipt(true)
    setReceiptSentNotice(null)
    try {
      const res = await fetch('/api/receipts/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const data = await res.json()
      if (data.success) {
        setReceiptSentNotice(data.message || 'Receipt sent to your Gmail!')
      } else {
        setReceiptSentNotice(`Notice: ${data.message || 'Failed to dispatch'}`)
      }
    } catch {
      setReceiptSentNotice('Network error dispatching receipt')
    } finally {
      setSendingReceipt(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setCheckoutOpen(false)}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Dedicated QR Ph Payment Tab Popup (Independent fixed overlay so it is always 100% centered and never clipped by scroll) */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              data-lenis-prevent
              className="relative z-10 max-h-[94vh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-brand-500/80 bg-card p-5 sm:p-6 shadow-2xl transition-colors duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500 text-[var(--color-btn-text)] shadow-neon">
                    <QrCode size={18} />
                  </span>
                  <div>
                    <h3 className="font-head text-sm font-bold text-[var(--color-text)]">
                      PayMongo &amp; InstaPay QR Ph
                    </h3>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      Scan with GCash, Maya, ShopeePay &amp; all PH banks
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-line bg-elev text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                  title="Close payment tab"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Amount Due */}
              <div className="text-center pt-2.5 pb-0.5">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider">
                  Total Amount Due
                </span>
                <div className="font-solare text-3xl text-brand-400 font-bold">
                  {peso(activeQrOrder?.totalAmount || finalAmount)}
                </div>
                {activeQrOrder?.orderNumber && (
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                    Order Ref: <strong className="text-brand-400">{activeQrOrder.orderNumber}</strong>
                  </span>
                )}
              </div>

              {/* QR Container (White tile for 100% camera contrast) */}
              <div className="mx-auto my-2.5 w-fit rounded-2xl bg-white p-3 shadow-2xl border-4 border-brand-500/40">
                <img
                  src="/qr-ph.png"
                  alt="InstaPay QR Ph Code"
                  className="max-h-56 sm:max-h-60 w-auto object-contain mx-auto"
                />
              </div>

              {/* Recipient Details from user image */}
              <div className="mx-auto max-w-sm rounded-xl border border-line bg-elev/90 p-2.5 text-left space-y-1 text-xs">
                <div className="flex justify-between items-center text-[var(--color-text)] font-semibold">
                  <span className="text-[var(--color-text-subtle)] text-[11px]">Account Name:</span>
                  <span className="font-mono text-blue-500 dark:text-blue-400 font-bold text-xs tracking-wider">KA*L VI****T A.</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text)]">
                  <span className="text-[var(--color-text-subtle)] text-[11px]">Mobile Number:</span>
                  <span className="font-mono text-xs text-[var(--color-text)]">+63 962 880 ••••</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text)]">
                  <span className="text-[var(--color-text-subtle)] text-[11px]">User ID:</span>
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">••••••••••43M9SV</span>
                </div>
                <div className="border-t border-line/60 pt-1 mt-1 flex justify-between items-center text-[10px] text-[var(--color-text-subtle)]">
                  <span>Network: InstaPay / QR Ph</span>
                  <span>Transfer fees may apply</span>
                </div>
              </div>

              {/* Active QR Order polling state if submitted */}
              {activeQrOrder && (
                <div className="max-w-sm mx-auto mt-2">
                  {isQrExpired ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-2 text-center text-xs text-red-400 font-bold">
                      QR window expired. Please request a new QR.
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-line bg-elev px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Loader2 size={13} className="animate-spin text-brand-500" />
                        <span className="text-[11px] font-medium text-[var(--color-text)]">Awaiting payment verification...</span>
                      </div>
                      <b className="font-mono text-xs text-brand-400">{formatCountdown(qrCountdown)}</b>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-line pt-2.5 mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <a
                  href="/qr-ph.png"
                  download="lifting-zone-qr-ph.png"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-line bg-elev px-3 py-2 text-xs font-bold text-brand-400 hover:border-brand-500 transition"
                >
                  <Download size={13} />
                  <span>Download QR</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 sm:flex-initial rounded-xl border border-line bg-elev px-3 py-2 text-xs font-bold text-[var(--color-text)] hover:border-brand-500/50 transition"
                  >
                    Back to Form
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      if (!activeQrOrder) {
                        setShowQrModal(false)
                        if (name && phone && address && user) {
                          handleSubmitOrder(e)
                        }
                      } else {
                        setConfirmedOrder({
                          ...activeQrOrder,
                          paymentStatus: 'paid',
                          status: 'Paid & Queued for Priority Packing'
                        })
                        clearCart()
                        setShowQrModal(false)
                      }
                    }}
                    className="flex-1 sm:flex-initial btn !py-2 !px-4 text-xs flex items-center justify-center gap-1.5 shadow-neon"
                  >
                    <CheckCircle size={13} />
                    <span>{activeQrOrder ? "I've Paid — Confirm" : "Proceed & Confirm Order"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        data-lenis-prevent
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-brand-500/50 bg-card p-4 sm:p-6 md:p-8 shadow-2xl transition-colors duration-200"
      >
        <button
          onClick={() => setCheckoutOpen(false)}
          className="absolute right-4 top-4 sm:right-5 sm:top-5 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-line bg-elev text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
          aria-label="Close checkout"
        >
          <X size={16} />
        </button>

        {/* 1. ORDER CONFIRMATION SCREEN (Paid or COD confirmed) */}
        {confirmedOrder ? (
          <div className="py-4 space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-[var(--color-btn-text)] shadow-neon">
                <CheckCircle size={32} />
              </div>
              <span className="eyebrow text-xs">
                {confirmedOrder.paymentStatus === 'paid' ? 'Payment Verified & Confirmed' : 'Order Placed Successfully'}
              </span>
              <h2 className="h text-2xl md:text-3xl text-[var(--color-text)] mt-1">Thank You, Lifter!</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
                Your order has been queued at our Salvador Calo St. facility. A verifiable receipt has been dispatched to{' '}
                <strong className="text-[var(--color-text)]">{confirmedOrder.customerEmail || user?.email}</strong>.
              </p>
            </div>

            {/* Complete Itemized Summary Card */}
            <div className="rounded-2xl border border-brand-500/30 bg-elev p-5 text-left max-w-lg mx-auto space-y-4">
              {/* Order Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-xs">
                <div>
                  <span className="text-[var(--color-text-subtle)] block text-[10px] uppercase font-bold">Order Tracking #</span>
                  <b className="font-mono text-sm text-brand-400 font-bold">{confirmedOrder.orderNumber}</b>
                </div>
                <div className="text-right">
                  <span className="text-[var(--color-text-subtle)] block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                    confirmedOrder.paymentStatus === 'paid'
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                      : confirmedOrder.paymentMethod === 'cod'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {confirmedOrder.paymentStatus === 'paid'
                      ? 'PAID & VERIFIED'
                      : confirmedOrder.paymentMethod === 'cod'
                      ? 'CONFIRMED (COD)'
                      : 'AWAITING PAYMENT'}{' '}
                    ({confirmedOrder.paymentMethod?.toUpperCase()})
                  </span>
                </div>
              </div>

              {/* Itemized Products Added to Cart */}
              <div>
                <p className="text-[11px] uppercase font-bold text-brand-400 tracking-wider mb-2">
                  Items Purchased ({confirmedOrder.items?.length || Object.keys(cart).length || 1} items):
                </p>
                <div className="space-y-2 border-b border-line pb-3">
                  {(confirmedOrder.items || []).map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <span className="font-mono font-bold text-brand-400 shrink-0">{it.quantity}x</span>
                        <span className="text-[var(--color-text)] truncate font-medium">{it.product_title}</span>
                      </div>
                      <span className="font-mono font-bold text-[var(--color-text)]">
                        {peso(it.subtotal || it.unit_price * it.quantity)}
                      </span>
                    </div>
                  ))}
                  {(!confirmedOrder.items || confirmedOrder.items.length === 0) && (
                    <div className="text-xs text-[var(--color-text-muted)] italic">
                      Order details confirmed. Total settled: {peso(confirmedOrder.totalAmount || finalAmount)}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="border-b border-line pb-3 text-xs space-y-1.5">
                <div className="flex justify-between text-[var(--color-text-subtle)]">
                  <span>Delivery Dispatch:</span>
                  <span className="text-[var(--color-text)] font-semibold text-right max-w-[65%]">
                    {confirmedOrder.estimatedDelivery || (deliveryMethod === 'butuan-express' ? 'Same-Day Motorbike Express (Within 2-4 Hours in Butuan City)' : 'Door-to-Door Cargo Express (2-3 Business Days nationwide)')}
                  </span>
                </div>
                {(confirmedOrder.customerAddress || address) && (
                  <div className="flex justify-between text-[var(--color-text-subtle)]">
                    <span>Shipping Address:</span>
                    <span className="text-[var(--color-text)] text-right max-w-[65%] truncate">
                      {confirmedOrder.customerAddress || address}
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-1.5 text-xs">
                {confirmedOrder.subtotal !== undefined && (
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Subtotal:</span>
                    <span>{peso(confirmedOrder.subtotal)}</span>
                  </div>
                )}
                {confirmedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-brand-400 font-semibold">
                    <span>Discount:</span>
                    <span>-{peso(confirmedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Shipping Fee:</span>
                  <span>{confirmedOrder.shippingFee === 0 ? 'FREE (Orders ₱3,000+)' : peso(confirmedOrder.shippingFee || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-line/60 pt-2 text-sm font-bold text-[var(--color-text)]">
                  <span className="font-head text-base">Total Settled:</span>
                  <b className="font-head text-lg text-brand-400">{peso(confirmedOrder.totalAmount || finalAmount)}</b>
                </div>
              </div>

              {/* Instant Resend / Dispatch Receipt Button */}
              <div className="border-t border-line/60 pt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={sendingReceipt}
                  onClick={() => handleResendReceipt(confirmedOrder.orderId)}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-[11px] font-bold text-brand-400 hover:bg-brand-500 hover:text-black transition disabled:opacity-50"
                >
                  <Send size={12} className={sendingReceipt ? 'animate-spin' : ''} />
                  <span>{sendingReceipt ? 'Sending...' : 'Email Me Official Receipt'}</span>
                </button>
                {receiptSentNotice && (
                  <span className="text-[11px] text-emerald-400 font-medium truncate">{receiptSentNotice}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <a href="/account" className="btn !py-2.5 !px-6 text-xs flex items-center justify-center gap-1.5">
                <span>View Full Receipt in Account</span>
              </a>
              <button
                onClick={() => {
                  setConfirmedOrder(null)
                  setActiveQrOrder(null)
                  setCheckoutOpen(false)
                }}
                className="rounded-xl border border-line bg-elev px-6 py-2.5 text-xs font-bold text-[var(--color-text)] hover:border-brand-500/50"
              >
                Back to Showroom
              </button>
            </div>
          </div>
        ) : activeQrOrder ? (
          /* 2. ACTIVE QR PH PAYMENT SCREEN */
          <div className="text-center py-4">
            <span className="eyebrow text-xs flex items-center justify-center gap-1.5">
              <QrCode size={14} className="text-brand-500" /> PayMongo QR Ph Gateway
            </span>
            <h2 className="h text-2xl md:text-3xl text-[var(--color-text)] mt-1">
              Scan &amp; Pay <span className="neon">{peso(activeQrOrder.totalAmount)}</span>
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
              Scan using <strong>GCash</strong>, <strong>Maya</strong>, <strong>ShopeePay</strong>, or any Philippine banking app with QR Ph support.
            </p>

            {/* Crucial: White tile with padding in both themes for reliable scanner contrast */}
            <div className="my-5 mx-auto w-fit rounded-3xl bg-white p-5 shadow-2xl border-4 border-brand-500/30">
              <img
                src={activeQrOrder.qrCodeUrl || '/qr-ph.png'}
                alt="PayMongo QR Ph Code"
                className="max-h-64 sm:max-h-72 w-auto object-contain mx-auto"
              />
            </div>

            {/* Recipient Details from user image */}
            <div className="mx-auto max-w-sm rounded-xl border border-line bg-elev/80 p-3 text-left space-y-1.5 text-xs mb-4">
              <div className="flex justify-between items-center text-[var(--color-text)] font-semibold">
                <span className="text-[var(--color-text-subtle)] text-[11px]">Account Name:</span>
                <span className="font-mono text-blue-500 dark:text-blue-400 font-bold text-sm tracking-wider">KA*L VI****T A.</span>
              </div>
              <div className="flex justify-between items-center text-[var(--color-text)]">
                <span className="text-[var(--color-text-subtle)] text-[11px]">Mobile Number:</span>
                <span className="font-mono text-xs text-[var(--color-text)]">+63 962 880 ••••</span>
              </div>
              <div className="flex justify-between items-center text-[var(--color-text)]">
                <span className="text-[var(--color-text-subtle)] text-[11px]">User ID:</span>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">••••••••••43M9SV</span>
              </div>
              <div className="border-t border-line/60 pt-1.5 mt-1 flex justify-between items-center text-[10px] text-[var(--color-text-subtle)]">
                <span>Network: InstaPay / QR Ph</span>
                <span>Transfer fees may apply</span>
              </div>
            </div>

            {/* Expiry Countdown & Status */}
            <div className="max-w-md mx-auto mb-6">
              {isQrExpired ? (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-center">
                  <p className="text-xs text-red-400 font-bold flex items-center justify-center gap-1.5">
                    <AlertCircle size={15} /> This QR code has expired.
                  </p>
                  <button
                    disabled={refreshingQr}
                    onClick={handleRefreshQr}
                    className="btn mt-2 !py-1.5 !px-4 !text-xs inline-flex items-center gap-1"
                  >
                    {refreshingQr ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    <span>Get New QR Code</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-line bg-elev px-4 py-3">
                  <div className="flex items-center gap-2 text-left">
                    <Loader2 size={16} className="animate-spin text-brand-500" />
                    <div>
                      <span className="text-xs font-bold text-[var(--color-text)] block">Waiting for payment...</span>
                      <small className="text-[10px] text-[var(--color-text-subtle)]">Auto-detects upon app confirmation</small>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--color-text-subtle)] uppercase block">Expires In</span>
                    <b className="font-mono text-sm text-brand-400 font-bold">{formatCountdown(qrCountdown)}</b>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={activeQrOrder.qrCodeUrl}
                download={`lifting-zone-${activeQrOrder.orderNumber}-qr.png`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-line bg-elev px-4 py-2.5 text-xs font-bold text-brand-400 hover:border-brand-500"
              >
                <Download size={14} />
                <span>Save QR Image</span>
              </a>
              <button
                onClick={() => setActiveQrOrder(null)}
                className="text-xs text-[var(--color-text-muted)] hover:underline px-4 py-2"
              >
                Change Payment Method / Cancel
              </button>
            </div>
          </div>
        ) : (
          /* 3. CHECKOUT FORM */
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            <div>
              <span className="eyebrow">Express Checkout</span>
              <h2 className="h text-2xl md:text-3xl text-[var(--color-text)] mt-1">
                Lifting Zone <span className="neon">Order Dispatch</span>
              </h2>
            </div>

            {/* Google Authentication Guard */}
            {!user ? (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-center">
                <ShieldCheck size={28} className="mx-auto text-amber-400 mb-2" />
                <h4 className="font-head text-sm font-bold text-[var(--color-text)]">
                  Google Sign-In Required for Receipt Delivery
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                  To ensure authentic receipt delivery to your Gmail and order tracking in your lifter dashboard, please sign in with Google.
                </p>
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="btn mt-4 !py-2.5 !px-6 text-xs inline-flex items-center gap-2"
                >
                  <LogIn size={14} />
                  <span>Sign In with Google</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-brand-500/30 bg-brand-500/10 px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-black">
                    ✓
                  </div>
                  <span className="text-[var(--color-text)]">
                    Logged in as <strong>{user.email}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">
                  Receipt Destination
                </span>
              </div>
            )}

            {/* Recipient Details */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-brand-400 tracking-wider">
                1. Delivery Information
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  type="text"
                  placeholder="Full Name / Gym Handle"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-elev py-3 px-3 text-base sm:text-xs text-[var(--color-text)] outline-none focus:border-brand-500"
                />
                <input
                  required
                  type="tel"
                  placeholder="Contact Mobile Number (e.g. 0917...)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-line bg-elev py-3 px-3 text-base sm:text-xs text-[var(--color-text)] outline-none focus:border-brand-500"
                />
              </div>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-3.5 text-[var(--color-text-subtle)]" />
                <input
                  required
                  type="text"
                  placeholder="Street Address / Barangay / Landmark (Butuan City or Provincial)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-line bg-elev py-3 pl-9 pr-3 text-base sm:text-xs text-[var(--color-text)] outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Delivery Method */}
            <div>
              <h4 className="text-xs uppercase font-bold text-brand-400 tracking-wider mb-2">
                2. Shipping Option
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('butuan-express')}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    deliveryMethod === 'butuan-express'
                      ? 'border-brand-500 bg-brand-500/15 shadow-neon'
                      : 'border-line bg-elev text-[var(--color-text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-head text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <Truck size={14} className="text-brand-500" /> Butuan Motorbike Express
                    </span>
                    <span className="text-xs font-bold text-brand-400">
                      {freeShipping ? 'FREE' : '₱120'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
                    Delivered within 2-4 hours from Salvador Calo St.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('nationwide')}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    deliveryMethod === 'nationwide'
                      ? 'border-brand-500 bg-brand-500/15 shadow-neon'
                      : 'border-line bg-elev text-[var(--color-text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-head text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <Truck size={14} className="text-brand-500" /> Nationwide Cargo (LBC/J&amp;T)
                    </span>
                    <span className="text-xs font-bold text-brand-400">
                      {freeShipping ? 'FREE' : '₱250'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
                    2-3 business days doorstep freight across PH.
                  </p>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h4 className="text-xs uppercase font-bold text-brand-400 tracking-wider mb-2">
                3. Payment Gateway
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('qrph')
                    setShowQrModal(true)
                    if (soundEnabled) sound.playClick()
                  }}
                  className={`rounded-2xl border p-3.5 text-left transition group ${
                    paymentMethod === 'qrph'
                      ? 'border-brand-500 bg-brand-500/15 shadow-neon'
                      : 'border-line bg-elev text-[var(--color-text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <b className="font-head text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <QrCode size={15} className="text-brand-400" /> PayMongo QR Ph
                    </b>
                    <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-brand-400">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
                    Instant scan with GCash, Maya, ShopeePay &amp; Banks.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-brand-400 group-hover:text-brand-300">
                    <QrCode size={13} />
                    <span>⚡ Click to Open Payment Tab</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    paymentMethod === 'cod'
                      ? 'border-brand-500 bg-brand-500/15 shadow-neon'
                      : 'border-line bg-elev text-[var(--color-text-muted)]'
                  }`}
                >
                  <b className="font-head text-xs font-bold text-[var(--color-text)] block">
                    Cash on Delivery (COD)
                  </b>
                  <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
                    Settle in cash with our dispatch rider upon delivery.
                  </p>
                </button>
              </div>
            </div>

            {/* Promo voucher section */}
            <div className="rounded-2xl border border-line bg-elev p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                  <Tag size={13} className="text-brand-500" /> Promo / VIP Voucher:
                </span>
                {coupon && (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    Remove ({coupon.code})
                  </button>
                )}
              </div>

              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-brand-500/20 px-3 py-2 text-xs font-bold text-brand-400 border border-brand-500/30">
                  <span>Applied: {coupon.code}</span>
                  <span>-{coupon.percent}% Discount</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. LIFTZONE10, CHALK15)"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon}
                    onClick={handleApplyCoupon}
                    className="rounded-xl bg-elev border border-line px-4 py-2 text-xs font-bold text-brand-400 hover:border-brand-500"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] text-red-400 mt-1">{couponError}</p>}
            </div>

            {/* Order Cost Breakdown */}
            <div className="space-y-1.5 border-t border-line pt-4 text-xs">
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Subtotal ({Object.values(cart).reduce((a, b) => a + b, 0)} items)</span>
                <span>{peso(sub)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-brand-400 font-bold">
                  <span>VIP Discount (-{coupon.percent}%)</span>
                  <span>-{peso(sub - grandTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Shipping Dispatch</span>
                <span>{freeShipping ? 'FREE (Orders ₱3,000+)' : peso(shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-2 text-sm font-bold text-[var(--color-text)]">
                <span className="font-head text-base">Grand Total</span>
                <span className="font-head text-base text-brand-400">{peso(finalAmount)}</span>
              </div>
            </div>

            <button
              disabled={submitting || !user}
              type="submit"
              className="btn w-full !py-3.5 !text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transmitting Dispatch Request...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{paymentMethod === 'qrph' ? 'Proceed to QR Ph Payment' : 'Confirm Cash on Delivery Order'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
