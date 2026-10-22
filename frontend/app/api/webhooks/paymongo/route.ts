import { NextResponse } from 'next/server'
import { verifyPaymongoSignature } from '../../../../lib/payments/paymongo'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { createClient as createServerSupabase } from '../../../../lib/supabase/server'
import { sendOrderReceipt } from '../../../../lib/email/gmail'

export async function POST(req: Request) {
  try {
    // 1. Read raw body text for accurate cryptographic signature check
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('Paymongo-Signature') || req.headers.get('paymongo-signature')

    // 2. Cryptographic signature verification
    const isValidSignature = verifyPaymongoSignature(rawBody, signatureHeader)
    if (!isValidSignature) {
      console.warn('PayMongo Webhook rejected: Invalid HMAC signature')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    // 3. Parse JSON event payload
    const event = JSON.parse(rawBody)
    const eventType = event.data?.attributes?.type
    const eventId = event.data?.id
    const resourceData = event.data?.attributes?.data

    if (!eventType || !resourceData) {
      return NextResponse.json({ error: 'Malformed webhook event' }, { status: 400 })
    }

    const supabase: any = createAdminClient() || createServerSupabase()

    // 4. Idempotency Audit: Check if this event ID has already been recorded
    if (eventId) {
      const { data: existingEvent } = await supabase
        .from('payment_events')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle()

      if (existingEvent) {
        return NextResponse.json({ success: true, message: 'Event already processed (idempotent)' }, { status: 200 })
      }
    }

    // 5. Locate target order using payment_intent_id or payment_ref
    const paymentIntentId =
      resourceData.attributes?.payment_intent_id ||
      (resourceData.type === 'payment_intent' ? resourceData.id : null)

    let order = null
    if (paymentIntentId) {
      const { data: found } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle()
      order = found
    }

    // Log the event into payment_events audit table
    await supabase.from('payment_events').insert({
      order_id: order?.id || null,
      event_type: eventType,
      event_id: eventId || null,
      payload: event
    })

    if (!order) {
      // Return 200 so PayMongo does not keep retrying non-order events
      return NextResponse.json({ success: true, message: 'Event received without matching order' }, { status: 200 })
    }

    // 6. Handle event types
    if (eventType === 'payment.paid') {
      // Idempotent: Only process if not already marked paid
      if (order.payment_status !== 'paid') {
        const paidAt = resourceData.attributes?.paid_at
          ? new Date(resourceData.attributes.paid_at * 1000).toISOString()
          : new Date().toISOString()

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'Paid & Queued for Priority Packing',
            paid_at: paidAt
          })
          .eq('id', order.id)

        // Send email receipt (send-once guaranteed; failures are caught and logged)
        try {
          await sendOrderReceipt(order.id)
        } catch (receiptErr) {
          console.warn('Receipt error during webhook execution:', receiptErr)
        }
      }
    } else if (eventType === 'payment.failed') {
      if (order.payment_status !== 'paid') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'Payment Failed — Action Required'
          })
          .eq('id', order.id)
      }
    } else if (eventType === 'qrph.expired') {
      if (order.payment_status !== 'paid') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'expired',
            status: 'QR Code Expired'
          })
          .eq('id', order.id)
      }
    }

    return NextResponse.json({ success: true, eventId }, { status: 200 })
  } catch (err: any) {
    console.error('PayMongo webhook handler error:', err)
    // Return 200 or 500
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
