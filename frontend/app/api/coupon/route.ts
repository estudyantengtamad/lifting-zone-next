import { NextResponse } from 'next/server'

const COUPONS: Record<string, { percent: number; desc: string }> = {
  'LIFTZONE10': { percent: 10, desc: '10% Welcome Discount applied to entire order!' },
  'CHALK15': { percent: 15, desc: '15% Secret Chalk Scratch VIP Discount unlocked!' },
  'OBRERO20': { percent: 20, desc: '20% Butuan Lifter Community special discount!' },
  'CBUM25': { percent: 25, desc: '25% Olympian Champion deal applied!' }
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json()
    const clean = String(code || '').trim().toUpperCase()

    if (COUPONS[clean]) {
      return NextResponse.json({
        valid: true,
        code: clean,
        percent: COUPONS[clean].percent,
        message: COUPONS[clean].desc
      })
    }

    return NextResponse.json({
      valid: false,
      message: 'Invalid promo code. Try "LIFTZONE10" or scratch the gym chalk coupon above!'
    }, { status: 400 })
  } catch {
    return NextResponse.json({ valid: false, message: 'Invalid coupon request' }, { status: 400 })
  }
}
