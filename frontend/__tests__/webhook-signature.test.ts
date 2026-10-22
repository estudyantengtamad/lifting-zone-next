import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifyPaymongoSignature } from '../lib/payments/paymongo'

describe('PayMongo Webhook Signature Verification', () => {
  const secretKey = 'whsk_test_secret_key_12345'
  const sampleBody = JSON.stringify({
    data: {
      id: 'evt_123',
      type: 'event',
      attributes: {
        type: 'payment.paid',
        data: { id: 'pay_999' }
      }
    }
  })

  it('validates a correct HMAC signature with fresh timestamp', () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = `${timestamp}.${sampleBody}`
    const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
    const header = `t=${timestamp},te=${signature}`

    const isValid = verifyPaymongoSignature(sampleBody, header, secretKey)
    expect(isValid).toBe(true)
  })

  it('rejects a tampered body with an otherwise valid signature', () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = `${timestamp}.${sampleBody}`
    const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
    const header = `t=${timestamp},te=${signature}`

    const tamperedBody = sampleBody.replace('pay_999', 'pay_hacked')
    const isValid = verifyPaymongoSignature(tamperedBody, header, secretKey)
    expect(isValid).toBe(false)
  })

  it('rejects verification when tested against a wrong secret key', () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = `${timestamp}.${sampleBody}`
    const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
    const header = `t=${timestamp},te=${signature}`

    const isValid = verifyPaymongoSignature(sampleBody, header, 'wrong_secret_key')
    expect(isValid).toBe(false)
  })

  it('rejects when signature header is missing or empty', () => {
    expect(verifyPaymongoSignature(sampleBody, null, secretKey)).toBe(false)
    expect(verifyPaymongoSignature(sampleBody, '', secretKey)).toBe(false)
  })

  it('rejects replay attacks with timestamp older than 300 seconds', () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 400 // 400 seconds ago
    const payload = `${staleTimestamp}.${sampleBody}`
    const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
    const header = `t=${staleTimestamp},te=${signature}`

    const isValid = verifyPaymongoSignature(sampleBody, header, secretKey)
    expect(isValid).toBe(false)
  })
})
