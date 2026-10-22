import { NextResponse } from 'next/server'
import { sendTestEmail } from '../../../../lib/email/gmail'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const toEmail = body.to || process.env.GMAIL_SENDER_ADDRESS || 'kv.alegrado@gmail.com'

    const result = await sendTestEmail(toEmail)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${toEmail}`,
      messageId: result.messageId
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const toEmail = process.env.GMAIL_SENDER_ADDRESS || 'kv.alegrado@gmail.com'
  const result = await sendTestEmail(toEmail)
  return NextResponse.json(result)
}
