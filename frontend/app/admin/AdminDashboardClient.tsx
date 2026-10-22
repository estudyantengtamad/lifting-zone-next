'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Shield,
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Package,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { peso } from '../../lib/data'
import Header from '../../components/Header'
import DotField from '../../components/DotField'

export default function AdminDashboardClient() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [checkingPaymentId, setCheckingPaymentId] = useState<string | null>(null)
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<{ [id: string]: string }>({})

  const fetchOrders = async () => {
    setLoading(true)
    try {
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
      console.warn('Admin orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleCheckPayment = async (orderId: string) => {
    setCheckingPaymentId(orderId)
    setActionNotice(prev => ({ ...prev, [orderId]: 'Polling PayMongo...' }))

    try {
      const res = await fetch(`/api/payments/status?orderId=${orderId}`)
      const data = await res.json()

      if (data.success) {
        setActionNotice(prev => ({
          ...prev,
          [orderId]: `Status: ${data.paymentStatus.toUpperCase()} (${data.status})`
        }))
        // Refresh local orders list to show updated status
        fetchOrders()
      } else {
        setActionNotice(prev => ({ ...prev, [orderId]: data.message || 'Check failed' }))
      }
    } catch {
      setActionNotice(prev => ({ ...prev, [orderId]: 'Network error polling payment' }))
    } finally {
      setCheckingPaymentId(null)
    }
  }

  const handleResendReceipt = async (orderId: string) => {
    setResendingReceiptId(orderId)
    setActionNotice(prev => ({ ...prev, [orderId]: 'Dispatching Gmail receipt...' }))

    try {
      const res = await fetch('/api/receipts/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const data = await res.json()

      if (data.success) {
        setActionNotice(prev => ({ ...prev, [orderId]: 'Receipt sent via Gmail API!' }))
        fetchOrders()
      } else {
        setActionNotice(prev => ({ ...prev, [orderId]: data.message || 'Resend error' }))
      }
    } catch {
      setActionNotice(prev => ({ ...prev, [orderId]: 'Network error resending receipt' }))
    } finally {
      setResendingReceiptId(null)
    }
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchFilter =
        filter === 'all' ||
        (filter === 'paid' && o.payment_status === 'paid') ||
        (filter === 'pending' && (o.payment_status === 'pending' || o.payment_status === 'unpaid')) ||
        (filter === 'expired' && o.payment_status === 'expired') ||
        (filter === 'failed' && o.payment_status === 'failed')

      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q)

      return matchFilter && matchSearch
    })
  }, [orders, filter, search])

  // Key metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.payment_status === 'paid')
      .reduce((acc, o) => acc + Number(o.total_amount || 0), 0)
  }, [orders])

  const paidCount = orders.filter(o => o.payment_status === 'paid').length
  const pendingCount = orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'unpaid').length

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <DotField />
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <a href="/" className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:underline mb-2">
              <ArrowLeft size={14} /> Back to Storefront
            </a>
            <h1 className="font-head text-3xl font-black flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400 text-black shadow-neon">
                <Shield size={18} />
              </span>
              Store <span className="neon italic">Operations &amp; Orders</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Live PayMongo QR Ph payment reconciliation, order tracking &amp; Gmail receipt manager.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/#inventory-admin"
              className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2 text-xs font-bold text-brand-400 hover:border-brand-500 transition"
            >
              <Package size={14} />
              <span>Inventory Manager</span>
            </a>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="my-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
            <span className="text-[11px] text-[var(--color-text-subtle)] font-bold uppercase tracking-wider block">
              Paid Volume
            </span>
            <b className="font-head text-2xl font-black text-brand-400 mt-1 block">
              {peso(totalRevenue)}
            </b>
            <small className="text-[10px] text-[var(--color-text-muted)]">From {paidCount} completed orders</small>
          </div>

          <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
            <span className="text-[11px] text-[var(--color-text-subtle)] font-bold uppercase tracking-wider block">
              Total Orders
            </span>
            <b className="font-head text-2xl font-black text-[var(--color-text)] mt-1 block">
              {orders.length}
            </b>
            <small className="text-[10px] text-[var(--color-text-muted)]">Across Butuan &amp; nationwide</small>
          </div>

          <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
            <span className="text-[11px] text-[var(--color-text-subtle)] font-bold uppercase tracking-wider block">
              Pending / Unpaid
            </span>
            <b className="font-head text-2xl font-black text-amber-400 mt-1 block">
              {pendingCount}
            </b>
            <small className="text-[10px] text-[var(--color-text-muted)]">Awaiting QR scan or confirmation</small>
          </div>

          <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
            <span className="text-[11px] text-[var(--color-text-subtle)] font-bold uppercase tracking-wider block">
              Payment Settlement
            </span>
            <b className="font-head text-2xl font-black text-brand-400 mt-1 block">
              {orders.length ? Math.round((paidCount / orders.length) * 100) : 0}%
            </b>
            <small className="text-[10px] text-[var(--color-text-muted)]">Settlement conversion rate</small>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All Orders'],
              ['paid', 'Paid'],
              ['pending', 'Pending / Unpaid'],
              ['expired', 'Expired QR'],
              ['failed', 'Failed']
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  filter === k
                    ? 'bg-brand-500 text-[var(--color-btn-text)] shadow-neon'
                    : 'border border-line bg-card text-[var(--color-text-muted)] hover:border-brand-500/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--color-text-subtle)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order #, Name, Gmail..."
              className="w-full rounded-full border border-line bg-card py-2 pl-9 pr-3 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-3xl border border-line bg-card shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-elev/50 text-[11px] uppercase tracking-wider text-[var(--color-text-subtle)]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Order Details</th>
                <th className="py-3.5 px-4 font-bold">Customer &amp; Gmail</th>
                <th className="py-3.5 px-4 font-bold">Payment &amp; Gateway</th>
                <th className="py-3.5 px-4 font-bold">Total Amount</th>
                <th className="py-3.5 px-4 font-bold">Receipt Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--color-text-muted)]">
                    <Loader2 className="animate-spin text-brand-500 mx-auto mb-2" size={24} />
                    Loading orders ledger...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                    No orders match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isPaid = order.payment_status === 'paid'

                  return (
                    <tr key={order.id} className="hover:bg-elev/40 transition">
                      <td className="py-4 px-4 align-top">
                        <span className="font-mono font-black text-brand-400 block">{order.order_number}</span>
                        <small className="text-[10px] text-[var(--color-text-subtle)] block mt-0.5">
                          {new Date(order.created_at).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                        </small>
                        <span className="text-[10px] text-[var(--color-text-muted)] block mt-1">
                          {order.delivery_method === 'butuan-express' ? '🛵 Butuan Express' : '📦 Nationwide'}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <span className="font-semibold text-[var(--color-text)] block">{order.customer_name}</span>
                        <span className="text-[11px] text-brand-400 block truncate max-w-[180px]">{order.customer_email || 'No email'}</span>
                        <small className="text-[10px] text-[var(--color-text-subtle)] block">{order.customer_phone}</small>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                              : order.payment_status === 'expired'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] block mt-1">
                          {order.payment_method}
                        </span>
                        {order.payment_intent_id && (
                          <small className="font-mono text-[9px] text-[var(--color-text-subtle)] block truncate max-w-[140px]" title={order.payment_intent_id}>
                            {order.payment_intent_id}
                          </small>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top">
                        <b className="font-head text-sm font-black text-brand-400 block">{peso(Number(order.total_amount))}</b>
                        <small className="text-[10px] text-[var(--color-text-subtle)]">
                          Sub: {peso(Number(order.subtotal))}
                        </small>
                      </td>

                      <td className="py-4 px-4 align-top">
                        {order.receipt_sent_at ? (
                          <span className="flex items-center gap-1 text-[11px] text-brand-400 font-semibold">
                            <CheckCircle2 size={13} />
                            <span>Sent</span>
                          </span>
                        ) : order.receipt_error ? (
                          <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold" title={order.receipt_error}>
                            <AlertCircle size={13} />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-subtle)]">Pending</span>
                        )}
                        {order.receipt_sent_at && (
                          <small className="text-[9px] text-[var(--color-text-subtle)] block">
                            {new Date(order.receipt_sent_at).toLocaleTimeString('en-PH', { timeStyle: 'short' })}
                          </small>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Re-check Payment Action */}
                          {order.payment_intent_id && (
                            <button
                              disabled={checkingPaymentId === order.id}
                              onClick={() => handleCheckPayment(order.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-elev px-2.5 py-1 text-[10px] font-bold text-[var(--color-text)] hover:border-brand-500 transition"
                              title="Query PayMongo API directly"
                            >
                              <RefreshCw size={11} className={checkingPaymentId === order.id ? 'animate-spin text-brand-500' : ''} />
                              <span>Re-check Pay</span>
                            </button>
                          )}

                          {/* Resend Receipt Action */}
                          <button
                            disabled={resendingReceiptId === order.id}
                            onClick={() => handleResendReceipt(order.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-elev px-2.5 py-1 text-[10px] font-bold text-brand-400 hover:border-brand-500 transition"
                            title="Resend receipt email via Gmail API"
                          >
                            <Send size={11} className={resendingReceiptId === order.id ? 'animate-spin' : ''} />
                            <span>Resend Receipt</span>
                          </button>
                        </div>

                        {actionNotice[order.id] && (
                          <span className="text-[10px] text-brand-400 block mt-1.5 font-bold">
                            {actionNotice[order.id]}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
