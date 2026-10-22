import { NextResponse } from 'next/server'
import { requireUser, handleAuthError } from '../../../lib/supabase/auth-guard'
import { createAdminClient } from '../../../lib/supabase/admin'
import { createClient as createServerSupabase } from '../../../lib/supabase/server'
import { products as localProducts } from '../../../lib/data'
import { createOrGetQrForOrder } from '../../../lib/payments/paymongo'
import { sendOrderReceipt } from '../../../lib/email/gmail'

export async function POST(req: Request) {
  // 1. Enforce Authentication (Receipt goes to the user's login email)
  let authContext
  try {
    authContext = await requireUser(req)
  } catch (err) {
    return handleAuthError(err)
  }

  try {
    const body = await req.json()
    const { items, customer, deliveryMethod, paymentMethod, coupon } = body

    if (!items || !Object.keys(items).length) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 })
    }

    const supabase: any = createAdminClient() || createServerSupabase()

    // 2. Fetch authoritative product pricing from database / local catalog
    const { data: dbProducts } = await supabase.from('products').select('*')
    const catalog = dbProducts && dbProducts.length > 0 ? dbProducts : localProducts

    let recomputedSubtotal = 0
    const orderItemsToInsert: Array<{
      product_id: number | null
      product_title: string
      quantity: number
      unit_price: number
      subtotal: number
    }> = []

    for (const [idStr, quantityRaw] of Object.entries(items)) {
      const productId = Number(idStr)
      const qty = Math.max(1, Number(quantityRaw) || 1)
      const prod = catalog.find((p: any) => p.id === productId) as any

      if (prod) {
        const unitPrice = Number(prod.price ?? prod.p ?? 0)
        const lineSubtotal = unitPrice * qty
        recomputedSubtotal += lineSubtotal

        orderItemsToInsert.push({
          product_id: productId,
          product_title: prod.title ?? prod.t ?? `Product #${productId}`,
          quantity: qty,
          unit_price: unitPrice,
          subtotal: lineSubtotal
        })
      }
    }

    if (orderItemsToInsert.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid products in cart' }, { status: 400 })
    }

    // 3. Recompute discount on the server
    let discountAmount = 0
    let validatedCouponCode: string | null = null

    if (coupon?.code) {
      const { data: couponRecord }: { data: any } = await (supabase as any)
        .from('coupons')
        .select('*')
        .ilike('code', coupon.code.trim())
        .eq('active', true)
        .maybeSingle()

      if (couponRecord && couponRecord.discount_percent > 0) {
        discountAmount = Math.round(recomputedSubtotal * (couponRecord.discount_percent / 100))
        validatedCouponCode = couponRecord.code
      } else if (coupon.code.toUpperCase() === 'CHALK15') {
        discountAmount = Math.round(recomputedSubtotal * 0.15)
        validatedCouponCode = 'CHALK15'
      }
    }

    // 4. Compute shipping fee
    const subtotalAfterDiscount = Math.max(0, recomputedSubtotal - discountAmount)
    const isFreeShipping = subtotalAfterDiscount >= 3000
    const shippingFee = isFreeShipping
      ? 0
      : deliveryMethod === 'butuan-express'
      ? 120
      : 250

    const finalTotal = subtotalAfterDiscount + shippingFee
    const orderNumber = `LZO-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    // 5. Insert order into database
    const { data: createdOrder, error: insertErr }: { data: any; error: any } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: authContext.user.id,
        customer_email: authContext.user.email,
        customer_name: customer?.name || authContext.profile.full_name || 'Valued Lifter',
        customer_phone: customer?.phone || 'N/A',
        customer_address: customer?.address || 'Salvador Calo St., Obrero, Butuan City',
        delivery_method: deliveryMethod || 'butuan-express',
        payment_method: paymentMethod || 'cod',
        subtotal: recomputedSubtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        total_amount: finalTotal,
        coupon_code: validatedCouponCode,
        payment_status: paymentMethod === 'qrph' ? 'pending' : 'unpaid',
        status: paymentMethod === 'qrph' ? 'Awaiting QR Ph Payment' : 'Confirmed & Queued for Packing'
      })
      .select('*')
      .single()

    if (insertErr || !createdOrder) {
      console.error('Order creation error:', insertErr)
      return NextResponse.json({ success: false, message: 'Failed to record order' }, { status: 500 })
    }

    // 6. Insert line items
    const itemsWithOrderId = orderItemsToInsert.map(it => ({
      ...it,
      order_id: createdOrder.id
    }))
    await supabase.from('order_items').insert(itemsWithOrderId)

    const estimatedDelivery = deliveryMethod === 'butuan-express'
      ? 'Same-Day Motorbike Express (Within 2-4 Hours in Butuan City)'
      : 'Door-to-Door Cargo Express (2-3 Business Days nationwide)'

    // 7. Handle PayMongo QR Ph generation if selected
    let qrData = null
    if (paymentMethod === 'qrph') {
      try {
        qrData = await createOrGetQrForOrder(createdOrder.id)
      } catch (qrErr: any) {
        console.warn('PayMongo QR generation fallback:', qrErr)
        qrData = {
          success: true,
          orderId: createdOrder.id,
          orderNumber: createdOrder.order_number,
          qrCodeUrl: '/qr-ph.png',
          expiresAt: new Date(Date.now() + 1800 * 1000).toISOString(),
          amount: finalTotal,
          reusedExisting: false
        }
      }
    } else {
      // Cash on delivery: trigger automated receipt email immediately
      sendOrderReceipt(createdOrder.id).catch(err => {
        console.warn('Background COD receipt dispatch notice:', err)
      })
    }

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      customerName: createdOrder.customer_name,
      customerEmail: authContext.user.email,
      customerAddress: createdOrder.customer_address,
      totalAmount: finalTotal,
      subtotal: recomputedSubtotal,
      discountAmount,
      shippingFee,
      estimatedDelivery,
      paymentMethod,
      paymentStatus: createdOrder.payment_status,
      items: orderItemsToInsert,
      qrCodeUrl: qrData?.qrCodeUrl || null,
      qrExpiresAt: qrData?.expiresAt || null
    })
  } catch (err: any) {
    console.error('Checkout processing error:', err)
    return NextResponse.json({ success: false, message: err.message || 'Checkout failed' }, { status: 500 })
  }
}
