import { createAdminClient } from '../supabase/admin'
import { createClient as createServerSupabase } from '../supabase/server'
import { peso } from '../data'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeHeader(val: string): string {
  // Strip CR and LF characters to prevent MIME header injection attacks
  return val.replace(/[\r\n]/g, '').trim()
}

/**
 * Exchange Google OAuth refresh token for a short-lived access token
 */
async function getGmailAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail API OAuth environment variables are missing (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(`Gmail OAuth token error: ${data.error_description || data.error || 'Failed to refresh token'}`)
  }

  return data.access_token
}

/**
 * Encodes string to Base64URL without padding as required by Gmail API
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Sends a structured order receipt via Gmail API (scope: gmail.send).
 * Guarantees send-once idempotency unless forceResend is true.
 * Failure to send will update receipt_error on the order and return safely
 * without throwing, so webhook completion is never blocked.
 */
export async function sendOrderReceipt(
  orderId: string,
  options: { forceResend?: boolean } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase: any = createAdminClient() || createServerSupabase()

  // 1. Fetch order details
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return { success: false, error: 'Order not found' }
  }

  // 2. Send-once claim check (Idempotency)
  if (!options.forceResend && order.receipt_sent_at) {
    return {
      success: true,
      error: 'Receipt already sent previously for this order (idempotent skip)'
    }
  }

  const recipientEmail = sanitizeHeader(order.customer_email || '')
  if (!recipientEmail || !recipientEmail.includes('@')) {
    const errorMsg = 'No valid customer Gmail address attached to order'
    await supabase.from('orders').update({ receipt_error: errorMsg }).eq('id', orderId)
    return { success: false, error: errorMsg }
  }

  // 3. Fetch order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)

  const senderAddress = sanitizeHeader(process.env.GMAIL_SENDER_ADDRESS || 'orders@liftingzone.ph')
  const senderName = sanitizeHeader(process.env.GMAIL_SENDER_NAME || 'Lifting Zone Obrero')
  const safeCustomerName = sanitizeHeader(order.customer_name || 'Lifter')
  const safeOrderNumber = sanitizeHeader(order.order_number)
  const safeSubject = sanitizeHeader(`Order Receipt #${safeOrderNumber} — Lifting Zone Obrero`)

  // Plain-text fallback alternative
  const plainTextItems = (items || [])
    .map(it => `• ${it.quantity}x ${it.product_title} — ${peso(Number(it.subtotal))}`)
    .join('\n')

  const plainTextBody = `
LIFTING ZONE OBRERO — OFFICIAL ORDER RECEIPT
===================================================
Thank you, ${safeCustomerName}!
Order Number: ${safeOrderNumber}
Status: ${order.payment_status.toUpperCase()} (${order.status})
Date: ${new Date(order.created_at).toLocaleString('en-PH')}
Delivery: ${order.delivery_method === 'butuan-express' ? 'Same-Day Butuan Express' : 'Nationwide Doorstep Cargo'}
Address: ${order.customer_address}

ITEMS PURCHASED:
${plainTextItems}

Subtotal: ${peso(Number(order.subtotal))}
Discount: -${peso(Number(order.discount_amount || 0))}
Shipping: ${peso(Number(order.shipping_fee || 0))}
TOTAL PAID: ${peso(Number(order.total_amount))}

Store Location: Salvador Calo St., Obrero, Butuan City, Agusan del Norte
Need assistance? Reply directly to this email or visit our showroom daily 8:00 AM – 9:00 PM.
`.trim()

  // High-contrast HTML receipt template
  const itemsRowsHtml = (items || [])
    .map(
      it => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #233828; color: #ffffff; font-size: 14px;">
          <strong>${escapeHtml(it.product_title)}</strong>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #233828; color: #e8f0ea; font-size: 14px; text-align: center;">
          ${it.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #233828; color: #16c45a; font-weight: bold; font-size: 14px; text-align: right;">
          ${peso(Number(it.subtotal))}
        </td>
      </tr>
    `
    )
    .join('')

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lifting Zone Receipt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e8f0ea;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050806; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0b140e; border: 1px solid #1a3822; border-radius: 20px; overflow: hidden; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #1a3822;">
              <div style="display: inline-block; background-color: #16c45a; color: #000000; font-weight: 900; font-size: 11px; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 2px;">
                VERIFIED LIFTER RECEIPT
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 12px 0 4px; letter-spacing: -0.5px;">
                LIFTING <span style="color: #16c45a; font-style: italic;">ZONE</span> OBRERO
              </h1>
              <p style="color: #8fa895; font-size: 12px; margin: 0;">
                Salvador Calo St., Obrero, Butuan City • Authentic Sports Nutrition &amp; Commercial Iron
              </p>
            </td>
          </tr>

          <!-- Order Summary Card -->
          <tr>
            <td style="padding: 24px 0 16px;">
              <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px;">
                Hello <strong>${escapeHtml(safeCustomerName)}</strong>,
              </p>
              <p style="font-size: 14px; color: #b5c7ba; line-height: 1.5; margin: 0 0 18px;">
                Your order has been confirmed and queued for priority packing. Below is your official transaction receipt.
              </p>

              <table width="100%" style="background-color: #061108; border: 1px solid #1a3822; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #8fa895; padding-bottom: 6px;">Order Number:</td>
                  <td align="right" style="font-size: 13px; font-weight: bold; color: #16c45a; font-family: monospace; padding-bottom: 6px;">
                    ${escapeHtml(safeOrderNumber)}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #8fa895; padding-bottom: 6px;">Payment Method:</td>
                  <td align="right" style="font-size: 12px; font-weight: bold; color: #ffffff; text-transform: uppercase; padding-bottom: 6px;">
                    ${escapeHtml(order.payment_method)} (${escapeHtml(order.payment_status)})
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #8fa895;">Delivery ETA:</td>
                  <td align="right" style="font-size: 12px; color: #ffffff;">
                    ${escapeHtml(order.delivery_method === 'butuan-express' ? 'Same-Day Motorbike Express' : 'Nationwide Doorstep Cargo')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 1px solid #1a3822;">
                    <th align="left" style="padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8fa895;">Item</th>
                    <th align="center" style="padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8fa895;">Qty</th>
                    <th align="right" style="padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8fa895;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="border-top: 1px solid #1a3822; padding-top: 16px;">
              <table width="100%" style="font-size: 13px;">
                <tr>
                  <td style="color: #8fa895; padding-bottom: 6px;">Subtotal</td>
                  <td align="right" style="color: #ffffff; padding-bottom: 6px;">${peso(Number(order.subtotal))}</td>
                </tr>
                ${
                  Number(order.discount_amount) > 0
                    ? `<tr>
                        <td style="color: #16c45a; padding-bottom: 6px;">Discount Voucher (${escapeHtml(order.coupon_code || '')})</td>
                        <td align="right" style="color: #16c45a; padding-bottom: 6px;">-${peso(Number(order.discount_amount))}</td>
                      </tr>`
                    : ''
                }
                <tr>
                  <td style="color: #8fa895; padding-bottom: 10px;">Shipping Fee</td>
                  <td align="right" style="color: #ffffff; padding-bottom: 10px;">${peso(Number(order.shipping_fee || 0))}</td>
                </tr>
                <tr style="border-top: 1px solid #233828;">
                  <td style="color: #ffffff; font-size: 16px; font-weight: bold; padding-top: 10px;">Total Paid</td>
                  <td align="right" style="color: #16c45a; font-size: 18px; font-weight: 900; padding-top: 10px;">
                    ${peso(Number(order.total_amount))}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; border-top: 1px solid #1a3822; margin-top: 24px;">
              <p style="font-size: 12px; color: #8fa895; margin: 0 0 6px;">
                Dispatching from <strong>Salvador Calo St., Obrero, Butuan City</strong>
              </p>
              <p style="font-size: 11px; color: #556c5c; margin: 0;">
                All supplements tamper-evident sealed • Calibrated competition iron
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  // Build RFC 2822 Multipart/Alternative MIME message
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`
  const rawMime = [
    `From: "${senderName}" <${senderAddress}>`,
    `To: <${recipientEmail}>`,
    `Subject: ${safeSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainTextBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`
  ].join('\r\n')

  try {
    const accessToken = await getGmailAccessToken()
    const rawEncoded = base64UrlEncode(rawMime)

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawEncoded })
    })

    const gmailData = await gmailRes.json()

    if (!gmailRes.ok || !gmailData.id) {
      const errMsg = gmailData.error?.message || 'Failed to send message via Gmail API'
      await supabase.from('orders').update({ receipt_error: errMsg }).eq('id', orderId)
      return { success: false, error: errMsg }
    }

    // Record successful dispatch
    await supabase
      .from('orders')
      .update({
        receipt_sent_at: new Date().toISOString(),
        receipt_error: null
      })
      .eq('id', orderId)

    return { success: true, messageId: gmailData.id }
  } catch (err: any) {
    console.warn('Gmail receipt delivery error:', err)
    // Non-blocking: update receipt_error in database
    await supabase
      .from('orders')
      .update({ receipt_error: err.message || 'Unknown Gmail API error' })
      .eq('id', orderId)

    return { success: false, error: err.message }
  }
}

/**
 * Sends a lightweight test email directly to the given address to verify Gmail API setup
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const accessToken = await getGmailAccessToken()
    const senderAddress = sanitizeHeader(process.env.GMAIL_SENDER_ADDRESS || 'orders@liftingzone.ph')
    const senderName = sanitizeHeader(process.env.GMAIL_SENDER_NAME || 'Lifting Zone Obrero')
    const safeRecipient = sanitizeHeader(toEmail)
    const subject = sanitizeHeader('⚡ Lifting Zone Obrero — Gmail API Connection Verified!')

    const body = [
      'LIFTING ZONE OBRERO — GMAIL API INTEGRATION TEST',
      '===================================================',
      'Success! Your website is now fully connected to the Google Gmail API.',
      `Sender Address: ${senderAddress}`,
      `Authorized User: ${senderName}`,
      `Timestamp: ${new Date().toLocaleString('en-PH')}`,
      '',
      'All customer orders will now receive instant, automated digital receipts.',
      'Salvador Calo St., Obrero, Butuan City'
    ].join('\n')

    const rawMime = [
      `From: "${senderName}" <${senderAddress}>`,
      `To: <${safeRecipient}>`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body
    ].join('\r\n')

    const rawEncoded = base64UrlEncode(rawMime)

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawEncoded })
    })

    const gmailData = await gmailRes.json()

    if (!gmailRes.ok || !gmailData.id) {
      return { success: false, error: gmailData.error?.message || 'Failed to dispatch test message' }
    }

    return { success: true, messageId: gmailData.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown Gmail API error' }
  }
}

