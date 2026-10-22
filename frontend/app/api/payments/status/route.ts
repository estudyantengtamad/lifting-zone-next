import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { createClient as createServerSupabase } from '../../../../lib/supabase/server'
import { queryPaymongoPaymentIntent } from '../../../../lib/payments/paymongo'
import { sendOrderReceipt } from '../../../../lib/email/gmail'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const orderId = url.searchParams.get('orderId')
    const orderNumber = url.searchParams.get('orderNumber')

    if (!orderId && !orderNumber) {
      return NextResponse.json({ success: false, message: 'orderId or orderNumber required' }, { status: 400 })
    }

    const supabase: any = createAdminClient() || createServerSupabase()

    let query = supabase.from('orders').select('*')
    if (orderId) query = query.eq('id', orderId)
    else if (orderNumber) query = query.eq('order_number', orderNumber)

    const { data: order, error } = await query.maybeSingle()

    if (error || !order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    // If order is still unpaid or pending, and has a payment intent, reconcile directly with PayMongo
    if (
      (order.payment_status === 'unpaid' || order.payment_status === 'pending') &&
      order.payment_intent_id
    ) {
      const pmStatus = await queryPaymongoPaymentIntent(order.payment_intent_id)

      if (pmStatus && pmStatus.isPaid) {
        const paidAt = pmStatus.paidAt || new Date().toISOString()

        // 1. Mark paid in database
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'Paid & Queued for Priority Packing',
            paid_at: paidAt
          })
          .eq('id', order.id)

        // 2. Dispatch receipt via Gmail API (send-once guaranteed)
        sendOrderReceipt(order.id).catch(err => {
          console.warn('Background receipt dispatch notice:', err)
        })

        order.payment_status = 'paid'
        order.status = 'Paid & Queued for Priority Packing'
        order.paid_at = paidAt
      } else if (order.qr_expires_at && new Date(order.qr_expires_at).getTime() < Date.now()) {
        await supabase
          .from('orders')
          .update({ payment_status: 'expired' })
          .eq('id', order.id)
        order.payment_status = 'expired'
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      status: order.status,
      paidAt: order.paid_at,
      receiptSentAt: order.receipt_sent_at,
      qrExpiresAt: order.qr_expires_at,
      qrCodeUrl: order.qr_code_url,
      totalAmount: Number(order.total_amount)
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
