import crypto from 'node:crypto'
import Razorpay from 'razorpay'

const keyId = process.env.RAZORPAY_KEY_ID ?? ''
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ''

/**
 * Razorpay is only wired up when both keys are present. Without them the site still
 * works end to end in "offline" mode: bookings are created and can be confirmed
 * manually, so the flow can be developed before the merchant account is live.
 */
export const razorpayEnabled = Boolean(keyId && keySecret)

const client = razorpayEnabled ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  if (!client) return null
  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
  })
  return order
}

/** HMAC-SHA256 of `order_id|payment_id`, as specified by Razorpay's checkout handshake. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!keySecret) return false
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return timingSafeEqual(expected, signature)
}

/** Webhook bodies are signed with the webhook secret over the raw request body. */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return timingSafeEqual(expected, signature)
}

function timingSafeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export const publicKeyId = keyId
