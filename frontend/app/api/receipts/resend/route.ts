import { NextResponse } from 'next/server'
import { requireUser, handleAuthError } from '../../../../lib/supabase/auth-guard'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { createClient as createServerSupabase } from '../../../../lib/supabase/server'
import { sendOrderReceipt } from '../../../../lib/email/gmail'

// In-memory rate limiting map: orderId -> lastSentTimestamp
const resendRateLimitMap = new Map<string, number>()

export async function POST(req: Request) {
  let authContext
  try {
    authContext = await requireUser(req)
  } catch (err) {
    return handleAuthError(err)
  }

  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 })
    }

    const supabase: any = createAdminClient() || createServerSupabase()
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    // Authorization: Must be the customer who placed the order OR an admin
    const isOwner = order.user_id === authContext.user.id
    const isAdmin = authContext.profile.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    // Rate limiting: 60-second cooldown per order
    const now = Date.now()
    const lastSent = resendRateLimitMap.get(order.id) || 0
    if (now - lastSent < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSent)) / 1000)
      return NextResponse.json(
        { success: false, message: `Please wait ${waitSeconds} seconds before resending receipt` },
        { status: 429 }
      )
    }

    resendRateLimitMap.set(order.id, now)

    const result = await sendOrderReceipt(order.id, { forceResend: true })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || 'Failed to resend receipt' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Receipt successfully sent to ${order.customer_email}`,
      messageId: result.messageId
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Resend failed' }, { status: 500 })
  }
}
