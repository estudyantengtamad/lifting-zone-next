import crypto from 'crypto'
import { createAdminClient } from '../supabase/admin'
import { createClient as createServerSupabase } from '../supabase/server'

const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1'

function getAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!secretKey) {
    throw new Error('PAYMONGO_SECRET_KEY is not configured')
  }
  return 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
}

export interface PaymongoQrResult {
  success: boolean
  orderId: string
  orderNumber: string
  qrCodeUrl: string
  expiresAt: string
  amount: number
  reusedExisting: boolean
  error?: string
}

/**
 * Creates or retrieves a live QR Ph code for an order.
 * Guarantees that amount is taken from the database order, and an order
 * never has two concurrent payable QR codes.
 */
export async function createOrGetQrForOrder(orderId: string): Promise<PaymongoQrResult> {
  const supabase: any = createAdminClient() || createServerSupabase()

  // 1. Fetch order directly from the database (Amount source of truth)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    throw new Error('Order not found in database')
  }

  // If already paid, reject QR generation
  if (order.payment_status === 'paid') {
    throw new Error('Order has already been paid')
  }

  // 2. Reuse check: If a live, unexpired QR code already exists, reuse it
  const now = new Date()
  if (
    order.payment_intent_id &&
    order.qr_code_url &&
    order.qr_expires_at &&
    new Date(order.qr_expires_at).getTime() > now.getTime() + 60 * 1000 // at least 1 min remaining
  ) {
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      qrCodeUrl: order.qr_code_url,
      expiresAt: order.qr_expires_at,
      amount: Number(order.total_amount),
      reusedExisting: true
    }
  }

  // 3. Amount validation (PayMongo QR Ph minimum is ₱20)
  const totalAmount = Number(order.total_amount)
  if (totalAmount < 20) {
    throw new Error('PayMongo QR Ph requires a minimum order amount of ₱20.00')
  }
  const amountCentavos = Math.round(totalAmount * 100)

  const secretKey = process.env.PAYMONGO_SECRET_KEY
  const isSecretConfigured = Boolean(secretKey && !secretKey.includes('placeholder') && !secretKey.includes('your-paymongo'))

  if (!isSecretConfigured) {
    const staticExpiresAt = new Date(Date.now() + 1800 * 1000).toISOString()
    await supabase
      .from('orders')
      .update({
        qr_code_url: '/qr-ph.png',
        qr_expires_at: staticExpiresAt,
        payment_status: 'pending',
        status: 'Awaiting QR Ph Payment'
      })
      .eq('id', orderId)

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      qrCodeUrl: '/qr-ph.png',
      expiresAt: staticExpiresAt,
      amount: totalAmount,
      reusedExisting: false
    }
  }

  try {
    // 4. Create Payment Intent with PayMongo
    const intentRes = await fetch(`${PAYMONGO_BASE_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountCentavos,
            payment_method_allowed: ['qrph'],
            currency: 'PHP',
            description: `Lifting Zone Order ${order.order_number}`,
            statement_descriptor: 'LiftingZone'
          }
        }
      })
    })

    const intentData = await intentRes.json()
    if (!intentRes.ok || !intentData.data?.id) {
      const errMsg = intentData.errors?.[0]?.detail || 'Failed to create PayMongo payment intent'
      throw new Error(errMsg)
    }

    const paymentIntentId = intentData.data.id
    const clientKey = intentData.data.attributes.client_key

    // 5. Create Payment Method (type: qrph)
    const expirySeconds = 1800 // 30 minutes
    const methodRes = await fetch(`${PAYMONGO_BASE_URL}/payment_methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'qrph',
            expiry_seconds: expirySeconds
          }
        }
      })
    })

    const methodData = await methodRes.json()
    if (!methodRes.ok || !methodData.data?.id) {
      const errMsg = methodData.errors?.[0]?.detail || 'Failed to create PayMongo payment method'
      throw new Error(errMsg)
    }

    const paymentMethodId = methodData.data.id

    // 6. Attach Payment Method to Payment Intent
    const attachRes = await fetch(`${PAYMONGO_BASE_URL}/payment_intents/${paymentIntentId}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey
          }
        }
      })
    })

    const attachData = await attachRes.json()
    if (!attachRes.ok) {
      const errMsg = attachData.errors?.[0]?.detail || 'Failed to attach PayMongo QR payment'
      throw new Error(errMsg)
    }

    const nextAction = attachData.data?.attributes?.next_action
    const qrCodeUrl = nextAction?.code?.image_url || nextAction?.code?.url

    if (!qrCodeUrl) {
      throw new Error('PayMongo did not return a valid QR code image')
    }

    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString()

    // 7. Update the order with live payment intent and QR metadata
    await supabase
      .from('orders')
      .update({
        payment_intent_id: paymentIntentId,
        payment_ref: paymentMethodId,
        qr_code_url: qrCodeUrl,
        qr_expires_at: expiresAt,
        payment_status: 'pending'
      })
      .eq('id', orderId)

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      qrCodeUrl,
      expiresAt,
      amount: totalAmount,
      reusedExisting: false
    }
  } catch (apiErr: any) {
    console.warn('PayMongo dynamic QR call failed, falling back to merchant QR Ph:', apiErr)
    const staticExpiresAt = new Date(Date.now() + 1800 * 1000).toISOString()
    await supabase
      .from('orders')
      .update({
        qr_code_url: '/qr-ph.png',
        qr_expires_at: staticExpiresAt,
        payment_status: 'pending',
        status: 'Awaiting QR Ph Payment'
      })
      .eq('id', orderId)

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      qrCodeUrl: '/qr-ph.png',
      expiresAt: staticExpiresAt,
      amount: totalAmount,
      reusedExisting: false
    }
  }
}

/**
 * Validates the Paymongo-Signature header against the raw body using HMAC-SHA256
 * Format: t=timestamp,te=test_signature,li=live_signature
 */
export function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKey = process.env.PAYMONGO_WEBHOOK_SECRET
): boolean {
  if (!signatureHeader || !secretKey) {
    return false
  }

  try {
    const parts = signatureHeader.split(',').reduce((acc, part) => {
      const [key, val] = part.trim().split('=')
      if (key && val) acc[key] = val
      return acc
    }, {} as Record<string, string>)

    const timestamp = parts.t
    const testSignature = parts.te
    const liveSignature = parts.li

    if (!timestamp || (!testSignature && !liveSignature)) {
      return false
    }

    // Protect against replay attacks (5 minute threshold)
    const timeDelta = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (isNaN(timeDelta) || timeDelta > 300) {
      return false
    }

    const payloadToSign = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payloadToSign)
      .digest('hex')

    // Constant-time comparison
    const sigToCompare = liveSignature || testSignature
    const expectedBuf = Buffer.from(expectedSignature)
    const actualBuf = Buffer.from(sigToCompare)

    if (expectedBuf.length !== actualBuf.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf)
  } catch (err) {
    console.warn('PayMongo signature verification error:', err)
    return false
  }
}

/**
 * Check payment intent directly with PayMongo API for status reconciliation
 */
export async function queryPaymongoPaymentIntent(paymentIntentId: string) {
  try {
    const res = await fetch(`${PAYMONGO_BASE_URL}/payment_intents/${paymentIntentId}`, {
      headers: {
        Authorization: getAuthHeader()
      }
    })
    const data = await res.json()
    if (!res.ok) return null

    const status = data.data?.attributes?.status // 'succeeded', 'awaiting_payment_method', 'processing', 'cancelled'
    const payments = data.data?.attributes?.payments || []

    return {
      status,
      isPaid: status === 'succeeded',
      paymentId: payments[0]?.id || null,
      paidAt: payments[0]?.attributes?.paid_at ? new Date(payments[0].attributes.paid_at * 1000).toISOString() : null
    }
  } catch (err) {
    console.warn('Error querying PayMongo intent:', err)
    return null
  }
}
