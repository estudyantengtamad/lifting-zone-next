'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, ArrowLeft, ShoppingBag, ShieldCheck, QrCode, RefreshCw, Send, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../lib/authStore'
import { peso } from '../../lib/data'
import Header from '../../components/Header'
import DotField from '../../components/DotField'

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, initialized, signInWithGoogle } = useAuthStore()

  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<{ [id: string]: string }>({})
  const [activeQrModal, setActiveQrModal] = useState<any | null>(null)
  const [loadingQrId, setLoadingQrId] = useState<string | null>(null)

  useEffect(() => {
    if (initialized && !user) {
      // User is not signed in
      setLoadingOrders(false)
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [initialized, user])

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      // Query user's orders via Supabase browser client
      const { createClient } = await import('../../lib/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
      }
    } catch (err) {
      console.warn('Error fetching user orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleResendReceipt = async (orderId: string) => {
    setResendingId(orderId)
    setResendStatus(prev => ({ ...prev, [orderId]: 'Sending receipt...' }))

    try {
      const res = await fetch('/api/receipts/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const data = await res.json()

      if (data.success) {
        setResendStatus(prev => ({ ...prev, [orderId]: 'Receipt sent to your Gmail!' }))
        setTimeout(() => {
          setResendStatus(prev => {
            const next = { ...prev }
            delete next[orderId]
            return next
          })
        }, 4000)
      } else {
        setResendStatus(prev => ({ ...prev, [orderId]: data.message || 'Error resending receipt' }))
      }
    } catch {
      setResendStatus(prev => ({ ...prev, [orderId]: 'Network error resending receipt' }))
    } finally {
      setResendingId(null)
    }
  }

  const handlePayWithQr = async (order: any) => {
    setLoadingQrId(order.id)
    try {
      const res = await fetch('/api/payments/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      })
      const data = await res.json()
      if (data.success && data.qrCodeUrl) {
        setActiveQrModal({
          orderId: order.id,
          orderNumber: order.order_number,
          qrCodeUrl: data.qrCodeUrl,
          expiresAt: data.expiresAt,
          amount: data.amount
        })
      } else {
        alert(data.message || 'Unable to generate QR code at this time')
      }
    } catch {
      alert('Network error connecting to payment gateway')
    } finally {
      setLoadingQrId(null)
    }
  }

  if (authLoading || !initialized) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col justify-center items-center px-4">
        <DotField />
        <div className="max-w-md w-full rounded-3xl border border-line bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-[var(--color-btn-text)] shadow-neon">
            <ShoppingBag size={24} />
          </div>
          <h2 className="font-head text-2xl font-bold">Lifter Authentication</h2>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Sign in with your Google account to access your purchase monograph, receipts, and order statuses.
          </p>
          <button
            onClick={() => signInWithGoogle('/account')}
            className="btn w-full mt-6 flex items-center justify-center gap-2"
          >
            <span>Sign In with Google</span>
          </button>
          <a href="/" className="inline-block mt-4 text-xs text-brand-400 hover:underline">
            ← Return to Showroom
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <DotField />
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Top Breadcrumb & User Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <a href="/" className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:underline mb-2">
              <ArrowLeft size={14} /> Back to Showroom
            </a>
            <h1 className="font-head text-3xl font-black">
              Account &amp; <span className="neon italic">Order History</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Signed in as <strong>{user.email}</strong> • Role: <span className="uppercase text-brand-400 font-bold">{profile?.role || 'customer'}</span>
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="self-start sm:self-auto flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2 text-xs font-semibold hover:border-brand-500/50 transition"
          >
            <RefreshCw size={13} className={loadingOrders ? 'animate-spin text-brand-500' : ''} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Orders Listing */}
        <div className="mt-8 space-y-6">
          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand-500 mb-3" size={32} />
              <p className="text-xs text-[var(--color-text-muted)]">Retrieving your order archives...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-line bg-card p-12 text-center">
              <ShoppingBag size={40} className="mx-auto text-[var(--color-text-subtle)] mb-3" />
              <h3 className="font-head text-lg font-bold">No orders found</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                You haven&apos;t placed any orders yet. Visit our showroom to explore supplements and heavy iron.
              </p>
              <a href="/#supplements" className="btn mt-5 inline-block text-xs">
                Explore Supplements
              </a>
            </div>
          ) : (
            orders.map(order => {
              const isPaid = order.payment_status === 'paid'
              const isUnpaid = order.payment_status === 'unpaid' || order.payment_status === 'pending'
              const isExpired = order.payment_status === 'expired'

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-line bg-card p-6 shadow-md transition-all hover:border-brand-500/40"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-black text-brand-400">{order.order_number}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50'
                              : isExpired
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })} at{' '}
                        {new Date(order.created_at).toLocaleTimeString('en-PH', { timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action: Pay with QR Ph if unpaid */}
                      {isUnpaid && order.payment_method === 'qrph' && (
                        <button
                          disabled={loadingQrId === order.id}
                          onClick={() => handlePayWithQr(order)}
                          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition"
                        >
                          {loadingQrId === order.id ? <Loader2 size={13} className="animate-spin" /> : <QrCode size={13} />}
                          <span>Pay with QR Ph</span>
                        </button>
                      )}

                      {/* Action: Resend Receipt */}
                      <button
                        disabled={resendingId === order.id}
                        onClick={() => handleResendReceipt(order.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-line bg-elev px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-brand-500/50 transition"
                        title="Resend receipt to your Google email"
                      >
                        {resendingId === order.id ? (
                          <Loader2 size={13} className="animate-spin text-brand-500" />
                        ) : (
                          <Send size={13} className="text-brand-400" />
                        )}
                        <span>Resend Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Resend status notice */}
                  {resendStatus[order.id] && (
                    <div className="mt-3 rounded-xl bg-brand-500/10 border border-brand-500/30 p-2 text-xs text-brand-400 font-semibold">
                      {resendStatus[order.id]}
                    </div>
                  )}

                  {/* Line Items */}
                  <div className="py-4 space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-text)]">
                          {item.quantity}x <strong>{item.product_title}</strong>
                        </span>
                        <span className="font-mono text-brand-400 font-bold">{peso(Number(item.subtotal))}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Financial Footer */}
                  <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="text-[var(--color-text-subtle)]">
                      <span>Delivery: {order.delivery_method === 'butuan-express' ? 'Same-Day Butuan' : 'Nationwide Cargo'}</span>
                      <span className="mx-2">•</span>
                      <span>Payment: {order.payment_method.toUpperCase()}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-[var(--color-text-muted)] font-semibold">Total Amount:</span>
                      <b className="font-head text-base font-black text-brand-400">{peso(Number(order.total_amount))}</b>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* QR Modal for paying later */}
      {activeQrModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-3xl border border-brand-500/50 bg-card p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setActiveQrModal(null)}
              className="absolute right-4 top-4 text-xs text-[var(--color-text-muted)] hover:text-white"
            >
              ✕
            </button>
            <span className="eyebrow text-xs">Scan &amp; Pay via QR Ph</span>
            <h3 className="font-head text-xl font-bold mt-1 text-[var(--color-text)]">
              {peso(activeQrModal.amount)}
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Compatible with GCash, Maya, ShopeePay, and any QR Ph banking app.
            </p>

            {/* White Tile with Padding */}
            <div className="my-5 rounded-2xl bg-white p-4 shadow-lg mx-auto w-fit">
              <img
                src={activeQrModal.qrCodeUrl}
                alt="QR Ph Payment Code"
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={activeQrModal.qrCodeUrl}
                download={`lifting-zone-qr-${activeQrModal.orderNumber}.png`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-400 font-bold hover:underline"
              >
                Save QR Image to Gallery
              </a>
              <button
                onClick={() => {
                  setActiveQrModal(null)
                  fetchOrders()
                }}
                className="btn !py-2 text-xs mt-2"
              >
                Done / I Have Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
