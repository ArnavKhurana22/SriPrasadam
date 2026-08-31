import { Router } from 'express'
import { z } from 'zod'
import { BOOKING_STATUSES, db, recordStatus, type BookingRow, type BookingStatus } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { sendMessage, statusUpdateText } from '../notify.js'
import { serialiseBooking } from './bookings.js'

export const adminRouter = Router()
adminRouter.use(requireAdmin)

adminRouter.get('/bookings', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  let sql = 'SELECT * FROM bookings WHERE 1=1'
  const params: unknown[] = []
  if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (q) {
    sql += ' AND (booking_ref LIKE ? OR full_name LIKE ? OR mobile LIKE ?)'
    const like = `%${q}%`
    params.push(like, like, like)
  }
  sql += ' ORDER BY id DESC LIMIT 200'

  const rows = db.prepare(sql).all(...params) as BookingRow[]
  const counts = db
    .prepare('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status')
    .all() as { status: string; n: number }[]

  res.json({ bookings: rows.map(serialiseBooking), counts })
})

adminRouter.patch('/bookings/:ref', (req, res) => {
  const schema = z.object({
    status: z.enum(BOOKING_STATUSES).optional(),
    videoUrl: z.string().trim().url('Enter a valid video link.').or(z.literal('')).optional(),
    note: z.string().trim().max(200).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const row = db.prepare('SELECT * FROM bookings WHERE booking_ref = ?').get(req.params.ref) as
    | BookingRow
    | undefined
  if (!row) return res.status(404).json({ error: 'Booking not found.' })

  const { status, videoUrl, note } = parsed.data

  if (videoUrl !== undefined) {
    db.prepare("UPDATE bookings SET video_url = ?, updated_at = datetime('now') WHERE id = ?").run(
      videoUrl || null,
      row.id,
    )
  }

  if (status && status !== row.status) {
    db.prepare("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, row.id)
    recordStatus(row.id, status as BookingStatus, note)
    if (['puja_done', 'dispatched', 'delivered'].includes(status)) {
      void sendMessage({
        mobile: row.mobile,
        text: statusUpdateText(row.booking_ref, status),
        kind: 'status_update',
      })
    }
  }

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(row.id) as BookingRow
  res.json({ booking: serialiseBooking(updated) })
})

adminRouter.get('/messages', (_req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 200').all()
  res.json({ messages: rows })
})
