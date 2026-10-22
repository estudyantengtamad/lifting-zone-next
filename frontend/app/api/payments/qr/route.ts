import { NextResponse } from 'next/server'
import { requireUser, handleAuthError } from '../../../../lib/supabase/auth-guard'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { createClient as createServerSupabase } from '../../../../lib/supabase/server'
import { createOrGetQrForOrder } from '../../../../lib/payments/paymongo'

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

    // Verify ownership or admin privileges
    if (order.user_id !== authContext.user.id && authContext.profile.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized access to this order' }, { status: 403 })
    }

    const qrResult = await createOrGetQrForOrder(order.id)
    return NextResponse.json(qrResult)
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to generate QR' }, { status: 500 })
  }
}
