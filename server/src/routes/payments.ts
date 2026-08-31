import { Router, raw } from 'express'
import { z } from 'zod'
import { db, recordStatus, type BookingRow } from '../db.js'
import { bookingConfirmedText, sendMessage } from '../notify.js'
import { verifyPaymentSignature, verifyWebhookSignature } from '../razorpay.js'

export const paymentsRouter = Router()

function confirm(row: BookingRow, paymentId: string) {
  if (row.payment_status === 'paid') return
  db.prepare(
    `UPDATE bookings
     SET payment_status = 'paid', status = 'booked', razorpay_payment_id = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(paymentId, row.id)
  recordStatus(row.id, 'booked', 'Payment received')
  void sendMessage({
    mobile: row.mobile,
    text: bookingConfirmedText(row.booking_ref, row.deity_name, row.amount_paise / 100),
    kind: 'booking_confirmed',
  })
}

paymentsRouter.post('/verify', (req, res) => {
  const schema = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Incomplete payment details.' })
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ error: 'Payment could not be verified. Please contact us before retrying.' })
  }

  const row = db.prepare('SELECT * FROM bookings WHERE razorpay_order_id = ?').get(razorpay_order_id) as
    | BookingRow
    | undefined
  if (!row) return res.status(404).json({ error: 'No booking found for this payment.' })

  confirm(row, razorpay_payment_id)
  res.json({ ok: true, ref: row.booking_ref })
})

paymentsRouter.post('/failed', (req, res) => {
  const orderId = String(req.body?.razorpay_order_id ?? '')
  if (orderId) {
    db.prepare(
      `UPDATE bookings SET payment_status = 'failed', updated_at = datetime('now')
       WHERE razorpay_order_id = ? AND payment_status = 'pending'`,
    ).run(orderId)
  }
  res.json({ ok: true })
})

/**
 * Webhook backstop: if the customer's browser closes between paying and the
 * verify call, Razorpay still tells us the payment captured.
 * Mounted with a raw body parser because the signature covers the exact bytes.
 */
export const webhookRouter = Router()

webhookRouter.post('/', raw({ type: '*/*' }), (req, res) => {
  const signature = req.header('x-razorpay-signature') ?? ''
  const rawBody = req.body as Buffer
  if (!verifyWebhookSignature(rawBody, signature)) return res.status(400).json({ error: 'invalid signature' })

  let event: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } }
  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'invalid payload' })
  }

  if (event.event === 'payment.captured') {
    const entity = event.payload?.payment?.entity
    if (entity?.order_id && entity.id) {
      const row = db.prepare('SELECT * FROM bookings WHERE razorpay_order_id = ?').get(entity.order_id) as
        | BookingRow
        | undefined
      if (row) confirm(row, entity.id)
    }
  }
  res.json({ ok: true })
})
