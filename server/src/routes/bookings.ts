import crypto from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { findDeity, findEvent, findSlab } from '../catalog.js'
import { db, recordStatus, upsertUser, type BookingRow } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { createOrder, publicKeyId, razorpayEnabled } from '../razorpay.js'

export const bookingsRouter = Router()

const createLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: true })

const bookingSchema = z.object({
  deityId: z.string().trim().min(1),
  slabId: z.string().trim().min(1),
  eventId: z.string().trim().optional().nullable(),
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(80),
  gotra: z.string().trim().min(2, 'Please enter your gotra.').max(60),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  address: z.string().trim().min(10, 'Please enter a complete delivery address.').max(400),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  pujaDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a puja date.'),
  notes: z.string().trim().max(300).optional().nullable(),
})

/** We currently perform puja and deliver only within Gurugram. */
const GURUGRAM_PINCODE = /^12[23]\d{3}$/

function newRef() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[crypto.randomInt(0, alphabet.length)]
  return `SP-${out}`
}

export function serialiseBooking(row: BookingRow) {
  const slab = findSlab(row.slab_id)
  const history = db
    .prepare('SELECT status, note, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY id')
    .all(row.id) as { status: string; note: string | null; created_at: string }[]
  return {
    ref: row.booking_ref,
    deityId: row.deity_id,
    deityName: row.deity_name,
    slabId: row.slab_id,
    slabTitle: slab?.title ?? row.slab_id,
    slabItems: slab?.items ?? [],
    amount: row.amount_paise / 100,
    fullName: row.full_name,
    gotra: row.gotra,
    mobile: row.mobile,
    address: row.address,
    city: row.city,
    pincode: row.pincode,
    pujaDate: row.puja_date,
    eventId: row.event_id,
    notes: row.notes,
    status: row.status,
    paymentStatus: row.payment_status,
    videoUrl: row.video_url,
    createdAt: row.created_at,
    history,
  }
}

bookingsRouter.post('/', createLimiter, async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const b = parsed.data

  const deity = findDeity(b.deityId)
  if (!deity) return res.status(400).json({ error: 'Please choose a deity to offer the prasadam to.' })
  const slab = findSlab(b.slabId)
  if (!slab) return res.status(400).json({ error: 'Please choose one of the listed offerings.' })
  if (b.eventId && !findEvent(b.eventId)) return res.status(400).json({ error: 'That puja is no longer listed.' })
  if (!GURUGRAM_PINCODE.test(b.pincode)) {
    return res.status(400).json({ error: 'We currently deliver only within Gurugram. Please call us for other areas.' })
  }

  const today = new Date().toISOString().slice(0, 10)
  if (b.pujaDate < today) return res.status(400).json({ error: 'Please choose today or a future date for the puja.' })

  // Price is taken from the server-side catalog — never from the request body.
  const amountPaise = slab.amount * 100
  const ref = newRef()
  const userId = req.session?.uid ?? upsertUser(b.mobile, b.fullName, b.gotra)

  const info = db
    .prepare(
      `INSERT INTO bookings
       (booking_ref, user_id, deity_id, deity_name, slab_id, amount_paise, full_name, gotra,
        mobile, address, city, pincode, puja_date, event_id, notes, payment_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Gurugram', ?, ?, ?, ?, ?)`,
    )
    .run(
      ref,
      userId,
      deity.id,
      deity.name,
      slab.id,
      amountPaise,
      b.fullName,
      b.gotra,
      b.mobile,
      b.address,
      b.pincode,
      b.pujaDate,
      b.eventId ?? null,
      b.notes ?? null,
      razorpayEnabled ? 'razorpay' : 'offline',
    )

  const bookingId = Number(info.lastInsertRowid)
  recordStatus(bookingId, 'pending_payment', 'Booking created, awaiting payment')

  let orderId: string | null = null
  if (razorpayEnabled) {
    try {
      const order = await createOrder(amountPaise, ref, {
        booking_ref: ref,
        deity: deity.name,
        gotra: b.gotra,
      })
      orderId = order?.id ?? null
      if (orderId) db.prepare('UPDATE bookings SET razorpay_order_id = ? WHERE id = ?').run(orderId, bookingId)
    } catch (err) {
      console.error('[razorpay] order creation failed', err)
      return res.status(502).json({ error: 'We could not reach the payment gateway. Please try again in a moment.' })
    }
  } else {
    // No merchant keys configured yet: record the booking as confirmed so the
    // rest of the journey (tracking, admin, video) is usable before going live.
    db.prepare(
      `UPDATE bookings SET status = 'booked', payment_status = 'offline', updated_at = datetime('now')
       WHERE id = ?`,
    ).run(bookingId)
    recordStatus(bookingId, 'booked', 'Recorded without online payment (gateway not configured)')
  }

  res.status(201).json({
    ref,
    amount: slab.amount,
    amountPaise,
    orderId,
    razorpayKeyId: publicKeyId || null,
    razorpayEnabled,
    prefill: { name: b.fullName, contact: b.mobile },
  })
})

bookingsRouter.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM bookings WHERE user_id = ? OR mobile = ? ORDER BY id DESC')
    .all(req.session!.uid, req.session!.mobile) as BookingRow[]
  res.json({ bookings: rows.map(serialiseBooking) })
})

const trackLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 30, standardHeaders: true })

/**
 * Public tracking: the booking reference alone is not enough — the mobile number
 * on the booking must match too, unless the signed-in user owns the booking.
 */
bookingsRouter.get('/:ref', trackLimiter, (req, res) => {
  const row = db.prepare('SELECT * FROM bookings WHERE booking_ref = ?').get(req.params.ref) as
    | BookingRow
    | undefined
  if (!row) return res.status(404).json({ error: 'No booking found with that reference.' })

  const ownedBySession = req.session && (row.user_id === req.session.uid || row.mobile === req.session.mobile)
  const mobileMatches = typeof req.query.mobile === 'string' && req.query.mobile === row.mobile
  if (!ownedBySession && !mobileMatches) {
    return res.status(403).json({ error: 'Enter the mobile number used for this booking.' })
  }
  res.json({ booking: serialiseBooking(row) })
})
