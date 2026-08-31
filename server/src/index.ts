import 'dotenv/config'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { DEITIES, EVENTS, SLABS } from './catalog.js'
import { db } from './db.js'
import { readSession } from './middleware/auth.js'
import { razorpayEnabled } from './razorpay.js'
import { adminRouter } from './routes/admin.js'
import { authRouter } from './routes/auth.js'
import { bookingsRouter } from './routes/bookings.js'
import { paymentsRouter, webhookRouter } from './routes/payments.js'

const app = express()
app.set('trust proxy', 1)

// The webhook needs the raw body for signature verification, so it is mounted
// before the JSON parser.
app.use('/api/payments/webhook', webhookRouter)

app.use(express.json({ limit: '64kb' }))
app.use(cookieParser())
app.use(readSession)

app.get('/api/health', (_req, res) => res.json({ ok: true, razorpayEnabled }))

app.get('/api/catalog', (_req, res) => {
  res.json({ deities: DEITIES, slabs: SLABS, events: EVENTS })
})

const messageLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true })

app.post('/api/messages', messageLimiter, (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(80),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
    email: z.string().trim().email().or(z.literal('')).optional(),
    message: z.string().trim().min(5, 'Please write your message.').max(1000),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const { name, mobile, email, message } = parsed.data
  db.prepare('INSERT INTO messages (name, mobile, email, message) VALUES (?, ?, ?, ?)').run(
    name,
    mobile,
    email || null,
    message,
  )
  res.status(201).json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/admin', adminRouter)

// In production the built frontend is served from the same origin.
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(process.cwd(), 'dist')
  app.use(express.static(dist))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server]', err)
  res.status(500).json({ error: 'Something went wrong at our end. Please try again.' })
})

const port = Number(process.env.PORT ?? 5174)
// 0.0.0.0 so phones and other machines on the same network can reach it.
const host = process.env.HOST ?? '0.0.0.0'

function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i !== undefined && i.family === 'IPv4' && !i.internal)
    .map((i) => i!.address)
}

app.listen(port, host, () => {
  console.log(`SriPrasadam API listening on http://localhost:${port}`)
  if (host === '0.0.0.0') {
    for (const address of lanAddresses()) {
      console.log(`  on your network: http://${address}:${port}`)
    }
  }
  if (!razorpayEnabled) {
    console.log('[razorpay] keys not set — running in offline mode (bookings are created, payment is skipped)')
  }
})
